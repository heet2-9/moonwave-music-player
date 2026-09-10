"use client";

import { useMemo } from "react";
import { initialSongs } from "@/data/songs";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import SongRow from "@/components/music/SongRow";
import { History, Play, Trash2 } from "lucide-react";

export default function RecentlyPlayedPage() {
  const recentlyPlayed = useLibraryStore((state) => state.recentlyPlayed);
  const clearRecentlyPlayed = useLibraryStore((state) => state.clearRecentlyPlayed);
  const playSong = usePlayerStore((state) => state.playSong);

  const recentSongs = useMemo(() => {
    return recentlyPlayed
      .map((item) => initialSongs.find((s) => s.id === item.songId))
      .filter((s): s is typeof initialSongs[0] => s !== undefined);
  }, [recentlyPlayed]);

  const handlePlayAll = () => {
    if (recentSongs.length > 0) {
      playSong(recentSongs[0], recentSongs);
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>Recently Played</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Your listening history across sessions.</p>
        </div>

        {recentSongs.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
            <button
              onClick={clearRecentlyPlayed}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {recentSongs.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
          <History className="w-12 h-12 text-zinc-600 mx-auto opacity-50" />
          <p className="text-base font-semibold text-zinc-300">No recently played tracks.</p>
          <p className="text-xs text-zinc-500">Play any song in your library and it will show up here.</p>
        </div>
      ) : (
        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
          {recentSongs.map((song, idx) => (
            <SongRow key={`history-${song.id}-${idx}`} song={song} index={idx} playlistContext={recentSongs} />
          ))}
        </div>
      )}
    </div>
  );
}
