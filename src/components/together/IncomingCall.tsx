"use client";

import { useVoiceCallStore } from "@/store/voiceCallStore";
import { acceptIncomingCall, declineIncomingCall } from "@/lib/voiceCall";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, PhoneCall } from "lucide-react";

export default function IncomingCall() {
  const { callStatus, remoteParticipantName } = useVoiceCallStore();

  if (callStatus !== "incoming") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm p-5 rounded-3xl bg-[#0d0d15]/95 border border-pink-500/30 backdrop-blur-2xl shadow-2xl shadow-pink-500/20 text-center select-none"
      >
        {/* Animated Calling Ripple */}
        <div className="relative mx-auto w-16 h-16 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-pink-500/30 animate-ping" />
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 p-[2px] shadow-lg shadow-pink-500/30">
            <div className="w-full h-full bg-[#0d0d15] rounded-full flex items-center justify-center text-pink-400">
              <PhoneCall className="w-6 h-6 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Title & Name */}
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
          INCOMING VOICE CALL
        </span>

        <h3 className="mt-2 text-xl font-extrabold text-white tracking-tight">
          {remoteParticipantName || "Partner"}
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5 flex items-center justify-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          <span>Calling you...</span>
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={() => declineIncomingCall()}
            aria-label="Decline voice call"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            <PhoneOff className="w-4 h-4 text-rose-400" />
            <span>DECLINE</span>
          </button>

          <button
            onClick={() => acceptIncomingCall()}
            aria-label="Accept voice call"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <Phone className="w-4 h-4" />
            <span>ACCEPT</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
