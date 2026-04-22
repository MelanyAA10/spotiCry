use serde::{Serialize, Deserialize};
use crate::models::Song;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClientRequest {
    // Búsquedas
    SearchByName(String),
    SearchByArtist(String),
    SearchByAlbum(String),
    SearchByDuration { min: u32, max: u32 },
    
    // Playlists
    CreatePlaylist(String),
    GetPlaylists,
    AddToPlaylist { playlist_id: String, song_id: String },
    RemoveFromPlaylist { playlist_id: String, song_id: String },
    GetPlaylistSongs(String),
    
    // Canciones
    GetAllSongs,
    GetSongById(String),
    PlaySong(String),  // ID de la canción
    StopPlayback,
    
    // Admin
    AddSong(Song),
    RemoveSong(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServerResponse {
    Success { message: String, data: Option<String> },
    SongsList(Vec<Song>),
    PlaylistsList(Vec<crate::models::Playlist>),
    PlaylistSongs(Vec<String>),
    SongData { song_id: String, audio_data: Vec<u8> },
    Error { code: u16, message: String },
    Ack,
}