import { create } from "zustand";
import { Song } from "@/types/music";
import { initialSongs } from "@/data/songs";

export type RepeatMode = "off" | "one" | "all";

interface PlayerState {
  currentSong: Song | null;
  nextSong: Song | null;
  shuffledNextIndex: number | null;
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

function computeNextSong(
  currentSong: Song | null,
  queue: Song[],
  queueIndex: number,
  shuffle: boolean,
  repeat: RepeatMode,
  shuffledNextIndex: number | null
): { nextSong: Song | null; nextShuffleIndex: number | null } {
  if (!currentSong || queue.length === 0) {
    return { nextSong: null, nextShuffleIndex: null };
  }

  if (repeat === "one") {
    return { nextSong: currentSong, nextShuffleIndex: null };
  }

  if (shuffle) {
    let targetIndex = shuffledNextIndex;
    if (targetIndex === null || targetIndex < 0 || targetIndex >= queue.length) {
      if (queue.length === 1) {
        targetIndex = 0;
      } else {
        const candidateIndices = queue
          .map((_, i) => i)
          .filter((i) => i !== queueIndex);
        if (candidateIndices.length > 0) {
          targetIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
        } else {
          targetIndex = Math.floor(Math.random() * queue.length);
        }
      }
    }
    return {
      nextSong: queue[targetIndex] || null,
      nextShuffleIndex: targetIndex,
    };
  }

  let nextIdx = queueIndex + 1;
  if (nextIdx >= queue.length) {
    if (repeat === "all") {
      nextIdx = 0;
    } else {
      return { nextSong: null, nextShuffleIndex: null };
    }
  }

  return { nextSong: queue[nextIdx] || null, nextShuffleIndex: null };
}

const initialCurrent = initialSongs[0] || null;
const initialNextResult = computeNextSong(initialCurrent, initialSongs, 0, false, "off", null);

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: initialCurrent,
  nextSong: initialNextResult.nextSong,
  shuffledNextIndex: initialNextResult.nextShuffleIndex,
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
    const { queue, shuffle, repeat } = get();
    const activeQueue = newQueue || (queue.length > 0 ? queue : initialSongs);
    const existingIndex = activeQueue.findIndex((s) => s.id === song.id);
    
    let updatedQueue = activeQueue;
    let index = existingIndex;
    
    if (existingIndex === -1) {
      updatedQueue = [...activeQueue, song];
      index = updatedQueue.length - 1;
    }

    const { nextSong, nextShuffleIndex } = computeNextSong(
      song,
      updatedQueue,
      index,
      shuffle,
      repeat,
      null
    );

