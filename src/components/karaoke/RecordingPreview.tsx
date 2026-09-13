"use client";

import { useEffect, useRef, useState } from "react";
import { useKaraokeStore } from "@/store/karaokeStore";
import { shareKaraokeRecording, downloadRecording } from "@/lib/sharing";
import { Play, Pause, Download, Share2, RefreshCw, Music2, AlertCircle, Info, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface RecordingPreviewProps {
  songTitle: string;
  artist: string;
}

export default function RecordingPreview({ songTitle, artist }: RecordingPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [shareStatusMsg, setShareStatusMsg] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const recordedBlob = useKaraokeStore((state) => state.recordedBlob);
  const recordedUrl = useKaraokeStore((state) => state.recordedUrl);
  const resetKaraokeSession = useKaraokeStore((state) => state.resetKaraokeSession);

  // Trigger celebration confetti when final mixed performance is created
  useEffect(() => {
    if (recordedUrl) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#f472b6", "#a855f7", "#38bdf8"],
        });
      } catch (e) {}
    }
  }, [recordedUrl]);

  // Listeners for Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaybackError(null);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      console.log("[MOONWAVE] Final mixed recording loadedmetadata. Duration:", audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error("[MOONWAVE] Mixed recording playback error:", e);
      setPlaybackError("Failed to decode mixed performance audio.");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [recordedUrl]);

  if (!recordedBlob || !recordedUrl) return null;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Playback exception:", err);
        setPlaybackError(`Unable to play: ${err.message || "User gesture required."}`);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    const customFilename = `moonwave-karaoke-${songTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    downloadRecording(recordedBlob, customFilename);
  };

  const handleShare = async () => {
    setIsSharing(true);
    setShareStatusMsg(null);

    const result = await shareKaraokeRecording({
      blob: recordedBlob,
      songTitle,
      artist,
    });

    setIsSharing(false);
    setShareStatusMsg(result.message);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131320] to-[#0c0c14] border border-pink-500/40 shadow-2xl space-y-6 select-none animate-in fade-in duration-300">
      {/* HTML5 Audio Element */}
      <audio ref={audioRef} src={recordedUrl} preload="auto" className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Your Karaoke Performance</h4>
            <p className="text-xs text-pink-300">
              Mixed Track: Instrumental + Voice ({Math.round(recordedBlob.size / 1024)} KB)
            </p>
          </div>
        </div>
        <button
          onClick={resetKaraokeSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Record Again</span>
        </button>
      </div>

      {playbackError && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{playbackError}</span>
        </div>
      )}

      {/* Interactive Custom Mixed Player */}
      <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            disabled={!!playbackError}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <div className="flex-1 space-y-1">
            <div className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group">
              <div
                className="h-full bg-pink-500 rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Standard Audio Controls Fallback */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] text-zinc-500 mb-1">Standard Audio Player (Mixed Audio):</p>
          <audio src={recordedUrl} controls className="w-full h-8 accent-pink-500" />
        </div>
      </div>

      {shareStatusMsg && (
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <span>{shareStatusMsg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all border border-white/10 shadow-md"
        >
          <Download className="w-4 h-4 text-pink-400" />
          <span>Download Performance</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>{isSharing ? "Sharing..." : "Share Performance"}</span>
        </button>
      </div>
    </div>
  );
}
