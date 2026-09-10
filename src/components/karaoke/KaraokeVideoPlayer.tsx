"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { KaraokeSong } from "@/data/karaokeSongs";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import Image from "next/image";

import { usePlayerStore } from "@/store/playerStore";

interface KaraokeVideoPlayerProps {
  song: KaraokeSong;
  onVideoEnd?: () => void;
}

export interface KaraokeVideoPlayerRef {
  getVideoElement: () => HTMLVideoElement | null;
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (time: number) => void;
}

const KaraokeVideoPlayer = forwardRef<KaraokeVideoPlayerRef, KaraokeVideoPlayerProps>(
  ({ song, onVideoEnd }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
      play: async () => {
        if (videoRef.current) {
          try {
            usePlayerStore.getState().setIsPlaying(false);
            await videoRef.current.play();
            setIsPlaying(true);
          } catch (e) {
            console.warn("[MOONWAVE] Video play exception:", e);
          }
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      },
    }));

    useEffect(() => {
      setVideoError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, [song.videoSrc]);

    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        usePlayerStore.getState().setIsPlaying(false);
        video.play().then(() => setIsPlaying(true)).catch((err) => {
          console.warn("[MOONWAVE] Play error:", err);
          setVideoError("Click to play karaoke video.");
        });
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const toggleFullscreen = () => {
      const videoContainer = videoRef.current?.parentElement;
      if (!videoContainer) return;

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        videoContainer.requestFullscreen().catch(() => {});
      }
    };

    const formatTime = (secs: number) => {
      if (isNaN(secs)) return "0:00";
      const mins = Math.floor(secs / 60);
      const remainder = Math.floor(secs % 60);
      return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="w-full rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl relative group select-none">
        {/* Main HTML5 Video Player */}
        <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
          <video
            ref={videoRef}
            src={song.videoSrc}
            playsInline
            crossOrigin="anonymous"
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || 0);
                console.log("[MOONWAVE] Karaoke video loaded:", song.title, "Duration:", videoRef.current.duration);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (onVideoEnd) onVideoEnd();
            }}
            onError={(e) => {
              console.error("[MOONWAVE] Video error:", e);
              setVideoError("This local karaoke video file could not be loaded.");
            }}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Video Loading Error Display */}
          {videoError && (
            <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center p-6 text-center z-10">
              <p className="text-sm font-semibold text-red-300 mb-3">{videoError}</p>
              <button
                onClick={togglePlay}
                className="px-4 py-2 rounded-full bg-pink-500 text-white font-bold text-xs shadow-md"
              >
                Retry Playback
              </button>
            </div>
          )}

          {/* Big Play Overlay Button when paused */}
          {!isPlaying && !videoError && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group-hover:bg-black/30 transition-all"
            >
              <button className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-pink-500/40 hover:scale-110 active:scale-95 transition-all">
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Custom Cinematic Controls Overlay */}
        <div className="p-3 bg-[#0a0a12]/95 border-t border-white/10 flex flex-col gap-2">
          {/* Seek Slider */}
          <div className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group/seek">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover/seek:scale-100 transition-transform" />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-[11px] text-zinc-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleFullscreen} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300" title="Fullscreen">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

KaraokeVideoPlayer.displayName = "KaraokeVideoPlayer";

export default KaraokeVideoPlayer;
