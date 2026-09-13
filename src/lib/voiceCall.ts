import { useVoiceCallStore } from "@/store/voiceCallStore";
import { useTogetherStore } from "@/store/togetherStore";
import { siteConfig } from "@/config/site";

// Browser capability check helper
export function checkVoiceCallSupport(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Server rendering" };
  }

  if (!window.RTCPeerConnection) {
    return { supported: false, reason: "Voice calling isn't supported by this browser." };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, reason: "Microphone access is not supported by this browser." };
  }

  return { supported: true };
}

// RTCPeerConnection Configuration
function getRTCConfiguration(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL?.trim();
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim();
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim();

  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername || undefined,
      credential: turnCredential || undefined,
    });
  }

  return { iceServers };
}

// Global active WebRTC objects & timers
let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let remoteAudioElement: HTMLAudioElement | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];
let pendingOffer: RTCSessionDescriptionInit | null = null;

let callTimeoutTimer: NodeJS.Timeout | null = null;
let durationIntervalTimer: NodeJS.Timeout | null = null;

// Call signaling send hook placeholder (bound by togetherRoom signaling integration)
type SignalingSender = (event: string, payload: Record<string, unknown>) => void;
let signalingSender: SignalingSender | null = null;

export function setVoiceCallSignalingSender(sender: SignalingSender) {
  signalingSender = sender;
}

function broadcastSignaling(event: string, payload: Record<string, unknown>) {
  if (signalingSender) {
    signalingSender(event, payload);
  }
}

// Start Call Timer
function startDurationTimer() {
  if (durationIntervalTimer) {
    clearInterval(durationIntervalTimer);
  }

  const store = useVoiceCallStore.getState();
  const startTime = Date.now();

  durationIntervalTimer = setInterval(() => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    store.setCallDuration(duration);
  }, 1000);
}

// Clear Call Timeouts
function clearCallTimers() {
  if (callTimeoutTimer) {
    clearTimeout(callTimeoutTimer);
    callTimeoutTimer = null;
  }
  if (durationIntervalTimer) {
    clearInterval(durationIntervalTimer);
    durationIntervalTimer = null;
  }
}

// Complete Cleanup
export function cleanupCall(remoteInitiated = false, reason?: string) {
  clearCallTimers();

  // Stop local microphone tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn("[VoiceCall] Error stopping local track:", e);
      }
    });
    localStream = null;
  }

  // Stop remote stream tracks
  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn("[VoiceCall] Error stopping remote track:", e);
      }
    });
    remoteStream = null;
  }

  // Remove remote audio element from DOM
  if (remoteAudioElement) {
    try {
      remoteAudioElement.pause();
      remoteAudioElement.srcObject = null;
      if (remoteAudioElement.parentNode) {
        remoteAudioElement.parentNode.removeChild(remoteAudioElement);
      }
    } catch (e) {
      console.warn("[VoiceCall] Error removing remote audio element:", e);
    }
    remoteAudioElement = null;
  }

  // Close peer connection
  if (peerConnection) {
    try {
      peerConnection.onicecandidate = null;
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    } catch (e) {
      console.warn("[VoiceCall] Error closing RTCPeerConnection:", e);
    }
    peerConnection = null;
  }

  pendingCandidates = [];
  pendingOffer = null;

  const store = useVoiceCallStore.getState();

  if (reason) {
    store.setCallError(reason);
  }

  if (!remoteInitiated && store.callId) {
    // Notify remote participant that call ended
    const localId = useTogetherStore.getState().participantId;
    broadcastSignaling("CALL_END", {
      callId: store.callId,
      senderId: localId,
      timestamp: Date.now(),
      reason,
    });
  }

  store.clearCall();
}

// Request microphone access ONLY on user action
export async function requestMicrophoneStream(): Promise<MediaStream> {
  const support = checkVoiceCallSupport();
  if (!support.supported) {
    throw new Error(support.reason || "Browser unsupported");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    return stream;
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      throw new Error("Microphone access was denied. Please allow microphone access in your browser settings and try again.");
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      throw new Error("No microphone was detected on this device.");
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      throw new Error("Microphone is currently in use by another application.");
    }
    throw new Error("Microphone permission is required to start a voice call.");
  }
}

