export interface KaraokeSong {
  id: string;
  title: string;
  artist: string;
  videoSrc: string;
  artwork?: string;
}

export const karaokeSongs: KaraokeSong[] = [
  {
    id: "karaoke-1",
    title: "Midnight Lofi Sanctuary",
    artist: "Aaru Vibes",
    videoSrc: "/karaoke/song-1.mp4",
    artwork: "/artwork/cover_1.png",
  },
  {
    id: "karaoke-2",
    title: "Sweet Dreams & Lavender",
    artist: "Moonwave Ensemble",
    videoSrc: "/karaoke/song-2.mp4",
    artwork: "/artwork/cover_2.png",
  },
  {
    id: "karaoke-3",
    title: "Starlight Groove",
    artist: "Neon Serenade",
    videoSrc: "/karaoke/song-3.mp4",
    artwork: "/artwork/cover_1.png",
  },
  {
    id: "karaoke-4",
    title: "Golden Hour Serenade",
    artist: "Aaru & The Velvet Strings",
    videoSrc: "/karaoke/song-4.mp4",
    artwork: "/artwork/cover_2.png",
  },
  {
    id: "karaoke-5",
    title: "Velvet Nightfall",
    artist: "Celestial Dreams",
    videoSrc: "/karaoke/song-5.mp4",
    artwork: "/artwork/cover_1.png",
  },
];
