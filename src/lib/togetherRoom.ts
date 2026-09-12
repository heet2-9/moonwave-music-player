import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { useTogetherStore, TogetherRoom } from "@/store/togetherStore";
import { usePlayerStore } from "@/store/playerStore";
import { initialSongs } from "@/data/songs";
import { Song } from "@/types/music";
import { RealtimeChannel } from "@supabase/supabase-js";

// Unambiguous Alphanumeric Chars (avoiding 0, O, 1, I)
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(): string {
  let code = "MOON-";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

let activeChannel: RealtimeChannel | null = null;
let fallbackChannel: BroadcastChannel | null = null;

export async function createRoom(): Promise<TogetherRoom> {
  const store = useTogetherStore.getState();
  const playerState = usePlayerStore.getState();
  const code = generateRoomCode();
  const now = Date.now();

  const initialRoom: TogetherRoom = {
    id: `room_${now}_${Math.random().toString(36).substring(2, 7)}`,
    code,
    hostId: store.participantId,
    guestId: null,
    currentSongId: playerState.currentSong?.id || null,
    queueIndex: playerState.queueIndex || 0,
    isPlaying: playerState.isPlaying,
    position: playerState.currentTime || 0,
    playbackStartedAt: playerState.isPlaying ? now : null,
    shuffle: playerState.shuffle,
    repeat: playerState.repeat,
    sharedControls: true,
    playbackVersion: 1,
    updatedAt: now,
  };

  store.setRoom(initialRoom);
  store.setRoomCode(code);
  store.setRole("host");
  store.setIsJoined(true);
  store.setConnectionState("Connecting");

  await setupRealtimeChannel(code, true);
  return initialRoom;
}

export async function joinRoom(inputCode: string): Promise<TogetherRoom> {
  const cleanCode = inputCode.trim().toUpperCase();
  const store = useTogetherStore.getState();
  const now = Date.now();

  if (!cleanCode || cleanCode.length < 4) {
    throw new Error("Invalid room code format.");
  }

  store.setRoomCode(cleanCode);
  store.setRole("guest");
  store.setConnectionState("Connecting");

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const channel = supabase.channel(`room:${cleanCode}`, {
        config: { presence: { key: store.participantId } },
      });

      return new Promise<TogetherRoom>((resolve, reject) => {
        const timeout = setTimeout(() => {
          supabase.removeChannel(channel);
          store.setConnectionState("Disconnected");
          reject(new Error("Room not found or host unreachable. Check the code and try again."));
        }, 6000);

        channel
          .on("presence", { event: "sync" }, () => {
            const presenceState = channel.presenceState();
            const keys = Object.keys(presenceState);
            if (keys.length > 2) {
              clearTimeout(timeout);
              supabase.removeChannel(channel);
              store.setConnectionState("Disconnected");
              reject(new Error("This room already has two listeners."));
              return;
            }
          })
          .on("broadcast", { event: "playback_update" }, ({ payload }) => {
            if (payload && payload.room) {
              clearTimeout(timeout);
              const room = payload.room as TogetherRoom;
              store.setRoom(room);
              store.setIsJoined(true);
              store.setConnectionState("Connected");
              activeChannel = channel;
              subscribeToChannelEvents(channel);
              resolve(room);
            }
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              channel.track({
                participantId: store.participantId,
                role: "guest",
                joinedAt: now,
              });
              // Request current state from host
              channel.send({
                type: "broadcast",
                event: "request_state",
                payload: { guestId: store.participantId },
              });
            }
          });
      });
    }
  }

  // Development Fallback via BroadcastChannel / LocalStorage
  console.log("[TogetherRoom] Using BroadcastChannel fallback (same-device testing mode)");
  const rawStored = localStorage.getItem(`moonwave_room_${cleanCode}`);
  if (!rawStored) {
    store.setConnectionState("Disconnected");
    throw new Error("Room not found. Check the code and try again.");
  }

  const existingRoom: TogetherRoom = JSON.parse(rawStored);
  if (existingRoom.guestId && existingRoom.guestId !== store.participantId) {
    store.setConnectionState("Disconnected");
    throw new Error("This room already has two listeners.");
  }

  existingRoom.guestId = store.participantId;
  existingRoom.updatedAt = now;
  localStorage.setItem(`moonwave_room_${cleanCode}`, JSON.stringify(existingRoom));

  store.setRoom(existingRoom);
  store.setIsJoined(true);
  store.setConnectionState("Connected");
  store.setGuestConnected(true);

  setupFallbackChannel(cleanCode);
  return existingRoom;
}

