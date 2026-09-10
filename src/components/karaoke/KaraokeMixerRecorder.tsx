"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useKaraokeStore } from "@/store/karaokeStore";
import { KaraokeSong } from "@/data/karaokeSongs";
import { Mic, Square, AlertCircle, Radio, Info, Volume2, Sliders, Headphones, AlertTriangle } from "lucide-react";

interface KaraokeMixerRecorderProps {
  song: KaraokeSong;
  getVideoElement: () => HTMLVideoElement | null;
  onStartVideo: () => Promise<void>;
  onPauseVideo: () => void;
  onSeekVideo: (time: number) => void;
}

export default function KaraokeMixerRecorder({
  song,
  getVideoElement,
  onStartVideo,
  onPauseVideo,
  onSeekVideo,
}: KaraokeMixerRecorderProps) {
  // Stable Audio Graph Refs to prevent React StrictMode duplicate initializations
  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const karaokeGainNodeRef = useRef<GainNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const mixerGainNodeRef = useRef<GainNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const monitorGainNodeRef = useRef<GainNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silentStartTimeRef = useRef<number | null>(null);

  // Component States
  const [micLevel, setMicLevel] = useState<number>(0);
  const [showLowInputWarning, setShowLowInputWarning] = useState<boolean>(false);
  const [micConnected, setMicConnected] = useState<boolean>(false);

  // Zustand Selectors
  const status = useKaraokeStore((state) => state.status);
  const recordingDuration = useKaraokeStore((state) => state.recordingDuration);
  const errorMessage = useKaraokeStore((state) => state.errorMessage);
  const micGainLevel = useKaraokeStore((state) => state.micGainLevel);
  const karaokeGainLevel = useKaraokeStore((state) => state.karaokeGainLevel);
  const enableDucking = useKaraokeStore((state) => state.enableDucking);

  const setStatus = useKaraokeStore((state) => state.setStatus);
  const setRecordedBlob = useKaraokeStore((state) => state.setRecordedBlob);
  const setRecordingDuration = useKaraokeStore((state) => state.setRecordingDuration);
  const setErrorMessage = useKaraokeStore((state) => state.setErrorMessage);
  const setMicGainLevel = useKaraokeStore((state) => state.setMicGainLevel);
  const setKaraokeGainLevel = useKaraokeStore((state) => state.setKaraokeGainLevel);
  const resetKaraokeSession = useKaraokeStore((state) => state.resetKaraokeSession);

  // Synchronize Gain Nodes when Sliders change
  useEffect(() => {
    if (micGainNodeRef.current && audioCtxRef.current) {
      micGainNodeRef.current.gain.setTargetAtTime(
        micGainLevel,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [micGainLevel]);

  useEffect(() => {
    if (karaokeGainNodeRef.current && audioCtxRef.current) {
      karaokeGainNodeRef.current.gain.setTargetAtTime(
        karaokeGainLevel,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [karaokeGainLevel]);

  // Clean Web Audio Node Teardown
  const teardownAudioNodes = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (micSourceRef.current) {
      try { micSourceRef.current.disconnect(); } catch (e) {}
      micSourceRef.current = null;
    }

    recorderRef.current = null;
    setMicConnected(false);
    setMicLevel(0);
    setShowLowInputWarning(false);
    console.log("[MOONWAVE] Audio nodes and microphone stream cleaned up.");
  }, []);

  useEffect(() => {
    return () => {
      teardownAudioNodes();
    };
  }, [teardownAudioNodes]);

  // Supported MIME Type Auto-Detection Priority
  const getSupportedMimeType = (): string => {
    if (typeof MediaRecorder === "undefined") return "";
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  // Setup Web Audio Master Graph
  const setupWebAudioGraph = (micStream: MediaStream) => {
    const videoElement = getVideoElement();
    if (!videoElement) {
      throw new Error("Karaoke video player element not found.");
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContextClass();
    }
    const audioCtx = audioCtxRef.current;

    // Idempotent MediaElementAudioSourceNode creation per video element
    if (!videoSourceRef.current) {
      try {
        videoSourceRef.current = audioCtx.createMediaElementSource(videoElement);
        console.log("[MOONWAVE] MediaElementAudioSourceNode created for local video.");
      } catch (e) {
        console.warn("[MOONWAVE] Video element already connected to audio node:", e);
      }
    }

    // Connect Microphone Stream Source
    if (micSourceRef.current) {
      try { micSourceRef.current.disconnect(); } catch (e) {}
    }
    micSourceRef.current = audioCtx.createMediaStreamSource(micStream);

    // Create Gain & Mixer Nodes
    if (!karaokeGainNodeRef.current) {
      karaokeGainNodeRef.current = audioCtx.createGain();
    }
    if (!micGainNodeRef.current) {
      micGainNodeRef.current = audioCtx.createGain();
    }
    if (!mixerGainNodeRef.current) {
      mixerGainNodeRef.current = audioCtx.createGain();
    }
    if (!masterGainNodeRef.current) {
      masterGainNodeRef.current = audioCtx.createGain();
    }
    if (!monitorGainNodeRef.current) {
      monitorGainNodeRef.current = audioCtx.createGain();
    }
    if (!destinationNodeRef.current) {
      destinationNodeRef.current = audioCtx.createMediaStreamDestination();
    }
    if (!micAnalyserRef.current) {
      micAnalyserRef.current = audioCtx.createAnalyser();
      micAnalyserRef.current.fftSize = 64;
    }

    const karaokeGain = karaokeGainNodeRef.current;
    const micGain = micGainNodeRef.current;
    const mixerGain = mixerGainNodeRef.current;
    const masterGain = masterGainNodeRef.current;
    const monitorGain = monitorGainNodeRef.current;
    const destination = destinationNodeRef.current;
    const micAnalyser = micAnalyserRef.current;

    // Set initial gain levels
    karaokeGain.gain.setValueAtTime(karaokeGainLevel, audioCtx.currentTime);
    micGain.gain.setValueAtTime(micGainLevel, audioCtx.currentTime);
    mixerGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    monitorGain.gain.setValueAtTime(1.0, audioCtx.currentTime); // Monitors video + mic to speakers

    // Optional 80Hz High-Pass Filter for clean voice
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(80, audioCtx.currentTime);

    // Build Graph Pipeline:
    // Video -> Karaoke Gain ----------------> Mixer Gain -> Master Gain -> Destination (MediaRecorder)
    // Mic -> Highpass -> Mic Gain -> Analyser -> Mixer Gain                    ↓
    //                                                                  Monitor Gain -> AudioContext.destination
    if (videoSourceRef.current) {
      videoSourceRef.current.disconnect();
      videoSourceRef.current.connect(karaokeGain);
    }

    karaokeGain.disconnect();
    karaokeGain.connect(mixerGain);

    micSourceRef.current.disconnect();
    micSourceRef.current.connect(highpass);
    highpass.connect(micGain);
    micGain.connect(micAnalyser);
    micGain.connect(mixerGain);

    mixerGain.disconnect();
    mixerGain.connect(masterGain);

    masterGain.disconnect();
    masterGain.connect(destination); // Connect to MediaRecorder MediaStreamDestination
    masterGain.connect(monitorGain);
    monitorGain.connect(audioCtx.destination); // Speaker output (avoids double audio!)

    console.log("[MOONWAVE] Web Audio mixer graph constructed successfully.");
    return { audioCtx, destination, micAnalyser, karaokeGain };
  };

  // Real-time Mic Level Loop with Gentle Automatic Voice Ducking
  const startMicLevelAnalysis = (analyser: AnalyserNode, karaokeGain: GainNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const levelPercent = Math.min(100, Math.round((avg / 255) * 100 * 2.8));
      setMicLevel(levelPercent);

      // Voice Ducking Logic (reduce karaoke volume slightly when singing)
      if (audioCtxRef.current && enableDucking) {
        const now = audioCtxRef.current.currentTime;
        if (levelPercent > 12) {
          // Voice active -> duck karaoke volume gently to 70% of set gain
          karaokeGain.gain.setTargetAtTime(karaokeGainLevel * 0.7, now, 0.1);
        } else {
          // Voice quiet -> smoothly restore full karaoke gain
          karaokeGain.gain.setTargetAtTime(karaokeGainLevel, now, 0.2);
        }
      }

      // Low mic input diagnostic check
      if (levelPercent < 2) {
        if (!silentStartTimeRef.current) {
          silentStartTimeRef.current = Date.now();
        } else if (Date.now() - silentStartTimeRef.current > 5000) {
          setShowLowInputWarning(true);
        }
      } else {
        silentStartTimeRef.current = null;
        setShowLowInputWarning(false);
      }

      animFrameRef.current = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  };

  // Step 4: Enable Microphone Action
  const enableMicrophone = async () => {
    setErrorMessage(null);
    setStatus("requesting_mic");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone audio recording is not supported in this browser.");
      setStatus("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const { audioCtx, micAnalyser, karaokeGain } = setupWebAudioGraph(stream);
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      startMicLevelAnalysis(micAnalyser, karaokeGain);

      setMicConnected(true);
      setStatus("mic_ready");
      console.log("[MOONWAVE] Microphone connected & Web Audio graph active.");
    } catch (err: any) {
      console.warn("[MOONWAVE] Microphone permission error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Microphone permission was denied. Allow microphone access in your browser settings and try again.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No microphone was detected on your system.");
      } else {
        setErrorMessage(err.message || "Failed to connect microphone.");
      }
      setStatus("error");
    }
  };

  // Step 6: Start Recording Action
  const startRecording = async () => {
    if (!micStreamRef.current) {
      await enableMicrophone();
    }
    if (!destinationNodeRef.current || !audioCtxRef.current) {
      setErrorMessage("Audio engine could not start. Please interact with the page and try again.");
      setStatus("error");
      return;
    }

    try {
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }

      const destination = destinationNodeRef.current;
      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(destination.stream, { mimeType })
        : new MediaRecorder(destination.stream);
      recorderRef.current = recorder;

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("[MOONWAVE] MediaRecorder stopped. Chunks count:", chunksRef.current.length);
        const finalBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });

        console.log("[MOONWAVE] Final Mixed Blob Size (bytes):", finalBlob.size);
        console.log("[MOONWAVE] Final Mixed Blob Type:", finalBlob.type);

        if (finalBlob.size === 0) {
          setErrorMessage("The recording appears to be empty (0 bytes). Please try again.");
          setStatus("error");
          return;
        }

        const recordingUrl = URL.createObjectURL(finalBlob);
        setRecordedBlob(finalBlob, recordingUrl);
        setStatus("completed");
      };

      // 1. Seek video to start (0s)
      onSeekVideo(0);

      // 2. Start MediaRecorder
      recorder.start(250);
      setStatus("recording");
      setRecordingDuration(0);

      // 3. Start Video playback
      await onStartVideo();

      // Start duration counter
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingDuration(useKaraokeStore.getState().recordingDuration + 1);
      }, 1000);
    } catch (err: any) {
      console.error("[MOONWAVE] Start recording exception:", err);
      setErrorMessage(err.message || "Failed to start karaoke recording.");
      setStatus("error");
    }
  };

  // Step 9: Stop Recording Action
  const stopRecording = () => {
    setStatus("processing");
    onPauseVideo();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder:", e);
      }
    }
  };

  const handleRecordAgain = () => {
    resetKaraokeSession();
    if (micStreamRef.current) {
      setStatus("mic_ready");
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Render Live 10-Segment Input Level Visualizer Meter
  const renderMicLevelMeter = () => {
    const activeSegments = Math.round((micLevel / 100) * 10);
    return (
      <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
        <span className="text-pink-400 font-bold text-[10px] flex items-center gap-1">
          MIC LEVEL
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-3.5 rounded-xs transition-colors duration-75 ${
                idx < activeSegments
                  ? idx < 6
                    ? "bg-emerald-400"
                    : idx < 8
                    ? "bg-amber-400"
                    : "bg-red-500"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-zinc-400 w-7 text-right">{micLevel}%</span>
      </div>
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0e0e17]/90 border border-white/10 shadow-2xl space-y-6 select-none relative overflow-hidden">
      {/* Recording Status Header */}
      {status === "recording" && (
        <div className="w-full bg-pink-500/20 border border-pink-500/30 py-2 px-4 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-pink-400 animate-spin" />
            <span className="text-xs font-bold text-pink-300 tracking-wider uppercase">
              🔴 RECORDING MIX (MUSIC + VOICE)
            </span>
          </div>
          {renderMicLevelMeter()}
        </div>
      )}

      {/* Headphones Optional Recommendation */}
      <div className="w-full bg-white/[0.03] border border-white/5 p-3 rounded-xl text-left flex items-start gap-2.5">
        <Headphones className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-300 leading-relaxed">
          <strong>Tip:</strong> For the cleanest recording, use headphones so the karaoke instrumental doesn&apos;t bleed back into your microphone.
        </p>
      </div>

      {/* Low Input Level Warning */}
      {showLowInputWarning && (status === "recording" || status === "mic_ready") && (
        <div className="w-full p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>Microphone signal not detected. Check your microphone permissions and input device.</span>
        </div>
      )}

      {/* Diagnostic Error Message */}
      {errorMessage && (
        <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Sliders for Voice (Mic Gain) & Music (Karaoke Gain) */}
      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-pink-400" />
            Audio Mixer Controls
          </span>
          {micConnected && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              ● Mic Connected
            </span>
          )}
        </div>

        {/* Voice Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>VOICE (Mic Volume)</span>
            <span className="font-mono text-pink-400">{Math.round(micGainLevel * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={micGainLevel}
            onChange={(e) => setMicGainLevel(parseFloat(e.target.value))}
            className="w-full accent-pink-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* Music Volume Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-300 font-medium">
            <span>MUSIC (Karaoke Volume)</span>
            <span className="font-mono text-purple-400">{Math.round(karaokeGainLevel * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={karaokeGainLevel}
            onChange={(e) => setKaraokeGainLevel(parseFloat(e.target.value))}
            className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Recording Duration Timer Display */}
      <div className="text-center py-2">
        <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-widest font-mono drop-shadow-md">
          {formatTimer(recordingDuration)}
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          {status === "recording"
            ? "Recording vocal + instrumental track..."
            : status === "processing"
            ? "Creating your mixed performance..."
            : status === "completed"
            ? "Performance recorded!"
            : "Ready to sing?"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {!micConnected && (status === "idle" || status === "error") && (
          <button
            onClick={enableMicrophone}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all shadow-md"
          >
            <Mic className="w-4 h-4 text-pink-400" />
            <span>Enable Microphone</span>
          </button>
        )}

        {micConnected && (status === "mic_ready" || status === "idle") && (
          <button
            onClick={startRecording}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Mic className="w-5 h-5 fill-current animate-pulse" />
            <span>Start Recording</span>
          </button>
        )}

        {status === "requesting_mic" && (
          <button disabled className="px-6 py-3 rounded-full bg-white/10 text-zinc-400 text-xs font-bold">
            Connecting Microphone...
          </button>
        )}

        {status === "recording" && (
          <button
            onClick={stopRecording}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Recording</span>
          </button>
        )}

        {status === "completed" && (
          <button
            onClick={handleRecordAgain}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-semibold transition-all"
          >
            Record Again
          </button>
        )}
      </div>
    </div>
  );
}
