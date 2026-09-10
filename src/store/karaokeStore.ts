import { create } from "zustand";
import { KaraokeSong, karaokeSongs } from "@/data/karaokeSongs";

export type KaraokeStateStatus =
  | "idle"
  | "requesting_mic"
  | "mic_ready"
  | "recording"
  | "processing"
  | "completed"
  | "error";

interface KaraokeStoreState {
  selectedKaraokeSong: KaraokeSong;
  status: KaraokeStateStatus;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  recordingDuration: number;
  errorMessage: string | null;
  
  // Audio Mixer Gain Levels
  micGainLevel: number; // 0.0 to 2.0 (default 1.0)
  karaokeGainLevel: number; // 0.0 to 1.0 (default 0.45)
  enableDucking: boolean;

  // Actions
  setSelectedKaraokeSong: (song: KaraokeSong) => void;
  setStatus: (status: KaraokeStateStatus) => void;
  setRecordedBlob: (blob: Blob | null, url: string | null) => void;
  setRecordingDuration: (duration: number) => void;
  setErrorMessage: (msg: string | null) => void;
  setMicGainLevel: (gain: number) => void;
  setKaraokeGainLevel: (gain: number) => void;
  setEnableDucking: (enable: boolean) => void;
  resetKaraokeSession: () => void;
}

export const useKaraokeStore = create<KaraokeStoreState>((set, get) => ({
  selectedKaraokeSong: karaokeSongs[0],
  status: "idle",
  recordedBlob: null,
  recordedUrl: null,
  recordingDuration: 0,
  errorMessage: null,

  micGainLevel: 1.0,
  karaokeGainLevel: 0.45,
  enableDucking: true,

  setSelectedKaraokeSong: (song: KaraokeSong) => {
    const { recordedUrl } = get();
    if (recordedUrl) {
      try { URL.revokeObjectURL(recordedUrl); } catch (e) {}
    }
    set({
      selectedKaraokeSong: song,
      status: "idle",
      recordedBlob: null,
      recordedUrl: null,
      recordingDuration: 0,
      errorMessage: null,
    });
  },

  setStatus: (status: KaraokeStateStatus) => set({ status }),

  setRecordedBlob: (blob: Blob | null, url: string | null) => {
    const { recordedUrl } = get();
    if (recordedUrl && recordedUrl !== url) {
      try { URL.revokeObjectURL(recordedUrl); } catch (e) {}
    }
    set({ recordedBlob: blob, recordedUrl: url });
  },

  setRecordingDuration: (recordingDuration: number) => set({ recordingDuration }),
  setErrorMessage: (errorMessage: string | null) => set({ errorMessage }),
  setMicGainLevel: (micGainLevel: number) => set({ micGainLevel }),
  setKaraokeGainLevel: (karaokeGainLevel: number) => set({ karaokeGainLevel }),
  setEnableDucking: (enableDucking: boolean) => set({ enableDucking }),

  resetKaraokeSession: () => {
    const { recordedUrl } = get();
    if (recordedUrl) {
      try { URL.revokeObjectURL(recordedUrl); } catch (e) {}
    }
    set({
      status: "idle",
      recordedBlob: null,
      recordedUrl: null,
      recordingDuration: 0,
      errorMessage: null,
    });
  },
}));
