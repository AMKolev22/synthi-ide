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
                Ok(0) => break,
                Ok(n) => {
                    if output_tx.send(buf[..n].to_vec()).is_err() {
                        break; // Channel closed
                    }
                }
                Err(e) => {
                    eprintln!("PTY read error: {}", e);
                    break;
                }
            }
        }
    });

    // Task 2: Write to PTY (blocking) from channel
    let write_task = tokio::task::spawn_blocking(move || {
        while let Some(data) = input_rx.blocking_recv() {
            if let Err(e) = writer.write_all(&data) {
                eprintln!("PTY write error: {}", e);
                break;
            }
            if let Err(e) = writer.flush() {
                eprintln!("PTY flush error: {}", e);
                break;
            }
        }
    });

    // Forward PTY output to WebSocket
    let ws_send_task = tokio::spawn(async move {
        while let Some(data) = output_rx.recv().await {
            if let Err(e) = ws_sender.send(Message::Binary(data)).await {
                eprintln!("WebSocket send error: {}", e);
                break;
            }
        }
    });

    // Forward WebSocket input to PTY
    let ws_recv_task = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Binary(data)) => {
                    if input_tx.send(data).is_err() {
                        break; // Channel closed
                    }
                }
                Ok(Message::Text(text)) => {
                    // xterm.js might send text messages too
                    if input_tx.send(text.into_bytes()).is_err() {
                        break;
                    }
                }
                Ok(Message::Close(_)) => break,
                Err(e) => {
                    eprintln!("WebSocket receive error: {}", e);
                    break;
                }
                _ => {}
            }
        }
    });

    // Wait for any task to complete (indicates connection should close)
    tokio::select! {
        _ = read_task => println!("PTY read task ended"),
        _ = write_task => println!("PTY write task ended"),
        _ = ws_send_task => println!("WebSocket send task ended"),
        _ = ws_recv_task => println!("WebSocket receive task ended"),
    }

    // Cleanup
    let _ = child.kill();
    let _ = child.wait();
    println!("Connection closed");

    Ok(())
}