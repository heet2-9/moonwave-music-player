"use client";

import { useState, useRef, useEffect } from "react";
import { useTogetherStore } from "@/store/togetherStore";
import { useTogetherChatStore } from "@/store/togetherChatStore";
import { sendReaction, sendTypingSignal, sendReadReceipt } from "@/lib/togetherRoom";
import { siteConfig } from "@/config/site";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  ArrowDown,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_REACTIONS = ["❤️", "✨", "🔥", "🥹", "🎵"];

export default function TogetherChat() {
  const {
    isChatOpen,
    setChatOpen,
    messages,
    sendMessage,
    draftMessage,
    setDraftMessage,
    isPartnerTyping,
    typingParticipantName,
  } = useTogetherChatStore();

  const { isHost, participantId, connectionState, room } = useTogetherStore();

  const partnerName = isHost
    ? siteConfig.partnerName || "Aaru"
    : siteConfig.hostName || "Heet";

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Local typing state refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalTypingRef = useRef<boolean>(false);

  // Seen tracking set
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const showScrollBottom = !isNearBottom && messages.length > 0;

  // Character limit validation
  const maxLength = 500;
  const currentLength = draftMessage.length;
  const isOverLimit = currentLength > maxLength;
  const isValid = draftMessage.trim().length > 0 && !isOverLimit;

  const stopLocalTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isLocalTypingRef.current) {
      isLocalTypingRef.current = false;
      sendTypingSignal(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDraftMessage(value);

    if (value.trim().length > 0) {
      if (!isLocalTypingRef.current) {
        isLocalTypingRef.current = true;
        sendTypingSignal(true);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopLocalTyping();
      }, 1500);
    } else {
      stopLocalTyping();
    }
  };

  // Clean up typing status on close or unmount
  useEffect(() => {
    return () => {
      stopLocalTyping();
    };
  }, []);

  useEffect(() => {
    if (!isChatOpen) {
      stopLocalTyping();
    }
  }, [isChatOpen]);

  // Viewport IntersectionObserver for Seen Receipts
  useEffect(() => {
    if (!isChatOpen || !messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const messageId = entry.target.getAttribute("data-message-id");
            if (messageId && !seenMessageIdsRef.current.has(messageId)) {
              seenMessageIdsRef.current.add(messageId);
              sendReadReceipt(messageId);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    const remoteElements = container.querySelectorAll("[data-remote-message='true']");
    remoteElements.forEach((el) => {
      const msgId = el.getAttribute("data-message-id");
      if (msgId && !seenMessageIdsRef.current.has(msgId)) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [isChatOpen, messages]);

  // Auto-scroll handler
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
  };

  // Monitor scroll position
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
  };

  // Auto scroll on new messages
  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, isNearBottom]);

  // Initial scroll when opening chat
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => scrollToBottom("instant"), 50);
    }
  }, [isChatOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid) return;

    stopLocalTyping();
    sendMessage(draftMessage);
    setTimeout(() => scrollToBottom("smooth"), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (!isChatOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-x-3 bottom-3 top-20 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-[400px] sm:h-[560px] z-50 flex flex-col rounded-3xl bg-[#0d0d15]/95 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/20">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  TOGETHER CHAT
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {room?.code || "ROOM"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {connectionState === "Connected" ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-medium">Listening together</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-amber-400 font-medium">Reconnecting...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setChatOpen(false)}
            aria-label="Close Chat"
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3.5 relative scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-zinc-400 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  You&apos;re listening together.
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Send a message while you listen with {partnerName}.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isLocal = msg.senderId === participantId;
              return (
                <div
                  key={msg.id}
                  data-message-id={msg.id}
                  data-remote-message={!isLocal ? "true" : "false"}
                  className={cn(
                    "flex flex-col max-w-[82%]",
                    isLocal ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  {!isLocal && (
                    <span className="text-[10px] font-semibold text-pink-300 mb-1 px-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap shadow-md border",
                      isLocal
                        ? "bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 border-pink-500/40 text-white rounded-tr-xs"
                        : "bg-white/10 border-white/10 text-white rounded-tl-xs"
                    )}
                  >
                    {msg.text}
                  </div>
                  {isLocal ? (
                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-zinc-500 font-mono">
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.seen ? (
                        <span className="text-pink-400 font-bold flex items-center gap-0.5" title="Seen by partner">
                          ✓✓ Seen
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-bold" title="Sent">
                          ✓
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] text-zinc-500 mt-1 px-1 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              );
            })
          )}

          {/* New Message Floating Pill */}
          {showScrollBottom && (
            <button
              onClick={() => scrollToBottom("smooth")}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 mx-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-all z-20"
            >
              <span>New message</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Reactions Bar */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-zinc-400 font-medium shrink-0">React:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-base p-1 rounded-full hover:bg-white/10 hover:scale-125 transition-all active:scale-95 shrink-0"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Partner Typing Indicator */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-1.5 bg-pink-500/10 border-t border-pink-500/20 flex items-center gap-2 text-xs text-pink-300 font-medium shrink-0"
            >
              <span>{typingParticipantName || partnerName} is typing</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-white/10 bg-[#09090e]/80 shrink-0 space-y-2"
        >
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={draftMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${partnerName}...`}
              maxLength={maxLength}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all pr-12"
            />

            <button
              type="submit"
              disabled={!isValid}
              aria-label="Send message"
              className="absolute right-1.5 p-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-md shadow-pink-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Character counter notice if typing long message */}
          {currentLength > 400 && (
            <div className="flex justify-end px-1">
              <span
                className={cn(
                  "text-[10px] font-mono",
                  isOverLimit ? "text-rose-400 font-bold" : "text-zinc-400"
                )}
              >
                {currentLength} / {maxLength}
              </span>
            </div>
          )}
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
