"use client";

import { usePlayerStore } from "@/store/playerStore";
import Image from "next/image";
import { X, Trash2, Play, Volume2 } from "lucide-react";

export default function QueueDrawer() {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isQueueOpen = usePlayerStore((state) => state.isQueueOpen);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const playSong = usePlayerStore((state) => state.playSong);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0c0c14]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 select-none">
      {/* Drawer Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-base">Up Next</h3>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
            {queue.length} Tracks
          </span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors px-2 py-1 rounded bg-white/5"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setQueueOpen(false)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {queue.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <p className="text-sm">Queue is empty</p>
          </div>
        ) : (
          queue.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id && queueIndex === idx;
            return (
              <div
                key={`${song.id}-${idx}`}
                className={`group flex items-center justify-between p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/15 border border-pink-500/30 text-white"
                    : "hover:bg-white/5 text-zinc-300"
                }`}
              >
                <div
                  onClick={() => playSong(song, queue)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                    <Image
                      src={song.artwork}
                      alt={song.title}
                      fill
                      className="object-cover"
                    />
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-pink-400 animate-bounce" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isCurrent ? "text-pink-300" : "text-white"}`}>
                      {song.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isCurrent && (
                    <button
                      onClick={() => playSong(song, queue)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-pink-400"
                      title="Play"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-red-400"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
