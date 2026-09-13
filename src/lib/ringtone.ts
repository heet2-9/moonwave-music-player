"use client";

// Idempotent Incoming Call Ringtone & Vibration Manager

let activeCallIdRinging: string | null = null;
let ringtoneAudio: HTMLAudioElement | null = null;
let vibrationInterval: NodeJS.Timeout | null = null;
let audioContext: AudioContext | null = null;
let synthOscillatorTimer: NodeJS.Timeout | null = null;
let isAutoplayBlocked = false;

export function getIsRingtoneAutoplayBlocked(): boolean {
  return isAutoplayBlocked;
}

// Synthesize pleasant dual-tone chime ring using Web Audio API if HTMLAudioElement fails or for native zero-dependency sound
function startSynthChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const playChimeBurst = () => {
      if (!audioContext || audioContext.state !== "running") return;

      try {
        const now = audioContext.currentTime;
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, now); // A4
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.25);
        osc2.stop(now + 1.25);
      } catch (e) {
        console.warn("[Ringtone] Synth chime play burst error:", e);
      }
    };

    playChimeBurst();
    if (synthOscillatorTimer) clearInterval(synthOscillatorTimer);
    synthOscillatorTimer = setInterval(playChimeBurst, 2500);
  } catch (e) {
    console.warn("[Ringtone] Synth chime setup error:", e);
  }
}

function stopSynthChime() {
  if (synthOscillatorTimer) {
    clearInterval(synthOscillatorTimer);
    synthOscillatorTimer = null;
  }
  if (audioContext) {
    try {
      if (audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
    } catch (e) {
      console.warn("[Ringtone] AudioContext close error:", e);
    }
    audioContext = null;
  }
}

// START INCOMING CALL RINGTONE & VIBRATION
export function startIncomingCallAlert(callId: string) {
  if (typeof window === "undefined") return;

  // Deduplicate: if already ringing for this callId, do nothing
  if (activeCallIdRinging === callId) return;

  // Ensure any previous alert is stopped cleanly
  stopIncomingCallAlert();

  activeCallIdRinging = callId;
  isAutoplayBlocked = false;

  // 1. Setup HTMLAudioElement ringtone
  try {
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio("/sounds/incoming-call.mp3");
      ringtoneAudio.loop = true;
      ringtoneAudio.volume = 0.7;
    } else {
      ringtoneAudio.currentTime = 0;
    }

    const playPromise = ringtoneAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[Ringtone] Autoplay restricted by browser:", err);
        isAutoplayBlocked = true;
        // Fallback: try synth chime
        startSynthChime();
      });
    }
  } catch (err) {
    console.warn("[Ringtone] Audio element initialization error:", err);
    startSynthChime();
  }

  // 2. Setup Device Vibration (if supported)
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      const triggerVibration = () => {
        try {
          if (activeCallIdRinging && "vibrate" in navigator) {
            navigator.vibrate([300, 400, 300, 400]);
          }
        } catch (e) {
          console.warn("[Ringtone] Vibration trigger warning:", e);
        }
      };

      triggerVibration();
      if (vibrationInterval) clearInterval(vibrationInterval);
      vibrationInterval = setInterval(triggerVibration, 2200);
    } catch (e) {
      console.warn("[Ringtone] Vibration setup error:", e);
    }
  }
}

// STOP INCOMING CALL RINGTONE & VIBRATION (IDEMPOTENT)
export function stopIncomingCallAlert() {
  activeCallIdRinging = null;
  isAutoplayBlocked = false;

  // Stop Ringtone Audio Element
  if (ringtoneAudio) {
    try {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    } catch (e) {
      console.warn("[Ringtone] Error pausing ringtone audio:", e);
    }
  }

  // Stop Web Audio Synth
  stopSynthChime();

  // Stop Vibration
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  if (typeof window !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(0);
    } catch (e) {
      console.warn("[Ringtone] Error stopping vibration:", e);
    }
  }
}
