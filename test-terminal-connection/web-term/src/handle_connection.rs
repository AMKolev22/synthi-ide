use crate::download::download;

use futures_util::SinkExt;
use futures_util::StreamExt;
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tokio::sync::mpsc;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message;

pub async fn handle_connection(
    stream: tokio::net::TcpStream,
) -> Result<(), Box<dyn std::error::Error>> {
    let ws_stream = accept_async(stream).await?;
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    println!("✅ WebSocket connection established");

    // Create PTY
    let pty_system = native_pty_system();
    let pair = pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    })?;

    // Use the appropriate shell for the OS
    let shell = if cfg!(target_os = "windows") {
        "powershell.exe" // or "cmd.exe" if you prefer
    } else {
        "bash"
    };

    println!("🐚 Starting shell: {}", shell);

    let mut cmd = CommandBuilder::new(shell);

    if cfg!(target_os = "windows") && shell == "powershell.exe" {
        cmd.arg("-NoLogo");
        cmd.arg("-NoExit");
    }

    // Set custom environment variables for the shell
    cmd.env("USER", "synthi");
    cmd.env("LOGNAME", "synthi");
    cmd.env("HOME", "/home/synthi");
    
    // Set custom PS1 prompt for bash
    if !cfg!(target_os = "windows") {
        cmd.env("PS1", r"\[\e[32m\]synthi@synthi-cloud\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ ");
    }

    let mut child = pair.slave.spawn_command(cmd)?;
    let mut reader = pair.master.try_clone_reader()?;
    let mut writer = pair.master.take_writer()?;

    // Channels for bridging blocking I/O and async WebSocket
    let (output_tx, mut output_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let (input_tx, mut input_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let (progress_tx, mut progress_rx) = mpsc::unbounded_channel::<String>();

    // Task 1: Read from PTY (blocking) and send to channel
    let read_task = tokio::task::spawn_blocking(move || {
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    println!("📖 PTY read: EOF");
                    break;
                }
                Ok(n) => {
                    println!("📖 PTY read: {} bytes", n);
                    if output_tx.send(buf[..n].to_vec()).is_err() {
                        println!("📖 PTY read: channel closed");
                        break; // Channel closed
                    }
                }
                Err(e) => {
                    eprintln!("❌ PTY read error: {}", e);
                    break;
                }
            }
        }
        println!("📖 PTY read task exiting");
    });

    // Task 2: Write to PTY (blocking) from channel
    let write_task = tokio::task::spawn_blocking(move || {
        while let Some(data) = input_rx.blocking_recv() {
            println!("✍️  PTY write: {} bytes", data.len());
            if let Err(e) = writer.write_all(&data) {
                eprintln!("❌ PTY write error: {}", e);
                break;
            }
            if let Err(e) = writer.flush() {
                eprintln!("❌ PTY flush error: {}", e);
                break;
            }
        }
        println!("✍️  PTY write task exiting");
    });

    // Forward PTY output to WebSocket
    let ws_send_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                data = output_rx.recv() => {
                    if let Some(data) = data {
                        println!("📤 Sending to WebSocket: {} bytes", data.len());
                        if let Err(e) = ws_sender.send(Message::Binary(data)).await {
                            eprintln!("❌ WebSocket send error: {}", e);
                            break;
                        }
                    } else {
                        break;
                    }
                }
                progress_msg = progress_rx.recv() => {
                    if let Some(msg) = progress_msg {
                        println!("📊 Sending progress: {}", msg);
                        if let Err(e) = ws_sender.send(Message::Text(msg)).await {
                            eprintln!("❌ WebSocket progress send error: {}", e);
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
        }
        println!("📤 WebSocket send task exiting");
    });

    // Forward WebSocket input to PTY and handle download
    let ws_recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Binary(data)) => {
                    println!("📥 Received binary message: {} bytes", data.len());

                    // Debug: Show what was typed (if valid UTF-8)
                    if let Ok(text) = String::from_utf8(data.clone()) {
                        // Show printable characters, escape control chars
                        let display: String = text
                            .chars()
                            .take(50)
                            .map(|c| {
                                if c.is_control() {
                                    format!("\\x{:02x}", c as u8)
                                } else {
                                    c.to_string()
                                }
                            })
                            .collect();
                        println!("   Content: {}", display);
                    }

                    if input_tx.send(data).is_err() {
                        println!("📥 Input channel closed");
                        break;
                    }
                }
                Ok(Message::Text(text)) => {
                    println!("📥 Received text message: {:?}", text);

                    // Auto-trigger download with the received text as slug
                    let slug = text.trim();
                    if !slug.is_empty() {
                        println!("🚀 Auto-downloading from GCP bucket for slug: {}", slug);
                        match download(slug, Some(progress_tx.clone())).await {
                            Ok(download_path) => {
                                // Send cd command to the shell to navigate to the downloaded directory
                                let cd_command = format!("cd {}\n", download_path.display());
                                println!("📂 Sending cd command: {}", cd_command.trim());
                                
                                if input_tx.send(cd_command.as_bytes().to_vec()).is_err() {
                                    println!("📥 Input channel closed");
                                    break;
                                }
                                
                                // Send a success message
                                let success_msg = format!(
                                    "\r\n✅ Download completed! Now in: {}\r\n",
                                    download_path.display()
                                );
                                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                                if input_tx.send(success_msg.as_bytes().to_vec()).is_err() {
                                    println!("📥 Input channel closed");
                                    break;
                                }
                            }
                            Err(e) => {
                                let error_msg = format!("\r\n❌ Download failed: {}\r\n", e);
                                if input_tx.send(error_msg.as_bytes().to_vec()).is_err() {
                                    println!("📥 Input channel closed");
                                    break;
                                }
                            }
                        }
                    }
                }
                Ok(Message::Close(frame)) => {
                    println!("🔴 Close message received: {:?}", frame);
                    break;
                }
                Ok(Message::Ping(data)) => {
                    println!("🏓 Ping received: {} bytes", data.len());
                }
                Ok(Message::Pong(data)) => {
                    println!("🏓 Pong received: {} bytes", data.len());
                }
                Err(e) => {
                    eprintln!("❌ WebSocket receive error: {}", e);
                    break;
                }
                _ => {
                    println!("❓ Other message type received");
                }
            }
        }
        println!("📥 WebSocket receive task exiting");
    });

    // Wait for any task to complete (indicates connection should close)
    tokio::select! {
        _ = read_task => println!("PTY read task ended"),
        _ = write_task => println!("PTY write task ended"),
        _ = ws_send_task => println!("WebSocket send task ended"),
        _ = ws_recv_task => println!("WebSocket receive task exiting"),
    }

    // Cleanup
    println!("🧹 Cleaning up...");
    let _ = child.kill();
    let _ = child.wait();
    println!("Connection closed");

    Ok(())
}
