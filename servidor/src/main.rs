use std::io::prelude::*;
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Cancion {
    id: String,
    nombre: String,
    artista: String,
    album: String,
    duracion: u32,
    ruta: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Playlist {
    id: String,
    nombre: String,
    canciones_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CancionesData {
    canciones: Vec<Cancion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
enum MensajeCliente {
    ObtenerTodas,
    ObtenerPlaylists,
    CrearPlaylist(String),
    EliminarPlaylist(String),
    AgregarAPlaylist { playlist_id: String, cancion_id: String },
    EliminarDePlaylist { playlist_id: String, cancion_id: String },
    ObtenerCancionesDePlaylist(String),
    BuscarPorNombre(String),
    BuscarPorArtista(String),
    BuscarPorAlbum(String),
    AgregarCancion(Cancion),
    EliminarCancion(String),
    IniciarReproduccion(String),
    DetenerReproduccion(String),
    OrdenarPlaylist { playlist_id: String, criterio: String },
    FiltrarEnPlaylist { playlist_id: String, termino: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
enum MensajeServidor {
    Canciones(Vec<Cancion>),
    Playlists(Vec<Playlist>),
    PlaylistCanciones(Vec<Cancion>),
    Exito(String),
    Error(String),
}

struct AppState {
    canciones: HashMap<String, Cancion>,
    playlists: HashMap<String, Playlist>,
    reproduciendo: HashSet<String>,
}

impl AppState {
    fn new() -> Self {
        let mut state = Self {
            canciones: HashMap::new(),
            playlists: HashMap::new(),
            reproduciendo: HashSet::new(),
        };
        
        // Cargar canciones SOLO desde canciones.json
        state.cargar_canciones_desde_json();
        
        // Cargar playlists guardadas (si existen)
        state.cargar_playlists_guardadas();
        
        state
    }
    
    fn cargar_canciones_desde_json(&mut self) {
        let ruta_json = Path::new("canciones.json");
        
        if !ruta_json.exists() {
            eprintln!("❌ ERROR: No se encontró el archivo canciones.json");
            eprintln!("   El archivo debe estar en la misma carpeta que el ejecutable");
            return;
        }
        
        println!("📀 Cargando canciones desde canciones.json...");
        
        match File::open(ruta_json) {
            Ok(file) => {
                let reader = BufReader::new(file);
                match serde_json::from_reader::<_, CancionesData>(reader) {
                    Ok(data) => {
                        for cancion in data.canciones {
                            println!("   🎵 {} - {} ({}:{:02})", 
                                cancion.nombre, 
                                cancion.artista,
                                cancion.duracion / 60,
                                cancion.duracion % 60
                            );
                            self.canciones.insert(cancion.id.clone(), cancion);
                        }
                        println!("✅ Cargadas {} canciones desde canciones.json", self.canciones.len());
                    }
                    Err(e) => {
                        eprintln!("❌ Error al parsear canciones.json: {}", e);
                        eprintln!("   Verifica que el JSON tenga el formato correcto");
                    }
                }
            }
            Err(e) => {
                eprintln!("❌ Error al abrir canciones.json: {}", e);
            }
        }
    }
    
    fn cargar_playlists_guardadas(&mut self) {
        let ruta_playlists = Path::new("playlists_guardadas.json");
        if ruta_playlists.exists() {
            if let Ok(file) = File::open(ruta_playlists) {
                let reader = BufReader::new(file);
                if let Ok(playlists_vec) = serde_json::from_reader::<_, Vec<Playlist>>(reader) {
                    for playlist in playlists_vec {
                        self.playlists.insert(playlist.id.clone(), playlist);
                    }
                    println!("📋 Cargadas {} playlists guardadas", self.playlists.len());
                }
            }
        }
    }
    
    fn guardar_playlists(&self) {
        let playlists_vec: Vec<Playlist> = self.playlists.values().cloned().collect();
        if let Ok(file) = File::create("playlists_guardadas.json") {
            let _ = serde_json::to_writer_pretty(file, &playlists_vec);
            println!("💾 Guardadas {} playlists", playlists_vec.len());
        }
    }
    
    fn guardar_canciones(&self) {
        let canciones_vec: Vec<Cancion> = self.canciones.values().cloned().collect();
        if let Ok(file) = File::create("canciones_guardadas_backup.json") {
            let _ = serde_json::to_writer_pretty(file, &canciones_vec);
            // Esto es solo backup, no sobreescribimos canciones.json original
        }
    }
}

fn ordenar_canciones(canciones: &mut Vec<Cancion>, criterio: &str) {
    match criterio {
        "nombre" => canciones.sort_by(|a, b| a.nombre.to_lowercase().cmp(&b.nombre.to_lowercase())),
        "artista" => canciones.sort_by(|a, b| a.artista.to_lowercase().cmp(&b.artista.to_lowercase())),
        "album" => canciones.sort_by(|a, b| a.album.to_lowercase().cmp(&b.album.to_lowercase())),
        _ => {}
    }
}

// Función para servir archivos de audio
fn servir_audio(mut stream: TcpStream, nombre_archivo: &str) {
    let ruta = Path::new("audio").join(nombre_archivo);
    
    println!("🎵 Solicitando audio: {}", ruta.display());
    
    if ruta.exists() {
        if let Ok(mut file) = File::open(&ruta) {
            let mut buffer = Vec::new();
            if file.read_to_end(&mut buffer).is_ok() {
                let response = format!(
                    "HTTP/1.1 200 OK\r\n\
                    Content-Type: audio/mpeg\r\n\
                    Content-Length: {}\r\n\
                    Accept-Ranges: bytes\r\n\
                    Cache-Control: no-cache\r\n\
                    Access-Control-Allow-Origin: *\r\n\
                    \r\n",
                    buffer.len()
                );
                let _ = stream.write_all(response.as_bytes());
                let _ = stream.write_all(&buffer);
                println!("✅ Audio enviado: {} ({} bytes)", nombre_archivo, buffer.len());
                return;
            }
        }
    }
    
    println!("❌ Audio no encontrado: {}", nombre_archivo);
    let response = "HTTP/1.1 404 Not Found\r\n\r\n";
    let _ = stream.write_all(response.as_bytes());
}

fn procesar_mensaje(json: &str, estado: &Arc<Mutex<AppState>>) -> MensajeServidor {
    // Manejar strings simples
    if json == "\"ObtenerTodas\"" || json == "ObtenerTodas" {
        let mut e = estado.lock().unwrap();
        let mut canciones: Vec<Cancion> = e.canciones.values().cloned().collect();
        ordenar_canciones(&mut canciones, "nombre");
        return MensajeServidor::Canciones(canciones);
    }
    
    if json == "\"ObtenerPlaylists\"" || json == "ObtenerPlaylists" {
        let e = estado.lock().unwrap();
        let playlists: Vec<Playlist> = e.playlists.values().cloned().collect();
        return MensajeServidor::Playlists(playlists);
    }
    
    let msg: MensajeCliente = match serde_json::from_str(json) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("❌ Error parseando JSON: {}", e);
            return MensajeServidor::Error(format!("JSON inválido: {}", e));
        }
    };
    
    let respuesta = match msg {
        MensajeCliente::ObtenerTodas => {
            let mut e = estado.lock().unwrap();
            let mut canciones: Vec<Cancion> = e.canciones.values().cloned().collect();
            ordenar_canciones(&mut canciones, "nombre");
            MensajeServidor::Canciones(canciones)
        }
        MensajeCliente::ObtenerPlaylists => {
            let e = estado.lock().unwrap();
            let playlists: Vec<Playlist> = e.playlists.values().cloned().collect();
            MensajeServidor::Playlists(playlists)
        }
        MensajeCliente::CrearPlaylist(nombre) => {
            let mut e = estado.lock().unwrap();
            let playlist = Playlist {
                id: Uuid::new_v4().to_string(),
                nombre: nombre.clone(),
                canciones_ids: vec![],
            };
            let id = playlist.id.clone();
            e.playlists.insert(id, playlist);
            e.guardar_playlists();
            MensajeServidor::Exito(format!("Playlist '{}' creada", nombre))
        }
        MensajeCliente::EliminarPlaylist(id) => {
            let mut e = estado.lock().unwrap();
            if e.playlists.remove(&id).is_some() {
                e.guardar_playlists();
                MensajeServidor::Exito("Playlist eliminada".to_string())
            } else {
                MensajeServidor::Error("Playlist no encontrada".to_string())
            }
        }
        MensajeCliente::AgregarAPlaylist { playlist_id, cancion_id } => {
            let mut e = estado.lock().unwrap();
            if let Some(playlist) = e.playlists.get_mut(&playlist_id) {
                if !playlist.canciones_ids.contains(&cancion_id) {
                    playlist.canciones_ids.push(cancion_id);
                    e.guardar_playlists();
                    MensajeServidor::Exito("Canción agregada a la playlist".to_string())
                } else {
                    MensajeServidor::Error("La canción ya está en esta playlist".to_string())
                }
            } else {
                MensajeServidor::Error("Playlist no encontrada".to_string())
            }
        }
        MensajeCliente::EliminarDePlaylist { playlist_id, cancion_id } => {
            let mut e = estado.lock().unwrap();
            if let Some(playlist) = e.playlists.get_mut(&playlist_id) {
                playlist.canciones_ids.retain(|id| id != &cancion_id);
                e.guardar_playlists();
                MensajeServidor::Exito("Canción eliminada de la playlist".to_string())
            } else {
                MensajeServidor::Error("Playlist no encontrada".to_string())
            }
        }
        MensajeCliente::ObtenerCancionesDePlaylist(playlist_id) => {
            let e = estado.lock().unwrap();
            if let Some(playlist) = e.playlists.get(&playlist_id) {
                let mut canciones: Vec<Cancion> = playlist.canciones_ids
                    .iter()
                    .filter_map(|id| e.canciones.get(id))
                    .cloned()
                    .collect();
                ordenar_canciones(&mut canciones, "nombre");
                MensajeServidor::PlaylistCanciones(canciones)
            } else {
                MensajeServidor::PlaylistCanciones(vec![])
            }
        }
        MensajeCliente::BuscarPorNombre(q) => {
            let e = estado.lock().unwrap();
            let q_lower = q.to_lowercase();
            let mut canciones: Vec<Cancion> = e.canciones
                .values()
                .filter(|c| c.nombre.to_lowercase().contains(&q_lower))
                .cloned()
                .collect();
            ordenar_canciones(&mut canciones, "nombre");
            MensajeServidor::Canciones(canciones)
        }
        MensajeCliente::BuscarPorArtista(q) => {
            let e = estado.lock().unwrap();
            let q_lower = q.to_lowercase();
            let mut canciones: Vec<Cancion> = e.canciones
                .values()
                .filter(|c| c.artista.to_lowercase().contains(&q_lower))
                .cloned()
                .collect();
            ordenar_canciones(&mut canciones, "nombre");
            MensajeServidor::Canciones(canciones)
        }
        MensajeCliente::BuscarPorAlbum(q) => {
            let e = estado.lock().unwrap();
            let q_lower = q.to_lowercase();
            let mut canciones: Vec<Cancion> = e.canciones
                .values()
                .filter(|c| c.album.to_lowercase().contains(&q_lower))
                .cloned()
                .collect();
            ordenar_canciones(&mut canciones, "nombre");
            MensajeServidor::Canciones(canciones)
        }
        MensajeCliente::AgregarCancion(cancion) => {
            let mut e = estado.lock().unwrap();
            e.canciones.insert(cancion.id.clone(), cancion);
            e.guardar_canciones();
            MensajeServidor::Exito("Canción agregada".to_string())
        }
        MensajeCliente::EliminarCancion(id) => {
            let mut e = estado.lock().unwrap();
            if e.canciones.remove(&id).is_some() {
                // También eliminar de todas las playlists
                for playlist in e.playlists.values_mut() {
                    playlist.canciones_ids.retain(|cid| cid != &id);
                }
                e.guardar_playlists();
                e.guardar_canciones();
                MensajeServidor::Exito("Canción eliminada".to_string())
            } else {
                MensajeServidor::Error("Canción no encontrada".to_string())
            }
        }
        MensajeCliente::IniciarReproduccion(id) => {
            let mut e = estado.lock().unwrap();
            e.reproduciendo.insert(id);
            MensajeServidor::Exito("Reproducción iniciada".to_string())
        }
        MensajeCliente::DetenerReproduccion(id) => {
            let mut e = estado.lock().unwrap();
            e.reproduciendo.remove(&id);
            MensajeServidor::Exito("Reproducción detenida".to_string())
        }
        MensajeCliente::OrdenarPlaylist { playlist_id, criterio } => {
            let e = estado.lock().unwrap();
            if let Some(playlist) = e.playlists.get(&playlist_id) {
                let mut canciones: Vec<Cancion> = playlist.canciones_ids
                    .iter()
                    .filter_map(|id| e.canciones.get(id))
                    .cloned()
                    .collect();
                ordenar_canciones(&mut canciones, &criterio);
                MensajeServidor::PlaylistCanciones(canciones)
            } else {
                MensajeServidor::Error("Playlist no encontrada".to_string())
            }
        }
        MensajeCliente::FiltrarEnPlaylist { playlist_id, termino } => {
            let e = estado.lock().unwrap();
            let termino_lower = termino.to_lowercase();
            if let Some(playlist) = e.playlists.get(&playlist_id) {
                let mut canciones: Vec<Cancion> = playlist.canciones_ids
                    .iter()
                    .filter_map(|id| e.canciones.get(id))
                    .filter(|c| {
                        c.nombre.to_lowercase().contains(&termino_lower) ||
                        c.artista.to_lowercase().contains(&termino_lower) ||
                        c.album.to_lowercase().contains(&termino_lower)
                    })
                    .cloned()
                    .collect();
                ordenar_canciones(&mut canciones, "nombre");
                MensajeServidor::PlaylistCanciones(canciones)
            } else {
                MensajeServidor::PlaylistCanciones(vec![])
            }
        }
    };
    
    respuesta
}

fn manejar_conexion(mut stream: TcpStream, estado: Arc<Mutex<AppState>>) {
    let mut buffer = [0; 32768];
    if let Ok(n) = stream.read(&mut buffer) {
        let request = String::from_utf8_lossy(&buffer[..n]);
        
        // Servir archivos de audio
        if request.starts_with("GET /audio/") {
            let nombre_archivo = request
                .lines()
                .next()
                .and_then(|line| line.split_whitespace().nth(1))
                .and_then(|path| path.strip_prefix("/audio/"))
                .unwrap_or("");
            servir_audio(stream, nombre_archivo);
            return;
        }
        
        // Manejar CORS preflight
        if request.starts_with("OPTIONS") {
            let response = "HTTP/1.1 200 OK\r\n\
                Access-Control-Allow-Origin: *\r\n\
                Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n\
                Access-Control-Allow-Headers: Content-Type\r\n\
                Content-Length: 0\r\n\
                \r\n";
            let _ = stream.write_all(response.as_bytes());
            return;
        }
        
        // Procesar mensajes API
        if let Some(body_start) = request.find("\r\n\r\n") {
            let json = &request[body_start + 4..].trim();
            if !json.is_empty() {
                let respuesta = procesar_mensaje(json, &estado);
                let response_json = serde_json::to_string(&respuesta).unwrap_or_default();
                
                let response = format!(
                    "HTTP/1.1 200 OK\r\n\
                    Access-Control-Allow-Origin: *\r\n\
                    Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n\
                    Access-Control-Allow-Headers: Content-Type\r\n\
                    Content-Type: application/json\r\n\
                    Content-Length: {}\r\n\
                    \r\n\
                    {}",
                    response_json.len(),
                    response_json
                );
                let _ = stream.write_all(response.as_bytes());
            }
        }
    }
}

fn main() {
    let estado = Arc::new(Mutex::new(AppState::new()));
    
    // Verificar si se cargaron canciones
    {
        let e = estado.lock().unwrap();
        if e.canciones.is_empty() {
            println!();
            println!("╔══════════════════════════════════════════════════════════════╗");
            println!("║  ⚠️  ADVERTENCIA: No se cargaron canciones                    ║");
            println!("║                                                              ║");
            println!("║  Asegúrate de que el archivo 'canciones.json' exista y       ║");
            println!("║  tenga el formato correcto.                                  ║");
            println!("║                                                              ║");
            println!("║  Formato esperado:                                           ║");
            println!("║  {{                                                          ║");
            println!("║    \"canciones\": [                                           ║");
            println!("║      {{                                                      ║");
            println!("║        \"id\": \"1\",                                         ║");
            println!("║        \"nombre\": \"Canción\",                               ║");
            println!("║        \"artista\": \"Artista\",                              ║");
            println!("║        \"album\": \"Álbum\",                                  ║");
            println!("║        \"duracion\": 200,                                    ║");
            println!("║        \"ruta\": \"http://127.0.0.1:8080/audio/archivo.mp3\" ║");
            println!("║      }}                                                      ║");
            println!("║    ]                                                         ║");
            println!("║  }}                                                          ║");
            println!("╚══════════════════════════════════════════════════════════════╝");
            println!();
        } else {
            println!("✅ Servidor iniciado con {} canciones", e.canciones.len());
        }
    }
    
    let listener = TcpListener::bind("127.0.0.1:8080").expect("❌ No se pudo iniciar el servidor");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("🎵  SpotiCry Server v2.0");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("📍 Servidor corriendo en: http://127.0.0.1:8080");
    println!("📁 Carpeta de audio: ./audio/");
    println!("📄 Fuente de canciones: canciones.json");
    println!("💾 Playlists se guardan en: playlists_guardadas.json");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("🎧 Esperando conexiones...\n");
    
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                let estado = Arc::clone(&estado);
                std::thread::spawn(move || manejar_conexion(stream, estado));
            }
            Err(e) => eprintln!("❌ Error en conexión: {}", e),
        }
    }
}