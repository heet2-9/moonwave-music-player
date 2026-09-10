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
    selectedId || customPlaylists[0]?.id || null
  );

  const activePlaylist = useMemo(() => {
    return customPlaylists.find((pl) => pl.id === activePlaylistId) || customPlaylists[0] || null;
  }, [customPlaylists, activePlaylistId]);

  const activeSongs = useMemo(() => {
    if (!activePlaylist) return [];
    return activePlaylist.songIds
      .map((id) => initialSongs.find((s) => s.id === id))
      .filter((s): s is typeof initialSongs[0] => s !== undefined);
  }, [activePlaylist]);

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
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-purple-400" />
            <span>Playlists</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Organize your favorite music into custom playlists.</p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {customPlaylists.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
          <ListMusic className="w-12 h-12 text-zinc-600 mx-auto opacity-50" />
          <p className="text-base font-semibold text-zinc-300">Create your first playlist.</p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Playlist Cards Selector */}
          <div className="space-y-2">
            {customPlaylists.map((pl) => {
              const isSelected = activePlaylist?.id === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => setActivePlaylistId(pl.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/15 border-pink-500/40 text-white shadow-md"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/5 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {pl.coverArtwork ? (
                        <Image src={pl.coverArtwork} alt={pl.name} fill className="object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{pl.name}</h4>
                      <p className="text-[11px] text-zinc-400">{pl.songIds.length} tracks</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(pl.id, pl.name);
                      }}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete playlist "${pl.name}"?`)) {
                          deletePlaylist(pl.id);
                        }
                      }}
                      className="p-1 text-zinc-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Songs in Active Playlist */}
          <div className="md:col-span-2 space-y-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            {activePlaylist && (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{activePlaylist.name}</h3>
                    <p className="text-xs text-zinc-400">{activePlaylist.description || `${activeSongs.length} songs`}</p>
                  </div>

                  {activeSongs.length > 0 && (
                    <button
                      onClick={handlePlayPlaylist}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Playlist</span>
                    </button>
                  )}
                </div>

                {activeSongs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    No songs in this playlist yet. Add songs from your Library or Search!
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
      )}
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
