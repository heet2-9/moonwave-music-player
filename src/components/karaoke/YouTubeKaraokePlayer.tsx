"use client";

import { useEffect, useState } from "react";
import { ExternalLink, VideoOff, Play } from "lucide-react";
import { Song } from "@/types/music";

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

interface YouTubeKaraokePlayerProps {
  song: Song;
}

export default function YouTubeKaraokePlayer({ song }: YouTubeKaraokePlayerProps) {
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setIframeError(false);
  }, [song.id]);

  if (!song.karaokeVideoId) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${song.title} ${song.artist} karaoke`
    )}`;

    return (
      <div className="w-full aspect-video rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center p-6 text-center select-none shadow-xl">
        <VideoOff className="w-12 h-12 text-zinc-600 mb-3" />
        <h4 className="text-base font-bold text-white mb-1">Karaoke video hasn&apos;t been added for this song.</h4>
        <p className="text-xs text-zinc-400 mb-5 max-w-sm">
          You can still record your microphone while listening to the audio or find a video on YouTube.
        </p>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-all shadow-md"
        >
          <YouTubeIcon className="w-4 h-4 text-red-500" />
          <span>Search &ldquo;{song.title}&rdquo; on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative">
      <div className="relative aspect-video w-full">
        {!iframeError ? (
          <iframe
            src={`https://www.youtube.com/embed/${song.karaokeVideoId}?autoplay=0&rel=0&enablejsapi=1&origin=${
              typeof window !== "undefined" ? window.location.origin : ""
            }`}
            title={`${song.title} Karaoke Video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setIframeError(true)}
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-center p-4">
            <p className="text-xs text-zinc-400 mb-3">YouTube video embed unavailable.</p>
            <a
              href={`https://www.youtube.com/watch?v=${song.karaokeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold"
            >
              <YouTubeIcon className="w-4 h-4" />
              <span>Watch on YouTube</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
