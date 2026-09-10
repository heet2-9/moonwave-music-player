"use client";

import { useMemo } from "react";
import { initialSongs } from "@/data/songs";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import SongRow from "@/components/music/SongRow";
import SongCard from "@/components/music/SongCard";
import { Heart, Play, Trash2 } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function FavoritesPage() {
  const favorites = useLibraryStore((state) => state.favorites);
  const clearFavorites = useLibraryStore((state) => state.clearFavorites);
  const playSong = usePlayerStore((state) => state.playSong);

  const favoriteSongs = useMemo(() => {
    return initialSongs.filter((s) => favorites.includes(s.id));
  }, [favorites]);

  const handlePlayAll = () => {
    if (favoriteSongs.length > 0) {
      playSong(favoriteSongs[0], favoriteSongs);
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <span>Your Favorites</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {siteConfig.romanticPhrases.favoritesSubtitle} ({favoriteSongs.length} tracks)
          </p>
        </div>

        {favoriteSongs.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 hover:scale-105 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={clearFavorites}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
              title="Clear Favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {favoriteSongs.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
          <Heart className="w-12 h-12 text-zinc-600 mx-auto opacity-50" />
          <p className="text-base font-semibold text-zinc-300">No favorites yet.</p>
          <p className="text-xs text-zinc-500">Click the heart button on any song to add it here.</p>
        </div>
      ) : (
        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
          {favoriteSongs.map((song, idx) => (
            <SongRow key={song.id} song={song} index={idx} playlistContext={favoriteSongs} />
          ))}
        </div>
      )}
    </div>
  );
}
