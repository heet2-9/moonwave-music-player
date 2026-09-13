import { create } from "zustand";

export type CallStatus =
  | "idle"
  | "calling"
  | "incoming"
  | "connecting"
  | "connected"
  | "declined"
  | "ended"
  | "failed";

interface VoiceCallState {
  callStatus: CallStatus;
  callId: string | null;
  remoteParticipantId: string | null;
  remoteParticipantName: string | null;
  callStartedAt: number | null;
  callDuration: number;
  isMuted: boolean;
  isSpeakerEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isIncomingCall: boolean;
  callError: string | null;
  isCallPanelOpen: boolean;

  // Actions
  startCall: (remoteId: string, remoteName: string, callId: string) => void;
  receiveCall: (remoteId: string, remoteName: string, callId: string) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  setMuted: (isMuted: boolean) => void;
  toggleMute: () => void;
  setSpeakerEnabled: (enabled: boolean) => void;
  toggleSpeaker: () => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setCallStatus: (status: CallStatus) => void;
  setCallError: (error: string | null) => void;
  setCallDuration: (duration: number) => void;
  clearCall: () => void;
  toggleCallPanel: () => void;
  setCallPanelOpen: (open: boolean) => void;
}

const initialCallState = {
  callStatus: "idle" as CallStatus,
  callId: null,
  remoteParticipantId: null,
  remoteParticipantName: null,
  callStartedAt: null,
  callDuration: 0,
  isMuted: false,
  isSpeakerEnabled: true,
  localStream: null,
  remoteStream: null,
  isIncomingCall: false,
  callError: null,
  isCallPanelOpen: true,
};

export const useVoiceCallStore = create<VoiceCallState>((set) => ({
  ...initialCallState,

  startCall: (remoteId, remoteName, callId) =>
    set({
      callStatus: "calling",
      callId,
      remoteParticipantId: remoteId,
      remoteParticipantName: remoteName,
      isIncomingCall: false,
      callError: null,
      callDuration: 0,
      callStartedAt: null,
      isCallPanelOpen: true,
    }),

  receiveCall: (remoteId, remoteName, callId) =>
    set({
      callStatus: "incoming",
      callId,
      remoteParticipantId: remoteId,
      remoteParticipantName: remoteName,
      isIncomingCall: true,
      callError: null,
      callDuration: 0,
      callStartedAt: null,
      isCallPanelOpen: true,
    }),

  acceptCall: () =>
    set({
      callStatus: "connecting",
      callError: null,
    }),

  declineCall: () =>
    set({
      callStatus: "declined",
    }),

  endCall: () =>
    set({
      callStatus: "ended",
    }),

  setMuted: (isMuted) => set({ isMuted }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setSpeakerEnabled: (isSpeakerEnabled) => set({ isSpeakerEnabled }),
  toggleSpeaker: () => set((state) => ({ isSpeakerEnabled: !state.isSpeakerEnabled })),

  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setLocalStream: (localStream) => set({ localStream }),

  setCallStatus: (callStatus) =>
    set((state) => ({
      callStatus,
      callStartedAt: callStatus === "connected" && !state.callStartedAt ? Date.now() : state.callStartedAt,
    })),

  setCallError: (callError) => set({ callError }),
  setCallDuration: (callDuration) => set({ callDuration }),

  clearCall: () => set({ ...initialCallState }),

  toggleCallPanel: () => set((state) => ({ isCallPanelOpen: !state.isCallPanelOpen })),
  setCallPanelOpen: (isCallPanelOpen) => set({ isCallPanelOpen }),
}));
