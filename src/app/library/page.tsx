"use client";

import { useState, useMemo } from "react";
import { initialSongs } from "@/data/songs";
import SongCard from "@/components/music/SongCard";
import SongRow from "@/components/music/SongRow";
import { Music2, LayoutGrid, List, Search, Filter } from "lucide-react";

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [filterQuery, setFilterQuery] = useState("");

  const genres = useMemo(() => {
    const set = new Set<string>();
    initialSongs.forEach((s) => set.add(s.genre));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredSongs = useMemo(() => {
    return initialSongs.filter((song) => {
      const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
      const matchesQuery =
        filterQuery === "" ||
        song.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(filterQuery.toLowerCase()) ||
        song.album.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesGenre && matchesQuery;
    });
  }, [selectedGenre, filterQuery]);

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music2 className="w-6 h-6 text-pink-400" />
            <span>Music Library</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Explore all {initialSongs.length} songs in your private space.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-pink-500 text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-pink-500 text-white" : "text-zinc-400 hover:text-white"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter library..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        {/* Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === genre
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      {filteredSongs.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-sm font-medium">Nothing matched your search filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} playlistContext={filteredSongs} />
          ))}
        </div>
      ) : (
        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
          {filteredSongs.map((song, idx) => (
            <SongRow key={song.id} song={song} index={idx} playlistContext={filteredSongs} />
          ))}
        </div>
      )}
    </div>
  );
}
