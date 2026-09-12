"use client";

import { useState } from "react";
import Image from "next/image";
import { useTogetherStore } from "@/store/togetherStore";
import { usePlayerStore } from "@/store/playerStore";
import { siteConfig } from "@/config/site";
import { leaveRoom, setSharedControls, updatePlaybackState } from "@/lib/togetherRoom";
import { audioEngine } from "@/lib/audioEngine";
import SyncIndicator from "./SyncIndicator";
import TogetherReactions from "./TogetherReactions";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Copy,
  Check,
  Share2,
  LogOut,
  Shield,
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TogetherPlayer() {
  const {
    room,
    isHost,
    guestConnected,
    sharedControls,
    autoplayBlocked,
    setAutoplayBlocked,
  } = useTogetherStore();

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    queueIndex,
  } = usePlayerStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const hostName = siteConfig.hostName || "Heet";
  const partnerName = siteConfig.partnerName || siteConfig.girlfriendName || "Aaru";

  const canControl = isHost || sharedControls;

  const handleCopyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!room?.code) return;
    const url = `${window.location.origin}/together?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (!room?.code) return;
    const url = `${window.location.origin}/together?room=${room.code}`;
    const shareData = {
      title: "MOONWAVE Together Room",
      text: `Listen with me on MOONWAVE ❤️ (Room Code: ${room.code})`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch {
      handleCopyLink();
    }
  };

  const handlePlayPause = () => {
    if (!canControl) return;
    const newIsPlaying = !isPlaying;
    togglePlay();
    updatePlaybackState({
      songId: currentSong?.id || null,
      queueIndex,
      position: currentTime,
      isPlaying: newIsPlaying,
    });
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    const targetTime = parseFloat(e.target.value);
    seek(targetTime);
    updatePlaybackState({
      songId: currentSong?.id || null,
      queueIndex,
      position: targetTime,
      isPlaying,
    });
  };

  const handleNext = () => {
    if (!canControl) return;
    nextTrack();
    setTimeout(() => {
      const state = usePlayerStore.getState();
      updatePlaybackState({
        songId: state.currentSong?.id || null,
        queueIndex: state.queueIndex,
        position: 0,
        isPlaying: true,
      });
    }, 50);
  };

  const handlePrev = () => {
    if (!canControl) return;
    prevTrack();
    setTimeout(() => {
      const state = usePlayerStore.getState();
      updatePlaybackState({
        songId: state.currentSong?.id || null,
        queueIndex: state.queueIndex,
        position: 0,
        isPlaying: true,
      });
    }, 50);
  };

  const handleUnlockAutoplay = () => {
    const audio = audioEngine.getAudioElement();
    if (audio) {
      audio.play().then(() => {
        setAutoplayBlocked(false);
      }).catch(() => {
        setAutoplayBlocked(false);
      });
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[1px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#0d0d15] rounded-[11px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                MOONWAVE TOGETHER
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                ROOM: {room?.code}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Synchronized listening session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <SyncIndicator />

          <button
            onClick={leaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {/* Autoplay Unlock Banner */}
      {autoplayBlocked && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-pink-500/40 text-center flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <p className="text-xs font-semibold text-white">
            Audio playback was paused by browser policy. Tap to sync!
          </p>
          <button
            onClick={handleUnlockAutoplay}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xs shadow-md hover:scale-105 transition-all shrink-0"
          >
            Tap to Sync & Listen
          </button>
        </div>
      )}

      {/* Participant Identity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Host Card */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-white/5 to-purple-500/5 border border-purple-500/20 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
              ♥
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                HOST
              </p>
              <h3 className="font-semibold text-white text-sm">{hostName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>

        {/* Guest Card */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-white/5 to-pink-500/5 border border-pink-500/20 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
              ♥
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                GUEST
              </p>
              <h3 className="font-semibold text-white text-sm">{partnerName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                guestConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
              )}
            />
            <span className={guestConnected ? "text-emerald-400" : "text-amber-400"}>
              {guestConnected ? "Connected" : "Waiting for partner..."}
            </span>
          </div>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/10 via-[#0d0d15]/80 to-[#09090e] border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />

        {/* Listening Together Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold shadow-md">
          <Radio className="w-3.5 h-3.5 animate-pulse text-pink-400" />
          <span>LISTENING TOGETHER</span>
          <span className="text-[10px] text-pink-400 font-mono">◉ IN SYNC</span>
        </div>

        {/* Album Artwork */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl shadow-pink-500/10 border border-white/10 mb-6 group">
          {currentSong?.artwork ? (
            <Image
              src={currentSong.artwork}
              alt={currentSong.title || "Now Playing"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              No Track Selected
            </div>
          )}
        </div>

        {/* Track Metadata */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">
          {currentSong?.title || "No Track Selected"}
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          {currentSong?.artist || "Unknown Artist"} • {currentSong?.album || "MOONWAVE"}
        </p>

        {/* Progress Bar & Timers */}
        <div className="w-full max-w-xl space-y-2 mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime || 0}
            onChange={handleSeekChange}
            disabled={!canControl}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-zinc-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Player Action Buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
          <button
            onClick={handlePrev}
            disabled={!canControl}
            className="p-3 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={handlePlayPause}
            disabled={!canControl}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 hover:scale-105 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={!canControl}
            className="p-3 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Local Volume Control */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 mb-6 text-xs text-zinc-400">
          <button onClick={toggleMute} className="hover:text-white transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-pink-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
          <span className="text-[10px] text-zinc-500 font-mono">Local volume</span>
        </div>

        {/* Controls Permission Notice */}
        {!canControl && (
          <div className="mb-6 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Host control is enabled. Ask host to toggle Shared Controls.</span>
          </div>
        )}

        {/* Floating Reactions Bar */}
        <TogetherReactions />
      </div>

      {/* Room Options & Shared Controls Panel */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Shared Controls Toggle (Host Only) */}
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-400" />
          <div>
            <h4 className="text-xs font-bold text-white">Shared Playback Controls</h4>
            <p className="text-[11px] text-zinc-400">
              {sharedControls
                ? "Both host & guest can control audio"
                : "Only host can control audio"}
            </p>
          </div>
          {isHost && (
            <button
              onClick={() => setSharedControls(!sharedControls)}
              className={cn(
                "ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all border",
                sharedControls
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/40"
                  : "bg-white/5 text-zinc-400 border-white/10"
              )}
            >
              {sharedControls ? "ON" : "OFF"}
            </button>
          )}
        </div>

        {/* Sharing Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? "Code Copied!" : "Copy Code"}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-xs font-medium text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Share Room</span>
          </button>
        </div>
      </div>
    </div>
  );
}
