"use client";

import { useTogetherStore } from "@/store/togetherStore";
import { sendReaction } from "@/lib/togetherRoom";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["❤️", "✨", "🔥", "🥹", "🎵"];

export default function TogetherReactions() {
  const reactions = useTogetherStore((state) => state.reactions);
  const removeReaction = useTogetherStore((state) => state.removeReaction);

  return (
    <div className="relative flex flex-col items-center w-full select-none">
      {/* Floating Reactions Canvas */}
      <div className="absolute -top-36 inset-x-0 h-36 pointer-events-none overflow-hidden flex justify-center">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: 30, scale: 0.5 }}
              animate={{ opacity: 0, y: -90, scale: 1.4, x: ((r.timestamp % 11) - 5) * 8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              onAnimationComplete={() => removeReaction(r.id)}
              className="absolute bottom-2 flex flex-col items-center gap-0.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-pink-500/30 shadow-lg"
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-[10px] text-pink-300 font-semibold">{r.sender}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-xl shadow-lg">
        <span className="text-[11px] font-medium text-zinc-400 mr-1 hidden sm:inline">
          Send reaction:
        </span>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="text-lg sm:text-xl p-1.5 rounded-full hover:bg-white/10 hover:scale-125 transition-all active:scale-95"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
