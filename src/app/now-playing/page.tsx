"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useRouter } from "next/navigation";
import NowPlayingModal from "@/components/player/NowPlayingModal";

export default function NowPlayingPage() {
  const router = useRouter();
  const setNowPlayingOpen = usePlayerStore((state) => state.setNowPlayingOpen);

  useEffect(() => {
    setNowPlayingOpen(true);
    return () => {
      setNowPlayingOpen(false);
    };
  }, [setNowPlayingOpen]);

  return (
    <div className="h-full flex items-center justify-center">
      <NowPlayingModal />
    </div>
  );
}
