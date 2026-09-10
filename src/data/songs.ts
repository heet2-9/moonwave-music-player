import { Song } from "@/types/music";

export const initialSongs: Song[] = [
  {
    id: "song-001",
    title: "Midnight Lofi Sanctuary",
    artist: "Aaru Vibes",
    album: "Moonwave Sessions Vol. 1",
    artwork: "/artwork/cover_1.png",
    audio: "/music/lofi_midnight.mp3",
    duration: 165,
    genre: "Lofi / Chill",
    year: 2026,
    featured: true,
    karaokeVideoId: "jfKfPfyJRdk", // Lofi Girl / Chill beats
    lyrics: [
      { time: 0, text: "♪ (Soft ambient piano entry) ♪" },
      { time: 12, text: "Late night reflections under violet skies" },
      { time: 24, text: "Counting stars that linger in your eyes" },
      { time: 36, text: "A quiet space where time just stands still" },
      { time: 48, text: "Echoes of memories on a moonlit hill" },
      { time: 60, text: "♪ (Subtle bass drop & warm synth swell) ♪" },
      { time: 75, text: "Soft melodies floating in the air" },
      { time: 90, text: "Knowing that you'll always find me there" },
      { time: 110, text: "♪ (Outro fade out) ♪" },
    ],
  },
  {
    id: "song-002",
    title: "Sweet Dreams & Lavender",
    artist: "Moonwave Ensemble",
    album: "Twilight Harmonies",
    artwork: "/artwork/cover_2.png",
    audio: "/music/sweet_dreams.mp3",
    duration: 184,
    genre: "Acoustic Pop",
    year: 2026,
    featured: true,
    karaokeVideoId: "5qap5aO4i9A", // Lofi Chill
    lyrics: `[Verse 1]
Whispers in the quiet night
Guiding us with silver light
Every melody we share
Drifting softly through the air

[Chorus]
Sweet dreams in lavender hue
Everything leads back to you
Hold onto this simple melody
Forever in our sanctuary

[Verse 2]
No distance can ever hide
The song we carry inside
When the music starts to play
All the worries fade away`,
  },
  {
    id: "song-003",
    title: "Starlight Groove",
    artist: "Neon Serenade",
    album: "Cosmic Velvet",
    artwork: "/artwork/cover_1.png",
    audio: "/music/starlight_groove.mp3",
    duration: 192,
    genre: "Synthwave / R&B",
    year: 2025,
    featured: true,
    karaokeVideoId: "7NOSDKb0HlU", // Karaoke instrumental sample
    lyrics: `[Verse]
Glowing neon on the boulevard
Riding high when times are hard
Feel the rhythm start to pulse
Nobody else, nobody else

[Chorus]
Starlight groove taking us away
Dancing till the break of day
Soft lavender, deep midnight blue
Every beat is set for you`,
  },
  {
    id: "song-004",
    title: "Golden Hour Serenade",
    artist: "Aaru & The Velvet Strings",
    album: "Acoustic Whispers",
    artwork: "/artwork/cover_2.png",
    audio: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    duration: 145,
    genre: "Acoustic",
    year: 2026,
    featured: false,
    karaokeVideoId: "2Vv-BfVoq4g", // Perfect - Ed Sheeran Karaoke
    lyrics: `[Verse 1]
Sunlight dipping below the line
Your warm hand intertwined in mine
A gentle strum, a simple phrase
Lost inside these golden days`,
  },
  {
    id: "song-005",
    title: "Velvet Nightfall",
    artist: "Celestial Dreams",
    album: "Moonwave Sessions Vol. 1",
    artwork: "/artwork/cover_1.png",
    audio: "/music/lofi_midnight.mp3",
    duration: 210,
    genre: "Ambient",
    year: 2025,
    featured: false,
    karaokeVideoId: "kJQP7kiw5Fk", // Despacito / Pop Karaoke sample
    lyrics: "Lyrics aren't available for this song yet.",
  },
];
