use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message;
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use futures_util::StreamExt;
use futures_util::SinkExt;
use std::io::{Read, Write};
use tokio::sync::mpsc;

pub async fn handle_connection(stream: tokio::net::TcpStream) -> Result<(), Box<dyn std::error::Error>> {
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
        "powershell.exe"  // or "cmd.exe" if you prefer
    } else {
        "bash"
    };

    println!("🐚 Starting shell: {}", shell);

    let mut cmd = CommandBuilder::new(shell);
    
    if cfg!(target_os = "windows") && shell == "powershell.exe" {
        cmd.arg("-NoLogo");
        cmd.arg("-NoExit");
    }

    let mut child = pair.slave.spawn_command(cmd)?;
    let mut reader = pair.master.try_clone_reader()?;
    let mut writer = pair.master.take_writer()?;

    // Channels for bridging blocking I/O and async WebSocket
    let (output_tx, mut output_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let (input_tx, mut input_rx) = mpsc::unbounded_channel::<Vec<u8>>();

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
        while let Some(data) = output_rx.recv().await {
            println!("📤 Sending to WebSocket: {} bytes", data.len());
            if let Err(e) = ws_sender.send(Message::Binary(data)).await {
                eprintln!("❌ WebSocket send error: {}", e);
                break;
            }
        }
        println!("📤 WebSocket send task exiting");
    });

    // Forward WebSocket input to PTY
    let ws_recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Binary(data)) => {
                    println!("📥 Received binary message: {} bytes", data.len());
                    
                    // Debug: Show what was typed (if valid UTF-8)
                    if let Ok(text) = String::from_utf8(data.clone()) {
                        // Show printable characters, escape control chars
                        let display: String = text.chars()
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
                    
                    if input_tx.send(text.into_bytes()).is_err() {
                        println!("📥 Input channel closed");
                        break;
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
        _ = ws_recv_task => println!("WebSocket receive task ended"),
    }

    // Cleanup
    println!("🧹 Cleaning up...");
    let _ = child.kill();
    let _ = child.wait();
    println!("Connection closed");

    Ok(())
}
