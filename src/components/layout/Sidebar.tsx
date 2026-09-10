"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { useLibraryStore } from "@/store/libraryStore";
import {
  Home,
  ListMusic,
  Mic2,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper utility for classes
export function navItems() {
  return [
    { label: "Home", href: "/", icon: Home },
    { label: "Playlist", href: "/playlists", icon: ListMusic },
    { label: "Karaoke", href: "/karaoke", icon: Mic2, badge: "Studio" },
  ];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { customPlaylists, createPlaylist } = useLibraryStore();

  const handleNewPlaylist = () => {
    const name = prompt("Enter playlist name:", `Playlist #${customPlaylists.length + 1}`);
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#09090e]/95 backdrop-blur-xl h-screen sticky top-0 z-30 select-none text-zinc-300">
      {/* Brand Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[1px] shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0d0d15] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white group-hover:text-pink-300 transition-colors">
              {siteConfig.appName}
            </h1>
            <p className="text-[10px] text-pink-400/80 font-medium tracking-wide uppercase">
              {siteConfig.nickname}&apos;s Music Space
            </p>
          </div>
        </Link>
      </div>

      {/* Main Navigation List */}
      <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Menu
        </div>
        {navItems().map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-gradient-to-r from-pink-500/15 to-purple-500/10 text-white font-semibold shadow-sm border border-pink-500/20"
                  : "hover:bg-white/5 hover:text-white text-zinc-400"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-pink-400"
                      : "text-zinc-400 group-hover:text-pink-300"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-pink-500 to-purple-500 rounded-r-full" />
              )}
            </Link>
          );
        })}

        {/* Custom Playlists Section */}
        <div className="pt-6">
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
              Playlists
            </span>
            <button
              onClick={handleNewPlaylist}
              className="text-zinc-400 hover:text-pink-400 transition-colors p-1 rounded-md hover:bg-white/5"
              title="Create Playlist"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {customPlaylists.length === 0 ? (
              <p className="px-3 text-xs text-zinc-600 italic py-2">
                No playlists yet
              </p>
            ) : (
              customPlaylists.map((pl) => (
                <Link
                  key={pl.id}
                  href={`/playlists?id=${pl.id}`}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all truncate"
                >
                  <ListMusic className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Romantic Footer Card */}
      <div className="p-4 m-3 rounded-xl bg-gradient-to-b from-white/5 to-pink-500/5 border border-white/5 text-center">
        <p className="text-xs text-zinc-300 font-medium italic">
          &ldquo;{siteConfig.romanticPhrases.homeSubtitle}&rdquo;
        </p>
      </div>
    </aside>
  );
}
