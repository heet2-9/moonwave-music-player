"use client";

import { Suspense, useRef } from "react";
import { useKaraokeStore } from "@/store/karaokeStore";
import KaraokeSongList from "@/components/karaoke/KaraokeSongList";
import KaraokeVideoPlayer, { KaraokeVideoPlayerRef } from "@/components/karaoke/KaraokeVideoPlayer";
import KaraokeMixerRecorder from "@/components/karaoke/KaraokeMixerRecorder";
import RecordingPreview from "@/components/karaoke/RecordingPreview";
import { Mic2, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";

function KaraokeContent() {
  const videoPlayerRef = useRef<KaraokeVideoPlayerRef | null>(null);

  const selectedSong = useKaraokeStore((state) => state.selectedKaraokeSong);
  const status = useKaraokeStore((state) => state.status);

  return (
    <div className="space-y-8 select-none pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local Studio Mode</span>
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mic2 className="w-6 h-6 text-pink-400 animate-pulse" />
          <span>Karaoke Studio</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {siteConfig.romanticPhrases.karaokeSubtitle} Sing along with local karaoke videos and record mixed audio (Instrumental + Voice).
        </p>
      </div>

      {/* 1. Karaoke Song Selection Cards */}
      <KaraokeSongList />

      {/* 2. Main Studio View Grid (Video Left / Mixer & Recorder Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Column: Local HTML5 Karaoke Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base truncate">{selectedSong.title}</h3>
            <span className="text-xs text-pink-400 font-semibold">{selectedSong.artist}</span>
          </div>

          <KaraokeVideoPlayer
            ref={videoPlayerRef}
            song={selectedSong}
            onVideoEnd={() => {
              console.log("[MOONWAVE] Video ended.");
            }}
          />
        </div>

        {/* Right Column: Web Audio Mixer & Recorder Controls */}
        <div className="lg:col-span-5 space-y-6">
          <KaraokeMixerRecorder
            song={selectedSong}
            getVideoElement={() => videoPlayerRef.current?.getVideoElement() || null}
            onStartVideo={async () => {
              if (videoPlayerRef.current) {
                await videoPlayerRef.current.play();
              }
            }}
            onPauseVideo={() => {
              if (videoPlayerRef.current) {
                videoPlayerRef.current.pause();
              }
            }}
            onSeekVideo={(time: number) => {
              if (videoPlayerRef.current) {
                videoPlayerRef.current.seekTo(time);
              }
            }}
          />

          {/* Mixed Performance Preview */}
          {status === "completed" && (
            <RecordingPreview songTitle={selectedSong.title} artist={selectedSong.artist} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function KaraokePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500 text-xs">Loading Karaoke Studio...</div>}>
      <KaraokeContent />
    </Suspense>
  );
}
