"use client";

import Image from "next/image";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import AudioVisualizer from "./AudioVisualizer";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  FileText,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export default function NowPlayingModal() {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const isNowPlayingOpen = usePlayerStore((state) => state.isNowPlayingOpen);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const prevTrack = usePlayerStore((state) => state.prevTrack);
  const seek = usePlayerStore((state) => state.seek);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const toggleRepeat = usePlayerStore((state) => state.toggleRepeat);

  const setNowPlayingOpen = usePlayerStore((state) => state.setNowPlayingOpen);
  const isQueueOpen = usePlayerStore((state) => state.isQueueOpen);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const isLyricsOpen = usePlayerStore((state) => state.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);

  const favorites = useLibraryStore((state) => state.favorites);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);

  if (!isNowPlayingOpen || !currentSong) return null;

  const isFav = favorites.includes(currentSong.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainderSecs = Math.floor(secs % 60);
    return `${mins}:${remainderSecs < 10 ? "0" : ""}${remainderSecs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#07070b] flex flex-col justify-between overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300 select-none pt-safe pb-safe">
      {/* Dynamic Blurred Background Ambient Art */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <Image
          src={currentSong.artwork}
          alt={currentSong.title}
          fill
          className="object-cover blur-[120px] scale-125 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070b]/60 via-[#07070b]/80 to-[#07070b]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={() => setNowPlayingOpen(false)}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg"
          title="Minimize"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 flex-1 px-2">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-pink-400 font-bold truncate">
            {siteConfig.romanticPhrases.nowPlayingSubtitle}
          </p>
          <p className="text-xs text-zinc-400 font-medium truncate">{currentSong.album}</p>
        </div>

        <button
          onClick={() => toggleFavorite(currentSong.id)}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg"
          title="Favorite"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isFav ? "fill-pink-500 text-pink-500 scale-110" : "text-white"
            )}
          />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-md mx-auto w-full space-y-4 sm:space-y-6 my-auto py-2">
        {/* Responsive Album Artwork */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 max-h-[32vh] rounded-3xl overflow-hidden shadow-2xl border border-white/15 group shrink-0">
          <Image
            src={currentSong.artwork}
            alt={currentSong.title}
            fill
            className={cn(
              "object-cover transition-transform duration-700",
              isPlaying ? "scale-105" : "scale-100"
            )}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        </div>

        {/* Title & Artist */}
        <div className="text-center space-y-0.5 sm:space-y-1 w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate drop-shadow-md">
            {currentSong.title}
          </h2>
          <p className="text-xs sm:text-sm text-pink-300/90 font-medium truncate">{currentSong.artist}</p>
        </div>

        {/* Audio Visualizer Spectrum */}
        <div className="w-full h-10 sm:h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md px-2 py-1 shrink-0">
          <AudioVisualizer className="w-full h-full" />
        </div>

        {/* Interactive Progress Slider */}
        <div className="w-full space-y-1.5">
          <div className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-zinc-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Playback Controls */}
        <div className="flex items-center justify-between w-full max-w-xs pt-1 sm:pt-2">
          <button
            onClick={toggleShuffle}
            className={cn(
              "p-2.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center",
              shuffle ? "text-pink-400 bg-pink-500/20" : "text-zinc-400 hover:text-white"
            )}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button onClick={prevTrack} className="p-2 text-zinc-200 hover:text-white transition-transform active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <SkipBack className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
            )}
          </button>

          <button onClick={nextTrack} className="p-2 text-zinc-200 hover:text-white transition-transform active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <SkipForward className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={toggleRepeat}
            className={cn(
              "p-2.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center",
              repeat !== "off" ? "text-pink-400 bg-pink-500/20" : "text-zinc-400 hover:text-white"
            )}
            title={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Bottom Aux Tools Bar */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-t border-white/10 bg-[#07070b]/80 backdrop-blur-xl shrink-0">
        <button
          onClick={() => setLyricsOpen(!isLyricsOpen)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold border transition-all min-h-[44px]",
            isLyricsOpen ? "bg-pink-500/20 text-pink-300 border-pink-500/40" : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Lyrics</span>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-white p-1">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-pink-500 h-1 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={() => setQueueOpen(!isQueueOpen)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold border transition-all min-h-[44px]",
            isQueueOpen ? "bg-pink-500/20 text-pink-300 border-pink-500/40" : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
          )}
        >
          <ListMusic className="w-4 h-4" />
          <span>Queue</span>
        </button>
      </div>
    </div>
  );
}
