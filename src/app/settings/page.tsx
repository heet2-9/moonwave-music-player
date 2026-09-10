"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import {
  Settings,
  Heart,
  History,
  Trash2,
  Sparkles,
  Volume2,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const clearFavorites = useLibraryStore((state) => state.clearFavorites);
  const clearRecentlyPlayed = useLibraryStore((state) => state.clearRecentlyPlayed);
  const resetAllData = useLibraryStore((state) => state.resetAllData);
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);

  const [audioQuality, setAudioQuality] = useState("High (320 kbps)");
  const [autoplay, setAutoplay] = useState(true);
  const [accent, setAccent] = useState("Soft Pink / Violet");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all stored favorites, playlists, and history?")) {
      resetAllData();
      setStatusMsg("All local data has been reset successfully.");
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-pink-400" />
          <span>Settings & Preferences</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Configure audio quality, playback preferences, and privacy.</p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-pink-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="space-y-6">
        {/* Playback & Audio */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-pink-400">
            Audio & Playback
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <h4 className="text-sm font-semibold text-white">Audio Stream Quality</h4>
              <p className="text-xs text-zinc-400">High fidelity streaming resolution</p>
            </div>
            <select
              value={audioQuality}
              onChange={(e) => setAudioQuality(e.target.value)}
              className="bg-[#12121e] border border-white/10 rounded-lg text-xs font-medium text-white px-3 py-1.5 focus:outline-none"
            >
              <option value="High (320 kbps)">High (320 kbps)</option>
              <option value="Standard (192 kbps)">Standard (192 kbps)</option>
              <option value="Data Saver (128 kbps)">Data Saver (128 kbps)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <h4 className="text-sm font-semibold text-white">Autoplay Next Track</h4>
              <p className="text-xs text-zinc-400">Automatically play next song when current track ends</p>
            </div>
            <button
              onClick={() => setAutoplay(!autoplay)}
              className={`w-12 h-6 rounded-full transition-colors p-1 relative ${
                autoplay ? "bg-pink-500" : "bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoplay ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="text-sm font-semibold text-white">Default Output Volume</h4>
              <p className="text-xs text-zinc-400">Current level: {Math.round(volume * 100)}%</p>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-28 accent-pink-500 h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Data & Storage */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
            Data & Privacy Management
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <h4 className="text-sm font-semibold text-white">Clear Favorites</h4>
              <p className="text-xs text-zinc-400">Remove all tracks saved in favorites</p>
            </div>
            <button
              onClick={() => {
                clearFavorites();
                setStatusMsg("Favorites cleared.");
                setTimeout(() => setStatusMsg(null), 3000);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Clear Favorites
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <h4 className="text-sm font-semibold text-white">Clear Listening History</h4>
              <p className="text-xs text-zinc-400">Remove all recently played history logs</p>
            </div>
            <button
              onClick={() => {
                clearRecentlyPlayed();
                setStatusMsg("Listening history cleared.");
                setTimeout(() => setStatusMsg(null), 3000);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="text-sm font-semibold text-white text-red-300">Reset Local Storage</h4>
              <p className="text-xs text-zinc-400">Reset all app preferences, playlists, and cached states</p>
            </div>
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold text-red-300 border border-red-500/30 transition-colors"
            >
              Reset All
            </button>
          </div>
        </section>

        {/* Personal Note Card */}
        <section className="p-6 rounded-2xl bg-gradient-to-r from-pink-950/30 via-purple-950/20 to-indigo-950/30 border border-pink-500/30 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-bold text-white">{siteConfig.personalNote.title}</h3>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
            {siteConfig.personalNote.content}
          </p>
          <div className="pt-2 text-[11px] text-pink-400/80 font-medium">
            {siteConfig.appName} • Version 1.0.0 • Designed for {siteConfig.girlfriendName}
          </div>
        </section>
      </div>
    </div>
  );
}
