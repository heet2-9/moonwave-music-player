import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { useTogetherStore, TogetherRoom } from "@/store/togetherStore";
import { usePlayerStore } from "@/store/playerStore";
import { initialSongs } from "@/data/songs";
import { Song } from "@/types/music";
import { siteConfig } from "@/config/site";
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

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function getChannelName(code: string): string {
  const normalized = normalizeRoomCode(code);
  return `moonwave-room-${normalized}`;
}

let activeChannel: RealtimeChannel | null = null;
let fallbackChannel: BroadcastChannel | null = null;

export async function createRoom(): Promise<TogetherRoom> {
  const store = useTogetherStore.getState();
  const playerState = usePlayerStore.getState();
  const rawCode = generateRoomCode();
  const code = normalizeRoomCode(rawCode);
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
  store.setSubscriptionStatus("CONNECTING");

  await setupRealtimeChannel(code, true);
  return initialRoom;
}

export async function joinRoom(inputCode: string): Promise<TogetherRoom> {
  const cleanCode = normalizeRoomCode(inputCode);
  const store = useTogetherStore.getState();
  const now = Date.now();

  if (!cleanCode || cleanCode.length < 4) {
    throw new Error("Invalid room code format.");
  }

  store.setRoomCode(cleanCode);
  store.setRole("guest");
  store.setConnectionState("Connecting");
  store.setSubscriptionStatus("CONNECTING");

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const channelName = getChannelName(cleanCode);
      const channel = supabase.channel(channelName, {
        config: { presence: { key: store.participantId } },
      });

      return new Promise<TogetherRoom>((resolve, reject) => {
        let isResolved = false;

        const timeout = setTimeout(() => {
          if (!isResolved) {
            supabase.removeChannel(channel);
            store.setConnectionState("Disconnected");
            store.setSubscriptionStatus("ERROR");
            reject(new Error("Room not found or host unreachable. Check the code and try again."));
          }
        }, 10000);

        channel
          .on("presence", { event: "sync" }, () => {
            const presenceState = channel.presenceState();
            const keys = Object.keys(presenceState);
            store.setPresenceCount(keys.length);
            if (keys.length > 2) {
              clearTimeout(timeout);
              isResolved = true;
              supabase.removeChannel(channel);
              store.setConnectionState("Disconnected");
              store.setSubscriptionStatus("ERROR");
              reject(new Error("This room already has two listeners."));
              return;
            }
          })
          .on("broadcast", { event: "ROOM_STATE" }, ({ payload }) => {
            if (payload && payload.room && !isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              const room = payload.room as TogetherRoom;
              store.setRoom(room);
              store.setIsJoined(true);
              store.setConnectionState("Connected");
              store.setSubscriptionStatus("SUBSCRIBED");
              store.setLastReceivedEvent({ type: "ROOM_STATE", timestamp: Date.now(), payload });
              activeChannel = channel;
              subscribeToChannelEvents(channel);
              applyRemotePlaybackToPlayer(room, payload.timestamp || Date.now());
              resolve(room);
            }
          })
          .on("broadcast", { event: "PLAYBACK_STATE" }, ({ payload }) => {
            if (payload && payload.room && !isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              const room = payload.room as TogetherRoom;
              store.setRoom(room);
              store.setIsJoined(true);
              store.setConnectionState("Connected");
              store.setSubscriptionStatus("SUBSCRIBED");
              store.setLastReceivedEvent({ type: "PLAYBACK_STATE", timestamp: Date.now(), payload });
              activeChannel = channel;
              subscribeToChannelEvents(channel);
              applyRemotePlaybackToPlayer(room, payload.timestamp || Date.now());
              resolve(room);
            }
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              store.setSubscriptionStatus("SUBSCRIBED");
              channel.track({
                participantId: store.participantId,
                name: siteConfig.partnerName || "Aaru",
                role: "GUEST",
                joinedAt: now,
              });
              // Send explicit room state request after subscription is active
              channel.send({
                type: "broadcast",
                event: "REQUEST_ROOM_STATE",
                payload: { guestId: store.participantId, timestamp: now },
              });
              store.setLastSentEvent({ type: "REQUEST_ROOM_STATE", timestamp: now });
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
              store.setSubscriptionStatus("ERROR");
            }
          });
      });
    }
  }

  // Development Fallback via BroadcastChannel / LocalStorage
  console.warn("[TogetherRoom] Supabase credentials not set. Using BroadcastChannel fallback (same-browser testing only).");
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
  store.setSubscriptionStatus("SUBSCRIBED");
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
        event: "HOST_LEAVING",
        payload: { hostId: store.participantId, timestamp: Date.now() },
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

  // Prevent recursive broadcast during remote state application
  if (!room || !store.isJoined || store.isApplyingRemoteState) return;

  // Permission check: if guest and shared controls are disabled, block local broadcast
  if (!store.isHost && !store.sharedControls) return;

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

  broadcastEvent("PLAYBACK_STATE", { room: updatedRoom, timestamp: now });
}

export function sendReaction(emoji: string): void {
  const store = useTogetherStore.getState();
  const room = store.room;
  if (!room) return;

  const sender = store.isHost ? siteConfig.hostName || "Heet" : siteConfig.partnerName || "Aaru";
  store.addReaction({ emoji, sender: "You" });

  broadcastEvent("REACTION", { emoji, sender, timestamp: Date.now() });
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

  broadcastEvent("CONTROLS_TOGGLE", { sharedControls: enabled, room: updatedRoom, timestamp: Date.now() });
}

