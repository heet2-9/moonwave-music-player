"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTogetherStore } from "@/store/togetherStore";
import { createRoom, joinRoom, normalizeRoomCode } from "@/lib/togetherRoom";
import { isSupabaseConfigured } from "@/lib/supabase";
import TogetherPlayer from "@/components/together/TogetherPlayer";
import { Sparkles, Users, Radio, ArrowRight, Heart, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function TogetherContent() {
  const searchParams = useSearchParams();
  const roomQuery = searchParams.get("room");

  const { isJoined, error, setError } = useTogetherStore();

  const [inputCode, setInputCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  useEffect(() => {
    if (roomQuery) {
      setInputCode(normalizeRoomCode(roomQuery));
      setActiveTab("join");
    }
  }, [roomQuery]);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      await createRoom();
    } catch (err: any) {
      setError(err.message || "Failed to create room.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeRoomCode(inputCode);
    if (!clean) {
      setError("Please enter a valid room code.");
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      await joinRoom(clean);
    } catch (err: any) {
      setError(err.message || "Room not found. Check the code and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  if (isJoined) {
    return <TogetherPlayer />;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-8 px-4 select-none">
      <div className="w-full max-w-lg mx-auto text-center space-y-8">
        {/* Ambient Top Glow */}
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-2xl opacity-75" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[1px] shadow-2xl mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0d15] rounded-[15px] flex items-center justify-center">
              <Radio className="w-8 h-8 text-pink-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
            <span>MOONWAVE TOGETHER ROOM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Listen together, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
              even when you&apos;re apart.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
            Create a private room and share the moment with synchronized real-time audio playback.
          </p>
        </div>

        {/* Supabase Unconfigured Warning Banner */}
        {!isSupabaseConfigured && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 text-left backdrop-blur-md shadow-md">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">Cross-Device Sync Setup Notice</p>
              <p className="text-amber-200/80 leading-relaxed">
                Together Rooms require Supabase environment variables for real-time synchronization between different devices over the internet.
                Currently running in same-device browser fallback mode. Add <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 font-mono">.env.local</code> to enable cross-device phone ↔ laptop sync.
              </p>
            </div>
          </div>
        )}

        {/* Action Card Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/10 via-[#0d0d15]/90 to-[#09090e] border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-white/5 border border-white/5">
            <button
              onClick={() => {
                setActiveTab("create");
                setError(null);
              }}
              className={cn(
                "py-2.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "create"
                  ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30 shadow-md"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              CREATE ROOM
            </button>
            <button
              onClick={() => {
                setActiveTab("join");
                setError(null);
              }}
              className={cn(
                "py-2.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "join"
                  ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30 shadow-md"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              JOIN ROOM
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Create Room */}
          {activeTab === "create" && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-zinc-400">
                Instantly generate a private 2-person room code to share.
              </p>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <span>Creating Room...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-pink-200" />
                    <span>CREATE ROOM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Join Room */}
          {activeTab === "join" && (
            <form onSubmit={handleJoin} className="space-y-4 pt-2">
              <p className="text-xs text-zinc-400">
                Enter the room code shared with you.
              </p>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(normalizeRoomCode(e.target.value))}
                placeholder="Enter room code (e.g. MOON-7K4P)"
                maxLength={12}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-center text-sm font-mono tracking-widest text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 uppercase transition-all"
              />
              <button
                type="submit"
                disabled={isJoining || !inputCode.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <span>Joining Room...</span>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-pink-200" />
                    <span>JOIN ROOM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature Sub-note */}
        <p className="text-[11px] text-zinc-500 italic">
          &ldquo;Two places. One song.&rdquo; • Audio files remain stored locally on your device.
        </p>
      </div>
    </div>
  );
}

export default function TogetherPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading Together Room...</div>}>
      <TogetherContent />
    </Suspense>
  );
}
