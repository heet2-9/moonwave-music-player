import { create } from "zustand";
import { RepeatMode } from "./playerStore";

export interface TogetherRoom {
  id: string;
  code: string;
  hostId: string;
  guestId: string | null;
  currentSongId: string | null;
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  playbackStartedAt: number | null;
  shuffle: boolean;
  repeat: RepeatMode;
  sharedControls: boolean;
  playbackVersion: number;
  updatedAt: number;
}

export type ConnectionState = "Disconnected" | "Connecting" | "Connected" | "Reconnecting";
export type SyncState = "SYNCED" | "SYNCING" | "DRIFT DETECTED" | "DISCONNECTED";
export type SyncQuality = "Excellent" | "Good" | "Syncing" | "Poor connection";
export type SubscriptionStatus = "SUBSCRIBED" | "CONNECTING" | "CLOSED" | "ERROR";

export interface FloatingReaction {
  id: string;
  emoji: string;
  sender: string;
  timestamp: number;
}

interface TogetherStoreState {
  room: TogetherRoom | null;
  roomCode: string | null;
  participantId: string;
  role: "host" | "guest" | null;
  connectionState: ConnectionState;
  subscriptionStatus: SubscriptionStatus;
  isJoined: boolean;
  isHost: boolean;
  guestConnected: boolean;
  sharedControls: boolean;
  syncState: SyncState;
  driftMs: number;
  syncQuality: SyncQuality;
  autoplayBlocked: boolean;
  reactions: FloatingReaction[];
  error: string | null;
  isApplyingRemoteState: boolean;
  presenceCount: number;

  // Actions
  setRoom: (room: TogetherRoom | null) => void;
  setRoomCode: (code: string | null) => void;
  setParticipantId: (id: string) => void;
  setRole: (role: "host" | "guest" | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setIsJoined: (joined: boolean) => void;
  setIsHost: (isHost: boolean) => void;
  setGuestConnected: (connected: boolean) => void;
  setSharedControls: (enabled: boolean) => void;
  setSyncMetrics: (syncState: SyncState, driftMs?: number) => void;
  setAutoplayBlocked: (blocked: boolean) => void;
  addReaction: (reaction: { emoji: string; sender: string }) => void;
  removeReaction: (id: string) => void;
  setError: (error: string | null) => void;
  setIsApplyingRemoteState: (applying: boolean) => void;
  setPresenceCount: (count: number) => void;
  resetTogetherState: () => void;
}

function getStoredParticipantId(): string {
  if (typeof window === "undefined") return "moonwave_temp";
  let pid = localStorage.getItem("moonwave_together_pid");
  if (!pid) {
    pid = `moonwave_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("moonwave_together_pid", pid);
  }
  return pid;
}

export const useTogetherStore = create<TogetherStoreState>((set) => ({
  room: null,
  roomCode: null,
  participantId: typeof window !== "undefined" ? getStoredParticipantId() : "moonwave_temp",
  role: null,
  connectionState: "Disconnected",
  subscriptionStatus: "CLOSED",
  isJoined: false,
  isHost: false,
  guestConnected: false,
  sharedControls: false,
  syncState: "DISCONNECTED",
  driftMs: 0,
  syncQuality: "Syncing",
  autoplayBlocked: false,
  reactions: [],
  error: null,
  isApplyingRemoteState: false,
  presenceCount: 0,

  setRoom: (room) =>
    set((state) => ({
      room,
      sharedControls: room ? room.sharedControls : state.sharedControls,
    })),
  setRoomCode: (code) => set({ roomCode: code }),
  setParticipantId: (id) => set({ participantId: id }),
  setRole: (role) => set({ role, isHost: role === "host" }),
  setConnectionState: (connectionState) =>
    set({
      connectionState,
      syncState: connectionState === "Connected" ? "SYNCED" : "DISCONNECTED",
    }),
  setSubscriptionStatus: (subscriptionStatus) => set({ subscriptionStatus }),
  setIsJoined: (isJoined) => set({ isJoined }),
  setIsHost: (isHost) => set({ isHost }),
  setGuestConnected: (guestConnected) => set({ guestConnected }),
  setSharedControls: (sharedControls) =>
    set((state) => ({
      sharedControls,
      room: state.room ? { ...state.room, sharedControls } : null,
    })),
  setSyncMetrics: (syncState, driftMs = 0) =>
    set(() => {
      let syncQuality: SyncQuality = "Excellent";
      const absDrift = Math.abs(driftMs);
      if (syncState === "DISCONNECTED") {
        syncQuality = "Poor connection";
      } else if (syncState === "SYNCING") {
        syncQuality = "Syncing";
      } else if (absDrift > 800) {
        syncQuality = "Poor connection";
      } else if (absDrift > 300) {
        syncQuality = "Good";
      } else {
        syncQuality = "Excellent";
      }
      return { syncState, driftMs, syncQuality };
    }),
  setAutoplayBlocked: (autoplayBlocked) => set({ autoplayBlocked }),
  addReaction: (reaction) =>
    set((state) => ({
      reactions: [
        ...state.reactions,
        {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          emoji: reaction.emoji,
          sender: reaction.sender,
          timestamp: Date.now(),
        },
      ].slice(-10),
    })),
  removeReaction: (id) =>
    set((state) => ({
      reactions: state.reactions.filter((r) => r.id !== id),
    })),
  setError: (error) => set({ error }),
  setIsApplyingRemoteState: (isApplyingRemoteState) => set({ isApplyingRemoteState }),
  setPresenceCount: (presenceCount) => set({ presenceCount }),
  resetTogetherState: () =>
    set({
      room: null,
      roomCode: null,
      role: null,
      connectionState: "Disconnected",
      subscriptionStatus: "CLOSED",
      isJoined: false,
      isHost: false,
      guestConnected: false,
      sharedControls: false,
      syncState: "DISCONNECTED",
      driftMs: 0,
      syncQuality: "Syncing",
      autoplayBlocked: false,
      reactions: [],
      error: null,
      isApplyingRemoteState: false,
      presenceCount: 0,
    }),
}));
