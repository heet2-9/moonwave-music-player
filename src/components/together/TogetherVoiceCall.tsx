"use client";

import { useEffect } from "react";
import { useVoiceCallStore } from "@/store/voiceCallStore";
import { cleanupCall } from "@/lib/voiceCall";
import IncomingCall from "./IncomingCall";
import ActiveVoiceCall from "./ActiveVoiceCall";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

export default function TogetherVoiceCall() {
  const { callError, setCallError } = useVoiceCallStore();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall(false);
    };
  }, []);

  // Auto-dismiss call error after 5 seconds
  useEffect(() => {
    if (callError) {
      const timer = setTimeout(() => {
        setCallError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [callError, setCallError]);

  return (
    <>
      <IncomingCall />
      <ActiveVoiceCall />

      {/* Floating Error Toast Notification */}
      <AnimatePresence>
        {callError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md p-4 rounded-2xl bg-gradient-to-r from-rose-950/95 via-rose-900/90 to-red-950/95 border border-rose-500/40 backdrop-blur-xl shadow-2xl text-white shadow-rose-950/40 flex items-start justify-between gap-3 select-none"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-200">Voice Call Notice</h5>
                <p className="text-xs text-rose-100/90 mt-0.5 leading-relaxed">
                  {callError}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCallError(null)}
              aria-label="Dismiss message"
              className="p-1 rounded-full text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
