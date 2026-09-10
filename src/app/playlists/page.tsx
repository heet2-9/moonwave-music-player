"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import { initialSongs } from "@/data/songs";
import SongRow from "@/components/music/SongRow";
import { ListMusic, PlusCircle, Play, Trash2, Edit2, Music } from "lucide-react";
import Image from "next/image";

function PlaylistsContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const customPlaylists = useLibraryStore((state) => state.customPlaylists);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const renamePlaylist = useLibraryStore((state) => state.renamePlaylist);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);
  const playSong = usePlayerStore((state) => state.playSong);

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    selectedId || "all-songs"
  );

  const isAllSongsActive = activePlaylistId === "all-songs";

  const activePlaylist = useMemo(() => {
    if (isAllSongsActive) {
      return {
        id: "all-songs",
        name: "All Songs Collection",
        description: "Complete music catalog",
        songIds: initialSongs.map((s) => s.id),
      };
    }
    return customPlaylists.find((pl) => pl.id === activePlaylistId) || customPlaylists[0] || null;
  }, [customPlaylists, activePlaylistId, isAllSongsActive]);

  const activeSongs = useMemo(() => {
    if (isAllSongsActive) return initialSongs;
    if (!activePlaylist) return [];
    return activePlaylist.songIds
      .map((id) => initialSongs.find((s) => s.id === id))
      .filter((s): s is typeof initialSongs[0] => s !== undefined);
  }, [activePlaylist, isAllSongsActive]);

  const handleCreate = () => {
    const name = prompt("Enter new playlist name:", "Late Night Vibes");
    if (name && name.trim()) {
      const newId = createPlaylist(name.trim());
      setActivePlaylistId(newId);
    }
  };

  const handleRename = (id: string, currentName: string) => {
    const newName = prompt("Rename playlist:", currentName);
    if (newName && newName.trim()) {
      renamePlaylist(id, newName.trim());
    }
  };

  const handlePlayPlaylist = () => {
    if (activeSongs.length > 0) {
      playSong(activeSongs[0], activeSongs);
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Page Title & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <span>Playlist Studio</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Explore your music collection and custom playlists.</p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all min-h-[44px] self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Playlist Cards Selector */}
        <div className="space-y-2">
          {/* Default All Songs Entry */}
          <div
            onClick={() => setActivePlaylistId("all-songs")}
            className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between min-h-[52px] ${
              isAllSongsActive
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/15 border-pink-500/40 text-white shadow-md"
                : "bg-white/[0.02] border-white/5 hover:bg-white/5 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-pink-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate">All Music Tracks</h4>
                <p className="text-[11px] text-zinc-400">{initialSongs.length} songs</p>
              </div>
            </div>
          </div>

          {customPlaylists.map((pl) => {
            const isSelected = !isAllSongsActive && activePlaylist?.id === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => setActivePlaylistId(pl.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between min-h-[52px] ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/15 border-pink-500/40 text-white shadow-md"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/5 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {pl.coverArtwork ? (
                      <Image src={pl.coverArtwork} alt={pl.name} fill className="object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate">{pl.name}</h4>
                    <p className="text-[11px] text-zinc-400">{pl.songIds.length} tracks</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(pl.id, pl.name);
                    }}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-white"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete playlist "${pl.name}"?`)) {
                        deletePlaylist(pl.id);
                        setActivePlaylistId("all-songs");
                      }
                    }}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Songs in Active Playlist */}
        <div className="md:col-span-2 space-y-4 bg-white/[0.02] border border-white/5 p-3.5 sm:p-4 rounded-2xl">
          {activePlaylist && (
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">{activePlaylist.name}</h3>
                  <p className="text-xs text-zinc-400 truncate">{activePlaylist.description || `${activeSongs.length} songs`}</p>
                </div>

                {activeSongs.length > 0 && (
                  <button
                    onClick={handlePlayPlaylist}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all min-h-[44px] shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Playlist</span>
                  </button>
                )}
              </div>

              {activeSongs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No songs in this playlist yet. Add songs from Home or Search!
                </div>
              ) : (
                <div className="space-y-1">
                  {activeSongs.map((song, idx) => (
                    <div key={song.id} className="relative group">
                      <SongRow song={song} index={idx} playlistContext={activeSongs} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500 text-xs">Loading playlists...</div>}>
      <PlaylistsContent />
    </Suspense>
  );
}
