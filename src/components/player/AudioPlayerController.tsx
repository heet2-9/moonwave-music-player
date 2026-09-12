"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { audioEngine } from "@/lib/audioEngine";

export default function AudioPlayerController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const nextSong = usePlayerStore((state) => state.nextSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const repeat = usePlayerStore((state) => state.repeat);
  
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const prevTrack = usePlayerStore((state) => state.prevTrack);

  const addRecentlyPlayed = useLibraryStore((state) => state.addRecentlyPlayed);

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

    const handleError = (e: any) => {
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
          setIsPlaying(false);
        });
      }
    }
  }, [currentSong, addRecentlyPlayed, nextTrack, prevTrack, isPlaying, setIsPlaying]);

  // Play / Pause State Control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audioEngine.resumeAudioContext();
      audio.play().catch((err) => {
        console.warn("Playback error:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, setIsPlaying]);

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