// Initialize RTCPeerConnection instance
function createPeerConnection(callId: string): RTCPeerConnection {
  const config = getRTCConfiguration();
  const pc = new RTCPeerConnection(config);
  const localId = useTogetherStore.getState().participantId;
  const store = useVoiceCallStore.getState();

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      broadcastSignaling("ICE_CANDIDATE", {
        callId,
        senderId: localId,
        candidate: event.candidate.toJSON(),
      });
    }
  };

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteStream = event.streams[0];
      store.setRemoteStream(remoteStream);

      // Create isolated HTML Audio Element for remote voice
      if (!remoteAudioElement) {
        remoteAudioElement = document.createElement("audio");
        remoteAudioElement.id = "moonwave-remote-voice-audio";
        remoteAudioElement.autoplay = true;
        remoteAudioElement.setAttribute("playsinline", "true");
        remoteAudioElement.style.display = "none";
        document.body.appendChild(remoteAudioElement);
      }

      remoteAudioElement.srcObject = remoteStream;
      remoteAudioElement.play().catch((err) => {
        console.warn("[VoiceCall] Remote audio autoplay error:", err);
      });
    }
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    if (state === "connected") {
      store.setCallStatus("connected");
      startDurationTimer();
    } else if (state === "connecting") {
      store.setCallStatus("connecting");
    } else if (state === "disconnected" || state === "failed") {
      cleanupCall(true, "Unable to connect the voice call.");
    } else if (state === "closed") {
      store.setCallStatus("ended");
    }
  };

  return pc;
}

// INITIATE OUTGOING CALL
export async function initiateCall(): Promise<void> {
  const support = checkVoiceCallSupport();
  if (!support.supported) {
    useVoiceCallStore.getState().setCallError(support.reason || "Browser unsupported");
    return;
  }

  const togetherStore = useTogetherStore.getState();
  const voiceStore = useVoiceCallStore.getState();

  // 1. Verify partner connected
  if (togetherStore.presenceCount < 2 && !togetherStore.guestConnected) {
    const partnerName = togetherStore.isHost
      ? siteConfig.partnerName || "Aaru"
      : siteConfig.hostName || "Heet";
    voiceStore.setCallError(`Waiting for ${partnerName} to join before calling.`);
    return;
  }

  const remoteId = togetherStore.isHost
    ? togetherStore.room?.guestId || "partner"
    : togetherStore.room?.hostId || "host";
  const remoteName = togetherStore.isHost
    ? siteConfig.partnerName || "Aaru"
    : siteConfig.hostName || "Heet";

  const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  voiceStore.startCall(remoteId, remoteName, callId);

  try {
    // 2. Request mic permission on user click
    localStream = await requestMicrophoneStream();
    voiceStore.setLocalStream(localStream);

    // Apply current mute state
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !voiceStore.isMuted;
    });

    // 3. Create PeerConnection & Add tracks
    peerConnection = createPeerConnection(callId);
    localStream.getTracks().forEach((track) => {
      if (peerConnection && localStream) {
        peerConnection.addTrack(track, localStream);
      }
    });

    // 4. Create WebRTC Offer
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
    });
    await peerConnection.setLocalDescription(offer);

    const localId = togetherStore.participantId;
    const localName = togetherStore.isHost
      ? siteConfig.hostName || "Heet"
      : siteConfig.partnerName || "Aaru";

    // 5. Broadcast CALL_INVITE and WEBRTC_OFFER
    broadcastSignaling("CALL_INVITE", {
      callId,
      callerId: localId,
      callerName: localName,
      timestamp: Date.now(),
    });

    broadcastSignaling("WEBRTC_OFFER", {
      callId,
      senderId: localId,
      offer: offer,
    });

    // 6. Set 30-second outgoing timeout
    callTimeoutTimer = setTimeout(() => {
      if (useVoiceCallStore.getState().callStatus === "calling") {
        cleanupCall(false, "No answer");
      }
    }, 30000);
  } catch (err: unknown) {
    const error = err as Error;
    cleanupCall(false, error.message || "Failed to start voice call.");
  }
}

// INCOMING CALL INVITATION HANDLER
export function handleIncomingCallInvite(payload: {
  callId: string;
  callerId: string;
  callerName: string;
  timestamp: number;
}) {
  const store = useVoiceCallStore.getState();
  const localId = useTogetherStore.getState().participantId;

  if (!payload || !payload.callId || !payload.callerId || payload.callerId === localId) {
    return;
  }

  // If already in a call, ignore duplicate or decline
  if (store.callStatus !== "idle") {
    return;
  }

  store.receiveCall(payload.callerId, payload.callerName, payload.callId);

  // Set 30-second incoming call timeout
  if (callTimeoutTimer) clearTimeout(callTimeoutTimer);
  callTimeoutTimer = setTimeout(() => {
    if (useVoiceCallStore.getState().callStatus === "incoming") {
      declineIncomingCall();
    }
  }, 30000);
}