function broadcastEvent(event: string, payload: Record<string, unknown>) {
  const store = useTogetherStore.getState();
  store.setLastSentEvent({ type: event, timestamp: Date.now(), payload });

  if (isSupabaseConfigured && activeChannel) {
    activeChannel.send({
      type: "broadcast",
      event,
      payload,
    });
  } else if (fallbackChannel) {
    const roomObj = payload.room as TogetherRoom | undefined;
    if (roomObj && roomObj.code) {
      localStorage.setItem(`moonwave_room_${roomObj.code}`, JSON.stringify(roomObj));
    }
    fallbackChannel.postMessage({ type: event, ...payload });
  }
}

async function setupRealtimeChannel(code: string, isHost: boolean) {
  const store = useTogetherStore.getState();

  if (isSupabaseConfigured) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const channelName = getChannelName(code);
      const channel = supabase.channel(channelName, {
        config: { presence: { key: store.participantId } },
      });

      activeChannel = channel;
      subscribeToChannelEvents(channel);

      channel
        .on("presence", { event: "sync" }, () => {
          const presenceState = channel.presenceState();
          const count = Object.keys(presenceState).length;
          store.setPresenceCount(count);
          store.setGuestConnected(count >= 2);
        })
        .on("broadcast", { event: "REQUEST_ROOM_STATE" }, () => {
          const currentStore = useTogetherStore.getState();
          const playerState = usePlayerStore.getState();
          if (currentStore.isHost && currentStore.room) {
            const now = Date.now();
            const currentRoomState: TogetherRoom = {
              ...currentStore.room,
              currentSongId: playerState.currentSong?.id || currentStore.room.currentSongId,
              queueIndex: playerState.queueIndex,
              position: playerState.currentTime,
              isPlaying: playerState.isPlaying,
              playbackStartedAt: playerState.isPlaying ? now : null,
              updatedAt: now,
            };
            broadcastEvent("ROOM_STATE", { room: currentRoomState, timestamp: now });
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            store.setConnectionState("Connected");
            store.setSubscriptionStatus("SUBSCRIBED");
            channel.track({
              participantId: store.participantId,
              name: isHost ? siteConfig.hostName || "Heet" : siteConfig.partnerName || "Aaru",
              role: isHost ? "HOST" : "GUEST",
              joinedAt: Date.now(),
            });
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            store.setSubscriptionStatus("ERROR");
          }
        });
      return;
    }
  }

  // Fallback setup
  setupFallbackChannel(code);
  store.setConnectionState("Connected");
  store.setSubscriptionStatus("SUBSCRIBED");
  if (isHost && store.room) {
    localStorage.setItem(`moonwave_room_${code}`, JSON.stringify(store.room));
  }
}

function subscribeToChannelEvents(channel: RealtimeChannel) {
  const store = useTogetherStore.getState();

  channel
    .on("broadcast", { event: "PLAYBACK_STATE" }, ({ payload }) => {
      if (!payload || !payload.room) return;
      store.setLastReceivedEvent({ type: "PLAYBACK_STATE", timestamp: Date.now(), payload });
      const incomingRoom = payload.room as TogetherRoom;
      const currentRoom = store.room;

      if (!currentRoom || incomingRoom.playbackVersion > (currentRoom.playbackVersion || 0)) {
        store.setRoom(incomingRoom);
        applyRemotePlaybackToPlayer(incomingRoom, payload.timestamp || Date.now());
      }
    })
    .on("broadcast", { event: "ROOM_STATE" }, ({ payload }) => {
      if (!payload || !payload.room) return;
      store.setLastReceivedEvent({ type: "ROOM_STATE", timestamp: Date.now(), payload });
      const incomingRoom = payload.room as TogetherRoom;
      store.setRoom(incomingRoom);
      applyRemotePlaybackToPlayer(incomingRoom, payload.timestamp || Date.now());
    })
    .on("broadcast", { event: "REACTION" }, ({ payload }) => {
      if (payload && payload.emoji) {
        store.setLastReceivedEvent({ type: "REACTION", timestamp: Date.now(), payload });
        store.addReaction({ emoji: payload.emoji, sender: payload.sender || "Partner" });
      }
    })
    .on("broadcast", { event: "CONTROLS_TOGGLE" }, ({ payload }) => {
      if (payload && payload.sharedControls !== undefined) {
        store.setLastReceivedEvent({ type: "CONTROLS_TOGGLE", timestamp: Date.now(), payload });
        store.setSharedControls(payload.sharedControls);
      }
    })
    .on("broadcast", { event: "HOST_LEAVING" }, () => {
      if (!store.isHost) {
        store.setLastReceivedEvent({ type: "HOST_LEAVING", timestamp: Date.now() });
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

    if ((data.type === "PLAYBACK_STATE" || data.type === "ROOM_STATE") && data.room) {
      const incomingRoom = data.room as TogetherRoom;
      const currentRoom = store.room;
      if (!currentRoom || incomingRoom.playbackVersion > (currentRoom.playbackVersion || 0)) {
        store.setRoom(incomingRoom);
        applyRemotePlaybackToPlayer(incomingRoom, data.timestamp || Date.now());
      }
    } else if (data.type === "REACTION") {
      store.addReaction({ emoji: data.emoji, sender: data.sender || "Partner" });
    } else if (data.type === "CONTROLS_TOGGLE") {
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
