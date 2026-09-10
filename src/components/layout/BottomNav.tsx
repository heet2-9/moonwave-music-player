"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListMusic, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Playlist", href: "/playlists", icon: ListMusic },
    { label: "Karaoke", href: "/karaoke", icon: Mic2, badge: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090e]/95 backdrop-blur-2xl border-t border-white/10 px-1 select-none pb-safe">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] rounded-xl transition-all relative py-1",
                isActive ? "text-pink-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110 text-pink-400")} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[60px]">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
