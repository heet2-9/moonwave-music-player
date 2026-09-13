"use client";

import { useVoiceCallStore } from "@/store/voiceCallStore";
import { toggleMicrophoneMute, cleanupCall } from "@/lib/voiceCall";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Minimize2,
  Maximize2,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActiveVoiceCall() {
  const {
    callStatus,
    remoteParticipantName,
    callDuration,
    isMuted,
    isSpeakerEnabled,
    toggleSpeaker,
    isCallPanelOpen,
    toggleCallPanel,
  } = useVoiceCallStore();

  const isCallActive =
    callStatus === "calling" ||
    callStatus === "connecting" ||
    callStatus === "connected";

  if (!isCallActive) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 select-none max-w-[95vw]"
      >
        {isCallPanelOpen ? (
          /* Expanded Active Call Panel */
          <div className="w-[280px] sm:w-[320px] p-4 sm:p-5 rounded-3xl bg-[#0d0d15]/95 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-950/30 flex flex-col items-center text-center space-y-4">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold tracking-wider">
                {callStatus === "connected" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">VOICE CONNECTED</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-amber-400">
                      {callStatus === "calling" ? "CALLING..." : "CONNECTING..."}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={toggleCallPanel}
                aria-label="Minimize Call Panel"
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize Call Panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Partner Avatar & Name */}
            <div>
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20 mb-2">
                <div className="w-full h-full bg-[#09090e] rounded-full flex items-center justify-center font-bold text-white text-lg">
                  {remoteParticipantName ? remoteParticipantName.charAt(0).toUpperCase() : "♥"}
                </div>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                {remoteParticipantName || "Partner"}
              </h4>
              <p className="text-xs text-pink-300 font-mono mt-0.5 font-bold">
                {callStatus === "connected" ? formatTimer(callDuration) : "Ringing..."}
              </p>
            </div>

            {/* Call Action Controls */}
            <div className="w-full grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => toggleMicrophoneMute()}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all active:scale-95",
                  isMuted
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-white/10 border-white/10 text-white hover:bg-white/15"
                )}
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4 text-amber-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span>Live</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleSpeaker}
                aria-label="Toggle speaker volume"
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all active:scale-95",
                  isSpeakerEnabled
                    ? "bg-white/10 border-white/10 text-white hover:bg-white/15"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                )}
              >
                {isSpeakerEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span>Speaker</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-zinc-500" />
                    <span>Off</span>
                  </>
                )}
              </button>
            </div>

            {/* End Call Button */}
            <button
              onClick={() => cleanupCall(false)}
              aria-label="End voice call"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-rose-600/30 active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>END CALL</span>
            </button>
          </div>
        ) : (
          /* Minimized Call Floating Bar */
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#0d0d15]/95 border border-pink-500/30 backdrop-blur-2xl shadow-xl shadow-pink-500/20 text-white text-xs font-bold">
            <button
              onClick={toggleCallPanel}
              aria-label="Expand Call Controls"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  callStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
                )}
              />
              <Phone className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[140px]">
                {remoteParticipantName || "Partner"}
              </span>
              <span className="text-pink-300 font-mono text-[11px] shrink-0">
                {callStatus === "connected" ? formatTimer(callDuration) : "Ringing..."}
              </span>
            </button>

            <div className="h-3.5 w-[1px] bg-white/10 mx-0.5 shrink-0" />

            {/* Quick Mute Toggle */}
            <button
              onClick={() => toggleMicrophoneMute()}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              className={cn(
                "p-1 rounded-full transition-colors shrink-0",
                isMuted ? "text-amber-400 hover:bg-amber-500/20" : "text-emerald-400 hover:bg-emerald-500/20"
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Quick End Call */}
            <button
              onClick={() => cleanupCall(false)}
              aria-label="End voice call"
              className="p-1 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors shrink-0"
              title="End Call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>

            {/* Expand Button */}
            <button
              onClick={toggleCallPanel}
              aria-label="Expand call controls"
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Expand"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
