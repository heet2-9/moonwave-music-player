export interface LyricLine {
  time?: number; // timestamp in seconds if synced
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  audio: string;
  duration: number; // in seconds
  genre: string;
  year?: number;
  lyrics?: string | LyricLine[];
  karaokeVideoId?: string;
  karaokeVideoUrl?: string;
  featured?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  coverArtwork?: string;
}

export interface KaraokeRecording {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  blobUrl: string;
  duration: number;
  recordedAt: number;
  mimeType: string;
}