export function leaveRoom(): void {
  const store = useTogetherStore.getState();
  const room = store.room;

  if (activeChannel) {
    if (store.isHost && room) {
      activeChannel.send({
        type: "broadcast",
        event: "host_leaving",
        payload: { hostId: store.participantId },
      });
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.removeChannel(activeChannel);
    }
    activeChannel = null;
  }

  if (fallbackChannel) {
    fallbackChannel.postMessage({ type: "leave", participantId: store.participantId });
    fallbackChannel.close();
    fallbackChannel = null;
  }

  if (room && room.code) {
    localStorage.removeItem(`moonwave_room_${room.code}`);
  }

  store.resetTogetherState();
}

export function updatePlaybackState(payload: {
  songId: string | null;
  queueIndex: number;
  position: number;
  isPlaying: boolean;
  shuffle?: boolean;
  repeat?: "off" | "one" | "all";
}): void {
  const store = useTogetherStore.getState();
  const room = store.room;
  if (!room || !store.isJoined) return;

  const now = Date.now();
  const updatedRoom: TogetherRoom = {
    ...room,
    currentSongId: payload.songId,
    queueIndex: payload.queueIndex,
    position: payload.position,
    isPlaying: payload.isPlaying,
    playbackStartedAt: payload.isPlaying ? now : null,
    shuffle: payload.shuffle !== undefined ? payload.shuffle : room.shuffle,
    repeat: payload.repeat !== undefined ? payload.repeat : room.repeat,
    playbackVersion: (room.playbackVersion || 0) + 1,
    updatedAt: now,
  };

  store.setRoom(updatedRoom);

  if (isSupabaseConfigured && activeChannel) {
    activeChannel.send({
      type: "broadcast",
      event: "playback_update",
      payload: { room: updatedRoom, timestamp: now },
    });
  } else if (fallbackChannel) {
    localStorage.setItem(`moonwave_room_${room.code}`, JSON.stringify(updatedRoom));
    fallbackChannel.postMessage({ type: "playback_update", room: updatedRoom, timestamp: now });
  }
}

export function sendReaction(emoji: string): void {
  const store = useTogetherStore.getState();
  const room = store.room;
  if (!room) return;

  const sender = store.isHost ? "Host" : "Guest";
  store.addReaction({ emoji, sender: "You" });

  if (isSupabaseConfigured && activeChannel) {
    activeChannel.send({
      type: "broadcast",
      event: "reaction_send",
      payload: { emoji, sender, timestamp: Date.now() },
    });
  } else if (fallbackChannel) {
    fallbackChannel.postMessage({ type: "reaction_send", emoji, sender, timestamp: Date.now() });
  }
}

export function setSharedControls(enabled: boolean): void {
  const store = useTogetherStore.getState();
  const room = store.room;
  if (!room || !store.isHost) return;

  const updatedRoom: TogetherRoom = {
    ...room,
    sharedControls: enabled,
    updatedAt: Date.now(),
  };

  store.setSharedControls(enabled);

  if (isSupabaseConfigured && activeChannel) {
    activeChannel.send({
      type: "broadcast",
      event: "controls_toggle",
      payload: { sharedControls: enabled, room: updatedRoom },
    });
  } else if (fallbackChannel) {
    localStorage.setItem(`moonwave_room_${room.code}`, JSON.stringify(updatedRoom));
    fallbackChannel.postMessage({ type: "controls_toggle", sharedControls: enabled, room: updatedRoom });
  }
}

async function setupRealtimeChannel(code: string, isHost: boolean) {
  const store = useTogetherStore.getState();

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const channel = supabase.channel(`room:${code}`, {
        config: { presence: { key: store.participantId } },
      });

      activeChannel = channel;
      subscribeToChannelEvents(channel);

      channel
        .on("presence", { event: "sync" }, () => {
          const presenceState = channel.presenceState();
          const count = Object.keys(presenceState).length;
          store.setGuestConnected(count >= 2);
        })
        .on("broadcast", { event: "request_state" }, () => {
          if (store.isHost && store.room) {
            channel.send({
              type: "broadcast",
              event: "playback_update",
              payload: { room: store.room, timestamp: Date.now() },
            });
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            store.setConnectionState("Connected");
            channel.track({
              participantId: store.participantId,
              role: isHost ? "host" : "guest",
              joinedAt: Date.now(),
            });
          }
        });
      return;
    }
  }

  // Fallback setup
  console.log("[TogetherRoom] Initializing BroadcastChannel fallback for room:", code);
  setupFallbackChannel(code);
  store.setConnectionState("Connected");
  if (isHost && store.room) {
    localStorage.setItem(`moonwave_room_${code}`, JSON.stringify(store.room));
  }
}

