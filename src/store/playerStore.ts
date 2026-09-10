import { create } from "zustand";
import { Song } from "@/types/music";
import { initialSongs } from "@/data/songs";

export type RepeatMode = "off" | "one" | "all";

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Song[];
  queueIndex: number;
  isNowPlayingOpen: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (newQueue: Song[]) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  clearQueue: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: initialSongs[0] || null,
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  currentTime: 0,
  duration: initialSongs[0]?.duration || 0,
  shuffle: false,
  repeat: "off",
  queue: initialSongs,
  queueIndex: 0,
  isNowPlayingOpen: false,
  isQueueOpen: false,
  isLyricsOpen: false,

  playSong: (song: Song, newQueue?: Song[]) => {
    const { queue } = get();
    const activeQueue = newQueue || (queue.length > 0 ? queue : initialSongs);
    const existingIndex = activeQueue.findIndex((s) => s.id === song.id);
    
    let updatedQueue = activeQueue;
    let index = existingIndex;
    
    if (existingIndex === -1) {
      updatedQueue = [...activeQueue, song];
      index = updatedQueue.length - 1;
    }

    set({
      currentSong: song,
      queue: updatedQueue,
      queueIndex: index,
      isPlaying: true,
      currentTime: 0,
    });
  },

  togglePlay: () => {
    const { isPlaying, currentSong, queue } = get();
    if (!currentSong && queue.length > 0) {
      set({ currentSong: queue[0], queueIndex: 0, isPlaying: true });
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  nextTrack: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      set({
        currentSong: queue[randomIndex],
        queueIndex: randomIndex,
        currentTime: 0,
        isPlaying: true,
      });
      return;
    }

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    set({
      currentSong: queue[nextIndex],
      queueIndex: nextIndex,
      currentTime: 0,
      isPlaying: true,
    });
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    set({
      currentSong: queue[prevIndex],
      queueIndex: prevIndex,
      currentTime: 0,
      isPlaying: true,
    });
  },

  seek: (time: number) => set({ currentTime: time }),

  setCurrentTime: (currentTime: number) => set({ currentTime }),

  setDuration: (duration: number) => set({ duration }),

  setVolume: (volume: number) => set({ volume, isMuted: volume === 0 }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleRepeat: () =>
    set((state) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const nextMode = modes[(modes.indexOf(state.repeat) + 1) % modes.length];
      return { repeat: nextMode };
    }),

  addToQueue: (song: Song) =>
    set((state) => ({
      queue: [...state.queue, song],
    })),

  removeFromQueue: (index: number) =>
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      let newIndex = state.queueIndex;
      if (index < state.queueIndex) {
        newIndex = Math.max(0, state.queueIndex - 1);
      }
      return {
        queue: newQueue,
        queueIndex: newIndex,
        currentSong: newQueue[newIndex] || null,
      };
    }),

  reorderQueue: (newQueue: Song[]) => set({ queue: newQueue }),

  setQueue: (songs: Song[], startIndex = 0) =>
    set({
      queue: songs,
      queueIndex: startIndex,
      currentSong: songs[startIndex] || null,
      currentTime: 0,
      isPlaying: true,
    }),

  clearQueue: () => set({ queue: [], queueIndex: 0, currentSong: null, isPlaying: false }),

  setNowPlayingOpen: (open: boolean) => set({ isNowPlayingOpen: open }),
  setQueueOpen: (open: boolean) => set({ isQueueOpen: open }),
  setLyricsOpen: (open: boolean) => set({ isLyricsOpen: open }),
}));
