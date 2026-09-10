import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Playlist } from "@/types/music";

interface RecentlyPlayedItem {
  songId: string;
  timestamp: number;
}

interface LibraryState {
  favorites: string[]; // Song IDs
  recentlyPlayed: RecentlyPlayedItem[];
  customPlaylists: Playlist[];

  // Actions
  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  addRecentlyPlayed: (songId: string) => void;
  clearRecentlyPlayed: () => void;
  clearFavorites: () => void;
  
  // Playlist Actions
  createPlaylist: (name: string, description?: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, songId: string) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  resetAllData: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: ["song-001", "song-002"], // Default favorites for Aaru
      recentlyPlayed: [
        { songId: "song-001", timestamp: Date.now() - 3600000 },
        { songId: "song-002", timestamp: Date.now() - 7200000 },
      ],
      customPlaylists: [
        {
          id: "pl-late-night",
          name: "Late Night Sanctuary",
          description: "Soothing tracks for cozy midnight listening",
          songIds: ["song-001", "song-002"],
          createdAt: Date.now() - 86400000,
          coverArtwork: "/artwork/cover_1.png",
        },
        {
          id: "pl-favs",
          name: "Favs",
          description: "All time favorites",
          songIds: ["song-001", "song-003"],
          createdAt: Date.now() - 172800000,
          coverArtwork: "/artwork/cover_2.png",
        },
      ],

      toggleFavorite: (songId: string) =>
        set((state) => {
          const exists = state.favorites.includes(songId);
          const updated = exists
            ? state.favorites.filter((id) => id !== songId)
            : [...state.favorites, songId];
          return { favorites: updated };
        }),

      isFavorite: (songId: string) => get().favorites.includes(songId),

      addRecentlyPlayed: (songId: string) =>
        set((state) => {
          const filtered = state.recentlyPlayed.filter(
            (item) => item.songId !== songId
          );
          const updated = [
            { songId, timestamp: Date.now() },
            ...filtered,
          ].slice(0, 50); // Keep max 50 recent items
          return { recentlyPlayed: updated };
        }),

      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),

      clearFavorites: () => set({ favorites: [] }),

      createPlaylist: (name: string, description?: string) => {
        const newId = `pl-${Date.now()}`;
        const newPlaylist: Playlist = {
          id: newId,
          name,
          description,
          songIds: [],
          createdAt: Date.now(),
        };
        set((state) => ({
          customPlaylists: [newPlaylist, ...state.customPlaylists],
        }));
        return newId;
      },

      renamePlaylist: (id: string, name: string) =>
        set((state) => ({
          customPlaylists: state.customPlaylists.map((pl) =>
            pl.id === id ? { ...pl, name } : pl
          ),
        })),

      deletePlaylist: (id: string) =>
        set((state) => ({
          customPlaylists: state.customPlaylists.filter((pl) => pl.id !== id),
        })),

      addSongToPlaylist: (playlistId: string, songId: string) =>
        set((state) => ({
          customPlaylists: state.customPlaylists.map((pl) => {
            if (pl.id === playlistId && !pl.songIds.includes(songId)) {
              return { ...pl, songIds: [...pl.songIds, songId] };
            }
            return pl;
          }),
        })),

      removeSongFromPlaylist: (playlistId: string, songId: string) =>
        set((state) => ({
          customPlaylists: state.customPlaylists.map((pl) => {
            if (pl.id === playlistId) {
              return { ...pl, songIds: pl.songIds.filter((id) => id !== songId) };
            }
            return pl;
          }),
        })),

      resetAllData: () =>
        set({
          favorites: [],
          recentlyPlayed: [],
          customPlaylists: [],
        }),
    }),
    {
      name: "moonwave_library_storage",
    }
  )
);
