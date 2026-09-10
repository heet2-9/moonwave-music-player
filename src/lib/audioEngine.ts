import { Song } from "@/types/music";

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isInitialized = false;

  public init(): HTMLAudioElement {
    if (typeof window === "undefined") {
      return {} as HTMLAudioElement;
    }

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "metadata";
      this.audio.crossOrigin = "anonymous";
    }

    return this.audio;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  public setupWebAudio(): AnalyserNode | null {
    if (typeof window === "undefined" || !this.audio) return null;

    if (this.analyserNode) {
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
      return this.analyserNode;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

      this.audioContext = new AudioCtx();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64; // 32 frequency bins for crisp visualizer bars
      this.analyserNode.smoothingTimeConstant = 0.8;

      try {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
      } catch (e) {
        console.warn("MediaElementAudioSourceNode already connected or cross-origin restricted:", e);
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not fully initialized:", e);
    }

    return this.analyserNode;
  }

  public resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  public updateMediaSession(song: Song | null, onNext: () => void, onPrev: () => void) {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !song) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: [
          { src: song.artwork, sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        this.audio?.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        this.audio?.pause();
      });
      navigator.mediaSession.setActionHandler("previoustrack", onPrev);
      navigator.mediaSession.setActionHandler("nexttrack", onNext);
    } catch (e) {
      console.warn("MediaSession API error:", e);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as any);
    }
  }
}

export const audioEngine = new AudioEngine();