// ACCEPT INCOMING CALL
export async function acceptIncomingCall(): Promise<void> {
  const voiceStore = useVoiceCallStore.getState();
  const togetherStore = useTogetherStore.getState();
  const callId = voiceStore.callId;

  if (!callId || voiceStore.callStatus !== "incoming") return;

  clearCallTimers();
  voiceStore.acceptCall();

  try {
    // 1. Request microphone on explicit Accept click
    localStream = await requestMicrophoneStream();
    voiceStore.setLocalStream(localStream);

    // Apply mute state
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !voiceStore.isMuted;
    });

    // 2. Create PeerConnection & Add local tracks
    peerConnection = createPeerConnection(callId);
    localStream.getTracks().forEach((track) => {
      if (peerConnection && localStream) {
        peerConnection.addTrack(track, localStream);
      }
    });

    // 3. Process offer if already received
    if (pendingOffer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingOffer));
      pendingOffer = null;

      // Flush pending ICE candidates
      while (pendingCandidates.length > 0) {
        const cand = pendingCandidates.shift();
        if (cand) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        }
      }
    }

    // 4. Create Answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const localId = togetherStore.participantId;

    // 5. Broadcast CALL_ACCEPT and WEBRTC_ANSWER
    broadcastSignaling("CALL_ACCEPT", {
      callId,
      senderId: localId,
      timestamp: Date.now(),
    });

    broadcastSignaling("WEBRTC_ANSWER", {
      callId,
      senderId: localId,
      answer: answer,
    });
  } catch (err: unknown) {
    const error = err as Error;
    const localId = togetherStore.participantId;
    broadcastSignaling("CALL_DECLINE", {
      callId,
      senderId: localId,
      reason: error.message,
    });
    cleanupCall(false, error.message || "Failed to accept voice call.");
  }
}

// DECLINE INCOMING CALL
export function declineIncomingCall(): void {
  const store = useVoiceCallStore.getState();
  const localId = useTogetherStore.getState().participantId;
  const callId = store.callId;

  if (callId) {
    broadcastSignaling("CALL_DECLINE", {
      callId,
      senderId: localId,
      timestamp: Date.now(),
    });
  }

  cleanupCall(false);
}

// HANDLE INCOMING WEBRTC OFFER
export async function handleIncomingOffer(payload: {
  callId: string;
  senderId: string;
  offer: RTCSessionDescriptionInit;
}) {
  const localId = useTogetherStore.getState().participantId;
  if (!payload || payload.senderId === localId || !payload.offer) return;

  pendingOffer = payload.offer;

  if (peerConnection && peerConnection.signalingState !== "closed") {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
      pendingOffer = null;

      // Flush candidates
      while (pendingCandidates.length > 0) {
        const cand = pendingCandidates.shift();
        if (cand) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        }
      }
    } catch (e) {
      console.warn("[VoiceCall] Error setting remote description for offer:", e);
    }
  }
}

// HANDLE INCOMING WEBRTC ANSWER
export async function handleIncomingAnswer(payload: {
  callId: string;
  senderId: string;
  answer: RTCSessionDescriptionInit;
}) {
  const store = useVoiceCallStore.getState();
  const localId = useTogetherStore.getState().participantId;

  if (!payload || payload.senderId === localId || !payload.answer) return;
  if (payload.callId !== store.callId) return;

  if (peerConnection && peerConnection.signalingState === "have-local-offer") {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));

      // Flush pending ICE candidates
      while (pendingCandidates.length > 0) {
        const cand = pendingCandidates.shift();
        if (cand) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        }
      }

      store.setCallStatus("connected");
      startDurationTimer();
    } catch (e) {
      console.warn("[VoiceCall] Error setting remote description for answer:", e);
    }
  }
}

// HANDLE INCOMING ICE CANDIDATE
export async function handleIncomingIceCandidate(payload: {
  callId: string;
  senderId: string;
  candidate: RTCIceCandidateInit;
}) {
  const store = useVoiceCallStore.getState();
  const localId = useTogetherStore.getState().participantId;

  if (!payload || payload.senderId === localId || !payload.candidate) return;
  if (payload.callId !== store.callId) return;

  if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (e) {
      console.warn("[VoiceCall] Error adding ICE candidate:", e);
    }
  } else {
    pendingCandidates.push(payload.candidate);
  }
}

// HANDLE INCOMING DECLINE / END
export function handleIncomingDeclineOrEnd(payload: {
  callId: string;
  senderId: string;
  reason?: string;
}) {
  const store = useVoiceCallStore.getState();
  const localId = useTogetherStore.getState().participantId;

  if (!payload || payload.senderId === localId) return;
  if (payload.callId && payload.callId !== store.callId) return;

  cleanupCall(true, payload.reason || "Call ended by partner.");
}

// TOGGLE MUTE
export function toggleMicrophoneMute(): void {
  const store = useVoiceCallStore.getState();
  const newMute = !store.isMuted;
  store.setMuted(newMute);

  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !newMute;
    });
  }
}
