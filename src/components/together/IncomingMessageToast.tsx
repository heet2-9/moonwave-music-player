"use client";

import { useRef, useEffect } from "react";
import { useTogetherChatStore } from "@/store/togetherChatStore";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";

export default function IncomingMessageToast() {
  const { toastNotification, dismissToast, setChatOpen, unreadCount } =
    useTogetherChatStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (toastNotification) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 4500);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toastNotification, dismissToast]);

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resumeTimer = () => {
    if (toastNotification && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 4500);
    }
  };

  if (!toastNotification) return null;

  const handleClick = () => {
    pauseTimer();
    dismissToast();
    setChatOpen(true);
  };

  const handleCloseButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    pauseTimer();
    dismissToast();
  };

  const textPreview =
    toastNotification.text.length > 70
      ? `${toastNotification.text.substring(0, 70)}...`
      : toastNotification.text;

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "NOW";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onMouseEnter={pauseTimer}
        onMouseLeave={resumeTimer}
        onTouchStart={pauseTimer}
        onTouchEnd={resumeTimer}
        onClick={handleClick}
        className="fixed top-4 inset-x-4 max-w-[380px] mx-auto sm:top-6 sm:right-6 sm:left-auto sm:mx-0 sm:w-[380px] z-50 p-4 rounded-2xl bg-[#0d0d15]/95 border border-pink-500/30 backdrop-blur-2xl shadow-2xl shadow-pink-500/10 cursor-pointer select-none group hover:border-pink-500/50 transition-all"
      >
        <div className="flex items-start gap-3">
          {/* Avatar / Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                {toastNotification.senderName}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {unreadCount > 1 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    +{unreadCount - 1} more
                  </span>
                )}
                <span className="text-[9px] font-mono text-zinc-400">
                  {formatTime(toastNotification.timestamp)}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-snug line-clamp-2 break-words">
              {textPreview}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={handleCloseButton}
            aria-label="Dismiss notification"
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
