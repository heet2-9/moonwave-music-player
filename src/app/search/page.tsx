"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { initialSongs } from "@/data/songs";
import SongRow from "@/components/music/SongRow";
import { Search, Music, User, Disc, Sparkles } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const results = useMemo(() => {
    if (!query.trim()) return { songs: [], artists: [], albums: [] };
    const q = query.toLowerCase().trim();

    const matchingSongs = initialSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q)
    );

    const matchingArtists = Array.from(
      new Set(
        initialSongs
          .filter((s) => s.artist.toLowerCase().includes(q))
          .map((s) => s.artist)
      )
    );

    const matchingAlbums = Array.from(
      new Set(
        initialSongs
          .filter((s) => s.album.toLowerCase().includes(q))
          .map((s) => s.album)
      )
    );

    return { songs: matchingSongs, artists: matchingArtists, albums: matchingAlbums };
  }, [query]);

  return (
    <div className="space-y-6 sm:space-y-8 select-none pb-12">
      {/* Search Header Input */}
      <div className="relative max-w-xl mx-auto w-full">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums, or genres..."
          className="w-full bg-[#12121e] border border-white/10 rounded-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 shadow-xl transition-all"
          autoFocus
        />
      </div>

      {!query.trim() ? (
        <div className="py-16 text-center text-zinc-500 space-y-3">
          <Sparkles className="w-10 h-10 text-pink-400/50 mx-auto animate-pulse" />
          <p className="text-xs sm:text-sm font-medium">Type a song title, artist name, or genre to explore.</p>
        </div>
      ) : results.songs.length === 0 && results.artists.length === 0 && results.albums.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-sm sm:text-base font-semibold text-zinc-300">Nothing matched your search.</p>
          <p className="text-xs text-zinc-500 mt-1">Try searching for &ldquo;Lofi&rdquo;, &ldquo;Aaru&rdquo;, or &ldquo;Sweet&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Songs Section */}
          {results.songs.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-400" />
                <span>Songs ({results.songs.length})</span>
              </h3>
              <div className="space-y-1 bg-white/[0.02] border border-white/5 p-1.5 sm:p-2 rounded-2xl">
                {results.songs.map((song, idx) => (
                  <SongRow key={song.id} song={song} index={idx} playlistContext={results.songs} />
                ))}
              </div>
            </section>
          )}

          {/* Artists Section */}
          {results.artists.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span>Artists</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.artists.map((artist) => (
                  <div
                    key={artist}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {artist[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{artist}</h4>
                      <p className="text-[11px] text-zinc-400">Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums Section */}
          {results.albums.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Disc className="w-4 h-4 text-indigo-400" />
                <span>Albums</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.albums.map((album) => (
                  <div
                    key={album}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 min-w-0"
                  >
                    <Disc className="w-7 h-7 text-pink-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{album}</h4>
                      <p className="text-[11px] text-zinc-400">Album</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500 text-xs">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
