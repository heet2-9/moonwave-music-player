"use client";

import { KaraokeSong, karaokeSongs } from "@/data/karaokeSongs";
import { useKaraokeStore } from "@/store/karaokeStore";
import { Mic2, Play } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface KaraokeSongListProps {
  onSelectSong?: (song: KaraokeSong) => void;
}

export default function KaraokeSongList({ onSelectSong }: KaraokeSongListProps) {
  const selectedSong = useKaraokeStore((state) => state.selectedKaraokeSong);
  const setSelectedKaraokeSong = useKaraokeStore((state) => state.setSelectedKaraokeSong);

  const handleSelect = (song: KaraokeSong) => {
    setSelectedKaraokeSong(song);
    if (onSelectSong) onSelectSong(song);
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-pink-400 flex items-center gap-2">
          <Mic2 className="w-4 h-4" />
          Select Karaoke Track ({karaokeSongs.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {karaokeSongs.map((song) => {
          const isSelected = selectedSong.id === song.id;
          return (
            <div
              key={song.id}
              onClick={() => handleSelect(song)}
              className={cn(
                "group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-pink-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg",
                isSelected && "border-pink-500/60 bg-gradient-to-b from-pink-500/20 to-purple-500/10 shadow-pink-500/10"
              )}
            >
              {/* Artwork / Thumbnail */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2 bg-zinc-900 border border-white/5">
                {song.artwork ? (
                  <Image
                    src={song.artwork}
                    alt={song.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-pink-900 flex items-center justify-center">
                    <Mic2 className="w-6 h-6 text-pink-400" />
                  </div>
                )}

                <div
                  className={cn(
                    "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold shadow-md">
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Title & Artist */}
              <div className="min-w-0">
                <h4
                  className={cn(
                    "text-xs font-bold truncate",
                    isSelected ? "text-pink-300" : "text-white group-hover:text-pink-200"
                  )}
                >
                  {song.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
