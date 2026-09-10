"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Search, Sparkles, User, Mic2 } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good evening");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#09090e]/90 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Mobile Brand / Desktop Greeting */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="md:hidden flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-wider text-xs sm:text-sm truncate">
            {siteConfig.appName}
          </span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">{siteConfig.nickname}</span> ✨
          </h2>
          <p className="text-xs text-zinc-400">{siteConfig.tagline}</p>
        </div>
      </div>

      {/* Global Search Bar (Desktop & Tablet) */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative hidden sm:block">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs, artists, albums, or genres..."
          className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/search"
          className="sm:hidden p-2 rounded-full bg-white/5 text-zinc-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Search"
        >
          <Search className="w-4 h-4 text-pink-400" />
        </Link>

        <Link
          href="/karaoke"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-xs font-semibold text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 transition-all shadow-sm min-h-[44px]"
        >
          <Mic2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs">Karaoke</span>
        </Link>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 p-[1px] shadow-sm shrink-0">
          <div className="w-full h-full bg-[#0d0d15] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-pink-300" />
          </div>
        </div>
      </div>
    </header>
  );
}
