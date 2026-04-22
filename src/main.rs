mod models;
mod protocol;
mod server;

use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use server::AppState;
use protocol::{ClientRequest, ServerResponse};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Servidor escuchando en puerto 8080");
    
    let state = Arc::new(Mutex::new(AppState::new()));
    
    loop {
        let (socket, addr) = listener.accept().await?;
        println!("Cliente conectado: {}", addr);
        
        let state = Arc::clone(&state);
        
        tokio::spawn(async move {
            handle_client(socket, state).await;
        });
    }
}

async fn handle_client(mut socket: TcpStream, state: Arc<Mutex<AppState>>) {
    let mut buffer = [0u8; 4096];
    
    loop {
        match socket.read(&mut buffer).await {
            Ok(0) => {
                println!("Cliente desconectado");
                break;
            }
            Ok(n) => {
                let request_str = String::from_utf8_lossy(&buffer[..n]);
                match serde_json::from_str::<ClientRequest>(&request_str) {
                    Ok(request) => {
                        let current_state = state.lock().await;
                        let (response, new_state) = current_state.process_request(request);
                        
                        if let Some(new_state) = new_state {
                            *state.lock().await = new_state;
                        }
                        
                        let response_json = serde_json::to_string(&response).unwrap();
                        if let Err(e) = socket.write_all(response_json.as_bytes()).await {
                            eprintln!("Error al enviar respuesta: {}", e);
                            break;
                        }
                    }
                    Err(e) => {
                        eprintln!("Error al parsear request: {}", e);
                        let error_response = ServerResponse::Error {
                            code: 400,
                            message: "Invalid request format".to_string(),
                        };
                        let response_json = serde_json::to_string(&error_response).unwrap();
                        let _ = socket.write_all(response_json.as_bytes()).await;
                    }
                }
            }
            Err(e) => {
                eprintln!("Error leyendo socket: {}", e);
                break;
            }
        }
    }
}