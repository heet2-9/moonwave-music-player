"use client";

import { useEffect, useRef } from "react";
import { audioEngine } from "@/lib/audioEngine";
import { usePlayerStore } from "@/store/playerStore";

interface AudioVisualizerProps {
  className?: string;
  barColor?: string;
  height?: number;
  width?: number;
}

export default function AudioVisualizer({
  className = "w-full h-16",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = audioEngine.setupWebAudio();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Subtle ambient resting wave when paused
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(Date.now() * 0.002 + i * 0.2) * 15 + 10;
        }
      }

      const barWidth = (displayWidth / bufferLength) * 0.6;
      const gap = (displayWidth / bufferLength) * 0.4;

      for (let i = 0; i < bufferLength; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = Math.max(4, percent * displayHeight * 0.85);

        const x = i * (barWidth + gap) + gap / 2;
        const y = displayHeight - barHeight;

        // Soft gradient from pink to violet
        const gradient = ctx.createLinearGradient(0, y, 0, displayHeight);
        gradient.addColorStop(0, "#f472b6"); // Pink
        gradient.addColorStop(0.5, "#c084fc"); // Lavender
        gradient.addColorStop(1, "rgba(168, 85, 247, 0.2)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