    set({
      currentSong: song,
      nextSong,
      shuffledNextIndex: nextShuffleIndex,
      queue: updatedQueue,
      queueIndex: index,
      isPlaying: true,
      currentTime: 0,
    });
  },

  togglePlay: () => {
    const { isPlaying, currentSong, queue } = get();
    if (!currentSong && queue.length > 0) {
      const firstSong = queue[0];
      const { nextSong, nextShuffleIndex } = computeNextSong(firstSong, queue, 0, false, "off", null);
      set({
        currentSong: firstSong,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
        queueIndex: 0,
        isPlaying: true,
      });
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  nextTrack: () => {
    const { queue, queueIndex, shuffle, repeat, shuffledNextIndex } = get();
    if (queue.length === 0) return;

    let targetIndex: number;

    if (shuffle) {
      if (shuffledNextIndex !== null && shuffledNextIndex >= 0 && shuffledNextIndex < queue.length) {
        targetIndex = shuffledNextIndex;
      } else {
        targetIndex = Math.floor(Math.random() * queue.length);
      }
    } else {
      targetIndex = queueIndex + 1;
      if (targetIndex >= queue.length) {
        if (repeat === "all") {
          targetIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    const nextCurrent = queue[targetIndex] || null;
    if (!nextCurrent) {
      set({ isPlaying: false });
      return;
    }

    const { nextSong, nextShuffleIndex } = computeNextSong(
      nextCurrent,
      queue,
      targetIndex,
      shuffle,
      repeat,
      null
    );

    set({
      currentSong: nextCurrent,
      nextSong,
      shuffledNextIndex: nextShuffleIndex,
      queueIndex: targetIndex,
      currentTime: 0,
      isPlaying: true,
    });
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime, shuffle, repeat } = get();
    if (queue.length === 0) return;

    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevSong = queue[prevIndex] || null;
    const { nextSong, nextShuffleIndex } = computeNextSong(
      prevSong,
      queue,
      prevIndex,
      shuffle,
      repeat,
      null
    );

    set({
      currentSong: prevSong,
      nextSong,
      shuffledNextIndex: nextShuffleIndex,
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

  toggleShuffle: () =>
    set((state) => {
      const nextShuffle = !state.shuffle;
      const { nextSong, nextShuffleIndex } = computeNextSong(
        state.currentSong,
        state.queue,
        state.queueIndex,
        nextShuffle,
        state.repeat,
        null
      );
      return {
        shuffle: nextShuffle,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
      };
    }),

  toggleRepeat: () =>
    set((state) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const nextMode = modes[(modes.indexOf(state.repeat) + 1) % modes.length];
      const { nextSong, nextShuffleIndex } = computeNextSong(
        state.currentSong,
        state.queue,
        state.queueIndex,
        state.shuffle,
        nextMode,
        state.shuffledNextIndex
      );
      return {
        repeat: nextMode,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
      };
    }),

  addToQueue: (song: Song) =>
    set((state) => {
      const updatedQueue = [...state.queue, song];
      const { nextSong, nextShuffleIndex } = computeNextSong(
        state.currentSong,
        updatedQueue,
        state.queueIndex,
        state.shuffle,
        state.repeat,
        state.shuffledNextIndex
      );
      return {
        queue: updatedQueue,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
      };
    }),

  removeFromQueue: (index: number) =>
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      let newIndex = state.queueIndex;
      if (index < state.queueIndex) {
        newIndex = Math.max(0, state.queueIndex - 1);
      }
      const newCurrent = newQueue[newIndex] || null;
      const { nextSong, nextShuffleIndex } = computeNextSong(
        newCurrent,
        newQueue,
        newIndex,
        state.shuffle,
        state.repeat,
        null
      );
      return {
        queue: newQueue,
        queueIndex: newIndex,
        currentSong: newCurrent,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
      };
    }),

  reorderQueue: (newQueue: Song[]) =>
    set((state) => {
      const newIndex = state.currentSong
        ? newQueue.findIndex((s) => s.id === state.currentSong?.id)
        : 0;
      const validIndex = newIndex !== -1 ? newIndex : 0;
      const { nextSong, nextShuffleIndex } = computeNextSong(
        state.currentSong,
        newQueue,
        validIndex,
        state.shuffle,
        state.repeat,
        null
      );
      return {
        queue: newQueue,
        queueIndex: validIndex,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
      };
    }),

  setQueue: (songs: Song[], startIndex = 0) =>
    set((state) => {
      const current = songs[startIndex] || null;
      const { nextSong, nextShuffleIndex } = computeNextSong(
        current,
        songs,
        startIndex,
        state.shuffle,
        state.repeat,
        null
      );
      return {
        queue: songs,
        queueIndex: startIndex,
        currentSong: current,
        nextSong,
        shuffledNextIndex: nextShuffleIndex,
        currentTime: 0,
        isPlaying: true,
      };
    }),

  clearQueue: () =>
    set({
      queue: [],
      queueIndex: 0,
      currentSong: null,
      nextSong: null,
      shuffledNextIndex: null,
      isPlaying: false,
    }),

  setNowPlayingOpen: (open: boolean) => set({ isNowPlayingOpen: open }),
  setQueueOpen: (open: boolean) => set({ isQueueOpen: open }),
  setLyricsOpen: (open: boolean) => set({ isLyricsOpen: open }),
}));
