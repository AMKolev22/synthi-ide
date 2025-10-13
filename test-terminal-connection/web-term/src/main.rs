mod handle_connection;
mod download;

use tokio::net::TcpListener;
use handle_connection::handle_connection;

#[tokio::main]
async fn main() {

    // this is so it can accept other requests too
    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();

    while let Ok((stream, addr)) = listener.accept().await {
        println!("New connection from: {}", addr);
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream).await {
                eprintln!("Connection error: {}", e);
            }
        });
    }
}