function subscribeToChannelEvents(channel: RealtimeChannel) {
  const store = useTogetherStore.getState();

  channel
    .on("broadcast", { event: "playback_update" }, ({ payload }) => {
      if (!payload || !payload.room) return;
      const incomingRoom = payload.room as TogetherRoom;
      const currentRoom = store.room;

      if (!currentRoom || incomingRoom.playbackVersion > (currentRoom.playbackVersion || 0)) {
        store.setRoom(incomingRoom);
        applyRemotePlaybackToPlayer(incomingRoom, payload.timestamp || Date.now());
      }
    })
    .on("broadcast", { event: "reaction_send" }, ({ payload }) => {
      if (payload && payload.emoji) {
        store.addReaction({ emoji: payload.emoji, sender: payload.sender || "Partner" });
      }
    })
    .on("broadcast", { event: "controls_toggle" }, ({ payload }) => {
      if (payload && payload.sharedControls !== undefined) {
        store.setSharedControls(payload.sharedControls);
      }
    })
    .on("broadcast", { event: "host_leaving" }, () => {
      if (!store.isHost) {
        // Handoff host role to guest
        store.setIsHost(true);
        store.setRole("host");
      }
    });
}

function setupFallbackChannel(code: string) {
  if (fallbackChannel) {
    fallbackChannel.close();
  }
  fallbackChannel = new BroadcastChannel(`moonwave_together_${code}`);
  const store = useTogetherStore.getState();

  fallbackChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "playback_update" && data.room) {
      const incomingRoom = data.room as TogetherRoom;
      const currentRoom = store.room;
      if (!currentRoom || incomingRoom.playbackVersion > (currentRoom.playbackVersion || 0)) {
        store.setRoom(incomingRoom);
        applyRemotePlaybackToPlayer(incomingRoom, data.timestamp || Date.now());
      }
    } else if (data.type === "reaction_send") {
      store.addReaction({ emoji: data.emoji, sender: data.sender || "Partner" });
    } else if (data.type === "controls_toggle") {
      store.setSharedControls(data.sharedControls);
    } else if (data.type === "leave") {
      if (data.participantId !== store.participantId) {
        store.setGuestConnected(false);
      }
    }
  };
}

export function applyRemotePlaybackToPlayer(remoteRoom: TogetherRoom, serverTimestamp: number) {
  const playerStore = usePlayerStore.getState();
  const togetherStore = useTogetherStore.getState();

  togetherStore.setIsApplyingRemoteState(true);

  try {
    // 1. Song change check
    if (remoteRoom.currentSongId && playerStore.currentSong?.id !== remoteRoom.currentSongId) {
      const matchedSong = initialSongs.find((s: Song) => s.id === remoteRoom.currentSongId);
      if (matchedSong) {
        playerStore.playSong(matchedSong);
      }
    }

    // 2. Play / Pause State check
    if (playerStore.isPlaying !== remoteRoom.isPlaying) {
      playerStore.setIsPlaying(remoteRoom.isPlaying);
    }

    // 3. Queue index sync
    if (remoteRoom.queueIndex !== undefined && playerStore.queueIndex !== remoteRoom.queueIndex) {
      // update queue position if necessary
    }

    // 4. Calculate expected position with latency offset
    const elapsedSeconds = remoteRoom.isPlaying ? (Date.now() - serverTimestamp) / 1000 : 0;
    const expectedPosition = Math.max(0, remoteRoom.position + elapsedSeconds);
    const currentAudioTime = playerStore.currentTime;
    const drift = Math.abs(currentAudioTime - expectedPosition);

    togetherStore.setSyncMetrics(drift > 1.0 ? "DRIFT DETECTED" : "SYNCED", drift * 1000);

    // Apply Hard Seek if drift > 1.0s or track start
    if (drift > 1.0 || expectedPosition === 0) {
      playerStore.seek(expectedPosition);
    }
  } finally {
    setTimeout(() => {
      togetherStore.setIsApplyingRemoteState(false);
    }, 200);
  }
}
