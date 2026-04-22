use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub song_ids: Vec<String>,
}

impl Playlist {
    pub fn new(name: String) -> Self {
        let id = uuid::Uuid::new_v4().to_string();
        Self {
            id,
            name,
            song_ids: Vec::new(),
        }
    }
    
    pub fn add_song(&self, song_id: String) -> Self {
        let mut new_song_ids = self.song_ids.clone();
        new_song_ids.push(song_id);
        Playlist {
            id: self.id.clone(),
            name: self.name.clone(),
            song_ids: new_song_ids,
        }
    }
    
    pub fn remove_song(&self, song_id: &str) -> Self {
        let new_song_ids: Vec<String> = self.song_ids
            .iter()
            .filter(|&id| id != song_id)
            .cloned()
            .collect();
        
        Playlist {
            id: self.id.clone(),
            name: self.name.clone(),
            song_ids: new_song_ids,
        }
    }
    
    pub fn filter_songs<F>(&self, predicate: F) -> Vec<String>
    where
        F: Fn(&String) -> bool,
    {
        self.song_ids.iter().filter(|&id| predicate(id)).cloned().collect()
    }
    
    pub fn sort_songs<F>(&self, compare: F) -> Self
    where
        F: Fn(&String, &String) -> std::cmp::Ordering,
    {
        let mut sorted = self.song_ids.clone();
        sorted.sort_by(compare);
        
        Playlist {
            id: self.id.clone(),
            name: self.name.clone(),
            song_ids: sorted,
        }
    }
}