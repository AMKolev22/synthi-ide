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
    /*
    let credentials = json!({
        "type": "service_account",
        "project_id": "overview-synti",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZ4GiBbEtfsT/j\nl1mnS2MRbjyDjU7wQGeBvi3TD4jmBcWi8EHzp+H1rIxj9fHWBHA2LhEiETN6Hw6z\n4MnEGSLCk+XsGWIJrzc4oX8RGpEg9XLFAHEszSVavaumS4KMSuYc8MTZYsfRjYHd\nZDlej5i8qFsEn9F+UO/oOo/gQuAV2/uiT19qZTs0biKiJKT5a22O44QzD1tk0Fah\nZyvjv1YLGuwnRVNipLFqzxQQOkcJhj3r2KX+BQ+CAseanMzBf3JL+L9tJnnxZ0kD\nW/BYbmvDx48HAhdUZhAv0t0ZL3+1NzW8emVzRuzcsRRlt2v1f69PscAJUmtiHV9E\nPE3Hn5jFAgMBAAECggEAGtFvpU7YfB8KQYI5T9zlsT4DMfJI1bqDz6rzlZtZgq1y\n2okBFZQm34hpF2rf8Sro26h/t+5DiH8tMtB0mca/tiXMpq9t1L5C443R9YspzBK7\nI/aFwwcmAYCZD+yNHiJXpKeZx0FeDfmZrpovHXntZsP4yP+JpXg5t8GtHarKH0To\nhuTcnqKo7BfSjN/sZMGnvIjyja7eACVJU5FG9nd7vNQekm0ZUxLXylOvzBIAW1Xx\nDba3HHX0YIL+nyleZvC4A4JrXE65iPU3dqQvbwkZNsfCTtaE6AFfKiVcAAXf2icw\nU57e8NoH5fwmQ+5VXofhD7jbG8N2+8vZp+552fD7AQKBgQDNdUg2n7SZR75MNwx2\nXusH1U8xrt9R3cE0QE0vFglG7HzkSICXIvYytrdZWyxA0WTaT+xMxDGO4L7Ohuqk\nk8OiJ1r3RblrmING2eXaMl2cEYsZAlRBnrykSDNAIj0kD9S0lGFve+wmxC5Jw7dr\n5BaqpKRwGwHIJ+oewjEst9gcpQKBgQC/usfgUdsXqj0GO1gqMgL2u2bjsWKQHd53\nIC4lsL5kXwj/nCougXtrRIh2n1Gcq17tGPKPkryT5QLnxUu9ZY+6WkNZSJhcfFS8\nXxStrWH8NgCMpFR1O5hREKCYlebXL2zCRTUZS4943E8Olj4CjxLfStuU8t/W1p+b\nsEGB9zIxoQKBgQC0WmSWlqDZALJaguQssGuOR8Ap88DTQ18K9/sI/0YLfSKw3bgL\nc8Q8hknyZWc2StlGDmx2gq6iJkU4VBR7fb54hCWE9C6s9YcfVb1ASYAEtR2uSW4e\n4DHl3/8lKCkVk9P65FmXnGeTLBkZ5XUIf4MqLjautfZddjQ85eh2wbcyhQKBgEHw\n74WLIZtGBa77AhuhD7vkQELXY1rFqxm1i6mS3CiRNvsSrr9H8Ta3X2fM67jCh+dr\nySDwCsOi5Bjqll4RbBlfqgIvIZfNeyc+XFJPa3/e4tl8O0AGuyBGY7WW+MnRmcpH\nGzgT8MhUnSwbKEChDJCXomXcEnhFYKefOyiD6FOBAoGAfiXxNfmK6iTGqG3A+HHI\n1TupEEPZudygJ2Awd1+22iy5++0BqvMf3o0j0JP0u8ArwkcVDWNuLWrpI6aHZIb8\nVb34haFWR82J/tX2NTq9zAQq//d8OAgEH6PDb0K2YlQVOSmPcYWqd7aGVGMW5+QO\nhZeaOzLwbJLOa36t6Ph+70c=\n-----END PRIVATE KEY-----\n",
        "client_email": "file-uploader-service@overview-synti.iam.gserviceaccount.com",
        "client_id": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": ""
    }); */
    // Forward WebSocket input to PTY and handle download
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
                            Ok(()) => {
                                let success_msg = format!(
                                    "✅ Download completed and working directory changed to '{}'\n",
                                    slug
                                );
                                if input_tx.send(success_msg.as_bytes().to_vec()).is_err() {
                                    println!("📥 Input channel closed");
                                    break;
                                }
                            }
                            Err(e) => {
                                let error_msg = format!("❌ Download failed: {}\n", e);
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
