"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import PersistentPlayer from "@/components/player/PersistentPlayer";
import AudioPlayerController from "@/components/player/AudioPlayerController";
import QueueDrawer from "@/components/player/QueueDrawer";
import LyricsDrawer from "@/components/player/LyricsDrawer";
import NowPlayingModal from "@/components/player/NowPlayingModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#09090e] text-zinc-100 font-sans overflow-hidden antialiased selection:bg-pink-500 selection:text-white">
      {/* Invisible HTML5 Audio Engine & State Controller */}
      <AudioPlayerController />

      {/* Desktop Sidebar (hidden on mobile, visible md+) */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <Header />

        {/* Scrollable Page Content Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 pb-36 sm:pb-32 md:pb-24 custom-scrollbar">
          {children}
        </main>

        {/* Persistent Bottom Player Bar */}
        <PersistentPlayer />

        {/* Mobile Bottom Nav */}
        <BottomNav />

        {/* Global Overlays & Drawers */}
        <QueueDrawer />
        <LyricsDrawer />
        <NowPlayingModal />
      </div>
    </div>
  );
}
