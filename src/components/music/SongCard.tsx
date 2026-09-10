"use client";

import Image from "next/image";
import { Song } from "@/types/music";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { Play, Pause, Heart, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SongCardProps {
  song: Song;
  playlistContext?: Song[];
}

export default function SongCard({ song, playlistContext }: SongCardProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const favorites = useLibraryStore((state) => state.favorites);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  const isCurrent = currentSong?.id === song.id;
  const isFav = favorites.includes(song.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlistContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(song.id);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div
      onClick={handlePlayClick}
      className={cn(
        "group relative p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-pink-500/30 transition-all duration-300 cursor-pointer flex flex-col justify-between select-none shadow-lg hover:shadow-pink-500/5",
        isCurrent && "border-pink-500/50 bg-pink-500/10"
      )}
    >
      {/* Artwork & Hover Controls */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 sm:mb-3 bg-zinc-900 border border-white/5">
        <Image
          src={song.artwork}
          alt={song.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Play Overlay Button (Always visible on mobile if current, hover on desktop) */}
        <div
          className={cn(
            "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300",
            isCurrent ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
          )}
        >
          <button
            onClick={handlePlayClick}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all min-h-[40px] min-w-[40px]"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Favorite Heart Badge */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:scale-110 transition-transform min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors",
              isFav ? "fill-pink-500 text-pink-500" : "text-white/80 hover:text-pink-300"
            )}
          />
        </button>

        {/* Karaoke Available Badge */}
        {song.karaokeVideoId && (
          <Link
            href={`/karaoke?songId=${song.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-pink-500/80 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-white flex items-center gap-1 hover:bg-pink-500 transition-colors shadow-md"
            title="Open Karaoke Studio"
          >
            <Mic2 className="w-3 h-3" />
            <span>Sing</span>
          </Link>
        )}
      </div>

      {/* Track Info */}
      <div className="flex items-start justify-between gap-1.5 min-w-0">
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              "text-xs sm:text-sm font-semibold truncate transition-colors",
              isCurrent ? "text-pink-300 font-bold" : "text-white group-hover:text-pink-200"
            )}
          >
            {song.title}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{song.artist}</p>
        </div>
        <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium shrink-0 pt-0.5">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  );
}
