use serde::{Serialize, Deserialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Song {
    pub id: String,
    pub name: String,
    pub artist: String,
    pub album: String,
    pub duration: u32,
    pub file_path: PathBuf,
}

impl Song {
    pub fn new(name: String, artist: String, album: String, duration: u32, file_path: PathBuf) -> Self {
        let id = uuid::Uuid::new_v4().to_string();
        Self {
            id,
            name,
            artist,
            album,
            duration,
            file_path,
        }
    }
}