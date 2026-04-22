use std::collections::HashMap;
use crate::models::{Song, Playlist};
use crate::protocol::{ClientRequest, ServerResponse};

#[derive(Debug, Clone)]
pub struct AppState {
    pub songs: HashMap<String, Song>,
    pub playlists: HashMap<String, Playlist>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            songs: HashMap::new(),
            playlists: HashMap::new(),
        }
    }
    
    // Búsquedas funcionales usando filter
    pub fn search_by_name(&self, name: &str) -> Vec<Song> {
        self.songs
            .values()
            .filter(|song| song.name.to_lowercase().contains(&name.to_lowercase()))
            .cloned()
            .collect()
    }
    
    pub fn search_by_artist(&self, artist: &str) -> Vec<Song> {
        self.songs
            .values()
            .filter(|song| song.artist.to_lowercase().contains(&artist.to_lowercase()))
            .cloned()
            .collect()
    }
    
    pub fn search_by_album(&self, album: &str) -> Vec<Song> {
        self.songs
            .values()
            .filter(|song| song.album.to_lowercase().contains(&album.to_lowercase()))
            .cloned()
            .collect()
    }
    
    // Agregar canción (inmutable - retorna nuevo estado)
    pub fn add_song(&self, song: Song) -> Self {
        let mut new_songs = self.songs.clone();
        new_songs.insert(song.id.clone(), song);
        AppState {
            songs: new_songs,
            playlists: self.playlists.clone(),
        }
    }
    
    // Eliminar canción (inmutable)
    pub fn remove_song(&self, song_id: &str) -> Self {
        let mut new_songs = self.songs.clone();
        new_songs.remove(song_id);
        
        // También remover de todas las playlists usando map
        let new_playlists: HashMap<String, Playlist> = self.playlists
            .iter()
            .map(|(id, playlist)| {
                let new_playlist = playlist.remove_song(song_id);
                (id.clone(), new_playlist)
            })
            .collect();
        
        AppState {
            songs: new_songs,
            playlists: new_playlists,
        }
    }
    
    // Playlist operations (funcionales)
    pub fn create_playlist(&self, name: String) -> Self {
        let mut new_playlists = self.playlists.clone();
        let playlist = Playlist::new(name);
        new_playlists.insert(playlist.id.clone(), playlist);
        AppState {
            songs: self.songs.clone(),
            playlists: new_playlists,
        }
    }
    
    pub fn add_to_playlist(&self, playlist_id: &str, song_id: &str) -> Self {
        let mut new_playlists = self.playlists.clone();
        if let Some(playlist) = self.playlists.get(playlist_id) {
            if self.songs.contains_key(song_id) {
                let new_playlist = playlist.add_song(song_id.to_string());
                new_playlists.insert(playlist_id.to_string(), new_playlist);
            }
        }
        AppState {
            songs: self.songs.clone(),
            playlists: new_playlists,
        }
    }
    
    pub fn process_request(&self, request: ClientRequest) -> (ServerResponse, Option<AppState>) {
        match request {
            ClientRequest::SearchByName(name) => {
                let results = self.search_by_name(&name);
                (ServerResponse::SongsList(results), None)
            }
            ClientRequest::SearchByArtist(artist) => {
                let results = self.search_by_artist(&artist);
                (ServerResponse::SongsList(results), None)
            }
            ClientRequest::SearchByAlbum(album) => {
                let results = self.search_by_album(&album);
                (ServerResponse::SongsList(results), None)
            }
            ClientRequest::GetAllSongs => {
                let songs: Vec<Song> = self.songs.values().cloned().collect();
                (ServerResponse::SongsList(songs), None)
            }
            ClientRequest::CreatePlaylist(name) => {
                let new_state = self.create_playlist(name);
                (ServerResponse::Success { message: "Playlist creada".to_string(), data: None }, Some(new_state))
            }
            ClientRequest::GetPlaylists => {
                let playlists: Vec<Playlist> = self.playlists.values().cloned().collect();
                (ServerResponse::PlaylistsList(playlists), None)
            }
            ClientRequest::AddToPlaylist { playlist_id, song_id } => {
                let new_state = self.add_to_playlist(&playlist_id, &song_id);
                (ServerResponse::Ack, Some(new_state))
            }
            ClientRequest::AddSong(song) => {
                let new_state = self.add_song(song);
                (ServerResponse::Success { message: "Canción agregada".to_string(), data: None }, Some(new_state))
            }
            _ => (ServerResponse::Error { code: 400, message: "No implementado".to_string() }, None),
        }
    }
}