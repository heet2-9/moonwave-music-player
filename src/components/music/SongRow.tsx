"use client";

import Image from "next/image";
import { Song } from "@/types/music";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { Play, Pause, Heart, Mic2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SongRowProps {
  song: Song;
  index?: number;
  playlistContext?: Song[];
}

export default function SongRow({ song, index, playlistContext }: SongRowProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const favorites = useLibraryStore((state) => state.favorites);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const customPlaylists = useLibraryStore((state) => state.customPlaylists);
  const addSongToPlaylist = useLibraryStore((state) => state.addSongToPlaylist);

  const isCurrent = currentSong?.id === song.id;
  const isFav = favorites.includes(song.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlistContext);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customPlaylists.length === 0) {
      alert("Please create a playlist first in the Playlists section!");
      return;
    }
    const plName = prompt(
      `Add "${song.title}" to playlist:\n` +
        customPlaylists.map((pl, i) => `${i + 1}. ${pl.name}`).join("\n")
    );
    const num = parseInt(plName || "", 10);
    if (!isNaN(num) && customPlaylists[num - 1]) {
      addSongToPlaylist(customPlaylists[num - 1].id, song.id);
      alert(`Added to ${customPlaylists[num - 1].name}!`);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group flex items-center justify-between p-2 sm:p-2.5 rounded-xl transition-all duration-200 cursor-pointer select-none border border-transparent min-h-[52px]",
        isCurrent
          ? "bg-pink-500/10 border-pink-500/30 text-white font-medium"
          : "hover:bg-white/5 text-zinc-300 hover:text-white"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
        {index !== undefined && (
          <span className="w-4 text-center text-xs font-semibold text-zinc-500 group-hover:text-pink-400 shrink-0 hidden sm:inline">
            {isCurrent && isPlaying ? (
              <span className="text-pink-400 font-bold animate-pulse">▶</span>
            ) : (
              index + 1
            )}
          </span>
        )}

        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-white/5">
          <Image src={song.artwork} alt={song.title} fill className="object-cover" />
          <div
            className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
              isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 text-pink-400 fill-current" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              "text-xs sm:text-sm font-semibold truncate",
              isCurrent ? "text-pink-300 font-bold" : "text-white"
            )}
          >
            {song.title}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {song.karaokeVideoId && (
          <Link
            href={`/karaoke?songId=${song.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-[10px] font-bold text-pink-300 hover:bg-pink-500/30 transition-colors"
          >
            <Mic2 className="w-3 h-3" />
            <span>Sing</span>
          </Link>
        )}

        <button
          onClick={handleAddToPlaylist}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Add to Playlist"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song.id);
          }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Favorite"
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isFav ? "fill-pink-500 text-pink-500" : "text-zinc-500 hover:text-pink-400"
            )}
          />
        </button>

        <span className="text-[11px] sm:text-xs text-zinc-500 font-medium w-8 sm:w-10 text-right shrink-0">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
}
