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
    title: "Main Hoon Saath Tere",
    artist: "Arijit Singh",
    videoSrc: "/karaoke/MAIN_HOON_SAATH_TERE_-_KARAOKE_VERSION_ORIGINAL_TRACK_HQ(720p).mp4",
    artwork: "/artwork/cover_1.png",
  },
  {
    id: "karaoke-2",
    title: "Ishq Wala Love",
    artist: "Shekhar Ravjiani, Salim Merchant & Neeti Mohan",
    videoSrc: "/karaoke/ISHQ_WALA_LOVE_-_Student_Of_The_Year____Karaoke_with_Lyrics____AlgoRhythm_Studio(1080p).mp4",
    artwork: "/artwork/cover_2.png",
  },
  {
    id: "karaoke-3",
    title: "Meri Banogi Kya",
    artist: "Rito Riba",
    videoSrc: "/karaoke/Meri_banogi_kya__Rito_Riba__original_karaoke_with_lyrics__#karaoke_#meribanogikya_#love_#feelings(1080p).mp4",
    artwork: "/artwork/cover_1.png",
  },
  {
    id: "karaoke-4",
    title: "Be Intehaan",
    artist: "Atif Aslam & Sunidhi Chauhan",
    videoSrc: "/karaoke/Be_Intehaan_-_Atif_Aslam__lyrics_video_(480p).mp4",
    artwork: "/artwork/cover_2.png",
  },
];
