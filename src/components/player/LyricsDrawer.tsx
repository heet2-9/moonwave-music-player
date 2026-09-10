"use client";

import { usePlayerStore } from "@/store/playerStore";
import { LyricLine } from "@/types/music";
import { X, Music } from "lucide-react";

export default function LyricsDrawer() {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const isLyricsOpen = usePlayerStore((state) => state.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);

  if (!isLyricsOpen || !currentSong) return null;

  const renderLyrics = () => {
    if (!currentSong.lyrics) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
          <Music className="w-12 h-12 mb-3 text-zinc-600 opacity-50" />
          <p className="text-sm font-medium">Lyrics aren&apos;t available for this song yet.</p>
        </div>
      );
    }

    if (typeof currentSong.lyrics === "string") {
      if (currentSong.lyrics.includes("Lyrics aren't available")) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
            <Music className="w-12 h-12 mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm font-medium">{currentSong.lyrics}</p>
          </div>
        );
      }
      return (
        <div className="space-y-4 text-center leading-relaxed text-zinc-300 whitespace-pre-line font-medium text-base sm:text-lg">
          {currentSong.lyrics}
        </div>
      );
    }

    const lines: LyricLine[] = currentSong.lyrics;

    return (
      <div className="space-y-4 sm:space-y-6 text-center">
        {lines.map((line, idx) => {
          const isCurrent =
            line.time !== undefined &&
            currentTime >= line.time &&
            (lines[idx + 1]?.time === undefined || currentTime < (lines[idx + 1].time as number));

          return (
            <p
              key={idx}
              className={`transition-all duration-300 cursor-pointer ${
                isCurrent
                  ? "text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-pink-400 scale-105"
                  : "text-base sm:text-lg text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090e]/98 backdrop-blur-2xl flex flex-col select-none animate-in fade-in duration-200 pt-safe pb-safe">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="min-w-0 pr-2">
          <h3 className="font-bold text-white text-base sm:text-lg truncate">{currentSong.title}</h3>
          <p className="text-xs text-pink-400 font-medium truncate">{currentSong.artist} — Lyrics</p>
        </div>
        <button
          onClick={() => setLyricsOpen(false)}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics Scroll Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar max-w-2xl mx-auto w-full flex items-center justify-center">
        {renderLyrics()}
      </div>
    </div>
  );
}
