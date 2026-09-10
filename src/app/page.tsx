"use client";

import { useMemo } from "react";
import { siteConfig } from "@/config/site";
import { initialSongs } from "@/data/songs";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import SongCard from "@/components/music/SongCard";
import { Sparkles, Mic2, Music, Flame, Play } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const recentlyPlayed = useLibraryStore((state) => state.recentlyPlayed);
  const playSong = usePlayerStore((state) => state.playSong);

  const recentSongs = useMemo(() => {
    return recentlyPlayed
      .map((item) => initialSongs.find((s) => s.id === item.songId))
      .filter((s): s is typeof initialSongs[0] => s !== undefined)
      .slice(0, 4);
  }, [recentlyPlayed]);

  const karaokePicks = useMemo(() => {
    return initialSongs.filter((s) => s.karaokeVideoId);
  }, []);

  const handlePlayAll = () => {
    if (initialSongs.length > 0) {
      playSong(initialSongs[0], initialSongs);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 select-none pb-8 sm:pb-12">
      {/* Dashboard Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 bg-gradient-to-r from-pink-900/30 via-purple-900/20 to-indigo-950/40 border border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/20 via-purple-500/10 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-xl space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[11px] sm:text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to {siteConfig.appName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {siteConfig.welcomeMessage}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {siteConfig.romanticPhrases.homeSubtitle} Choose a song, sing your heart out in Karaoke studio, or build your cozy playlists.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-bold text-xs shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All Songs</span>
            </button>

            <Link
              href="/karaoke"
              className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all shadow-md min-h-[44px]"
            >
              <Mic2 className="w-4 h-4 text-pink-400" />
              <span>Karaoke Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Continue Listening / Recently Played */}
      {recentSongs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>Continue Listening</span>
            </h2>
            <Link href="/playlists" className="text-xs text-pink-400 font-semibold hover:underline">
              Explore Playlists
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {recentSongs.map((song) => (
              <SongCard key={`recent-${song.id}`} song={song} playlistContext={initialSongs} />
            ))}
          </div>
        </section>
      )}

      {/* Karaoke Picks */}
      {karaokePicks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
              <span>Karaoke Picks</span>
            </h2>
            <Link href="/karaoke" className="text-xs text-pink-400 font-semibold hover:underline">
              Open Studio
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {karaokePicks.slice(0, 4).map((song) => (
              <SongCard key={`karaoke-${song.id}`} song={song} playlistContext={karaokePicks} />
            ))}
          </div>
        </section>
      )}

      {/* All Songs Catalog Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span>All Songs Catalog</span>
          </h2>
          <Link href="/playlists" className="text-xs text-pink-400 font-semibold hover:underline">
            Open Playlist
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {initialSongs.map((song) => (
            <SongCard key={`all-${song.id}`} song={song} playlistContext={initialSongs} />
          ))}
        </div>
      </section>
    </div>
  );
}
