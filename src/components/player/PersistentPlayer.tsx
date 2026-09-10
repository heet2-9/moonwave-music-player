"use client";

import Image from "next/image";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  FileText,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PersistentPlayer() {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const prevTrack = usePlayerStore((state) => state.prevTrack);
  const seek = usePlayerStore((state) => state.seek);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const toggleRepeat = usePlayerStore((state) => state.toggleRepeat);

  const isQueueOpen = usePlayerStore((state) => state.isQueueOpen);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const isLyricsOpen = usePlayerStore((state) => state.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);
  const setNowPlayingOpen = usePlayerStore((state) => state.setNowPlayingOpen);

  const favorites = useLibraryStore((state) => state.favorites);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  if (!currentSong) return null;

  const isFav = favorites.includes(currentSong.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainderSecs = Math.floor(secs % 60);
    return `${mins}:${remainderSecs < 10 ? "0" : ""}${remainderSecs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 bg-[#0c0c14]/95 backdrop-blur-2xl border-t border-white/10 select-none shadow-2xl">
      {/* Interactive Top Progress Bar Accent */}
      <div className="relative w-full h-1 bg-white/10 group cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover:scale-100 transition-transform" />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime || 0}
          onChange={handleSeekChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Track Metadata & Artwork */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-64">
          <div
            onClick={() => setNowPlayingOpen(true)}
            className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg group cursor-pointer shrink-0 bg-zinc-800 border border-white/10"
          >
            <Image
              src={currentSong.artwork}
              alt={currentSong.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setNowPlayingOpen(true)}>
            <h4 className="text-sm font-semibold text-white truncate hover:text-pink-300 transition-colors">
              {currentSong.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
          </div>

          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="p-1.5 rounded-full hover:bg-white/5 transition-colors"
            title="Favorite"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFav ? "fill-pink-500 text-pink-500 scale-110" : "text-zinc-400 hover:text-pink-400"
              )}
            />
          </button>
        </div>

        {/* Center Controls (Desktop & Mobile) */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-1.5 rounded-full transition-colors hidden sm:block",
                shuffle ? "text-pink-400 bg-pink-500/10" : "text-zinc-400 hover:text-white"
              )}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={toggleRepeat}
              className={cn(
                "p-1.5 rounded-full transition-colors hidden sm:block",
                repeat !== "off" ? "text-pink-400 bg-pink-500/10" : "text-zinc-400 hover:text-white"
              )}
              title={`Repeat: ${repeat}`}
            >
              {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 w-full max-w-xs">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Aux Controls */}
        <div className="hidden md:flex items-center gap-3 w-64 justify-end">
          <button
            onClick={() => setLyricsOpen(!isLyricsOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5",
              isLyricsOpen ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            title="Lyrics"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => setQueueOpen(!isQueueOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5",
              isQueueOpen ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-pink-500 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
