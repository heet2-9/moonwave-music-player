"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { useTogetherStore } from "@/store/togetherStore";
import { audioEngine } from "@/lib/audioEngine";

export default function AudioPlayerController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const nextSong = usePlayerStore((state) => state.nextSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const currentTime = usePlayerStore((state) => state.currentTime);

  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const prevTrack = usePlayerStore((state) => state.prevTrack);

  const addRecentlyPlayed = useLibraryStore((state) => state.addRecentlyPlayed);

  const isJoined = useTogetherStore((state) => state.isJoined);
  const room = useTogetherStore((state) => state.room);
  const setSyncMetrics = useTogetherStore((state) => state.setSyncMetrics);
  const setAutoplayBlocked = useTogetherStore((state) => state.setAutoplayBlocked);

  // Initialize Audio Element & Attach Event Listeners
  useEffect(() => {
    const audio = audioEngine.init();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentSong?.duration || 0);
    };

    const handleEnded = () => {
      const state = usePlayerStore.getState();
      if (state.repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    const handleError = (e: Event | string) => {
      console.warn("Audio element loading notice:", e);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [setCurrentTime, setDuration, nextTrack, setIsPlaying, currentSong]);

  // Preload Upcoming Next Track
  useEffect(() => {
    if (nextSong && nextSong.audio) {
      audioEngine.preloadTrack(nextSong.audio);
    } else {
      audioEngine.cleanupPreload();
    }
  }, [nextSong]);

  // Handle Track Source Changes & Instant Transitions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (audio.src !== currentSong.audio && !audio.src.endsWith(currentSong.audio)) {
      audio.src = currentSong.audio;
      audio.load();
      addRecentlyPlayed(currentSong.id);
      audioEngine.updateMediaSession(currentSong, nextTrack, prevTrack);

      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn("Autoplay policy or audio play error:", err);
          if (err.name === "NotAllowedError" || err.message?.includes("user gesture")) {
            setAutoplayBlocked(true);
          }
          setIsPlaying(false);
        });
      }
    }
  }, [currentSong, addRecentlyPlayed, nextTrack, prevTrack, isPlaying, setIsPlaying, setAutoplayBlocked]);

  // Play / Pause State Control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audioEngine.resumeAudioContext();
      audio.play().catch((err) => {
        console.warn("Playback error:", err);
        if (err.name === "NotAllowedError" || err.message?.includes("user gesture")) {
          setAutoplayBlocked(true);
        }
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, setIsPlaying, setAutoplayBlocked]);

  // Together Room Periodic Clock Sync & Drift Monitoring
  useEffect(() => {
    if (!isJoined || !room) return;

    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || !room.isPlaying || !room.playbackStartedAt) return;

      const elapsed = (Date.now() - room.playbackStartedAt) / 1000;
      const expectedPosition = Math.max(0, room.position + elapsed);
      const currentPos = audio.currentTime;
      const drift = Math.abs(currentPos - expectedPosition);

      const driftMs = drift * 1000;

      if (drift > 1.0) {
        setSyncMetrics("DRIFT DETECTED", driftMs);
        audio.currentTime = expectedPosition;
      } else if (drift > 0.35) {
        setSyncMetrics("DRIFT DETECTED", driftMs);
        audio.currentTime = expectedPosition;
      } else {
        setSyncMetrics("SYNCED", driftMs);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isJoined, room, setSyncMetrics]);

  // Handle Tab Visibility Changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isJoined && room && audioRef.current) {
        if (room.isPlaying && room.playbackStartedAt) {
          const elapsed = (Date.now() - room.playbackStartedAt) / 1000;
          const expectedPosition = Math.max(0, room.position + elapsed);
          audioRef.current.currentTime = expectedPosition;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isJoined, room]);

  // Volume & Mute Control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Seek updates from user slider
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Math.abs(audio.currentTime - currentTime) > 1.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  return null;
}

