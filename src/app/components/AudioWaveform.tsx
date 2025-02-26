"use client";

import { useState, useEffect, useRef } from "react";

interface AudioWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  startTrim: number;
  endTrim: number;
  setStartTrim: (value: number) => void;
  setEndTrim: (value: number) => void;
  audioDuration: number;
  isDragging: "start" | "end" | null;
  setIsDragging: (value: "start" | "end" | null) => void;
}

export default function AudioWaveform({
  audioRef,
  startTrim,
  endTrim,
  setStartTrim,
  setEndTrim,
  audioDuration,
  isDragging,
  setIsDragging,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);

  // Analyze audio and generate waveform data
  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const analyzer = audioContext.createAnalyser();

    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    analyzer.fftSize = 2048;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const updateWaveform = () => {
      analyzer.getFloatTimeDomainData(dataArray);
      setWaveformData(dataArray);
      requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  }, [audioRef]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#4A5568"; // Background color
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#4299E1"; // Waveform color
    ctx.beginPath();

    const sliceWidth = width / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / 2.0;
      const y = (v * height) / 2 + height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }, [waveformData]);

  const handleTrimChange = (clientX: number, type: "start" | "end") => {
    if (!canvasRef.current) return;

    const { left, width } = canvasRef.current.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(100, ((clientX - left) / width) * 100)
    );

    if (type === "start") {
      setStartTrim(percent);
    } else {
      setEndTrim(percent);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleTrimChange(e.clientX, isDragging);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="relative w-full mt-4">
      <canvas
        ref={canvasRef}
        className="w-full h-20 bg-gray-200 rounded-lg"
        width={800}
        height={80}
      />
      <div
        className="absolute top-0 left-0 h-20 bg-black bg-opacity-40"
        style={{
          left: `${startTrim}%`,
          width: `${endTrim - startTrim}%`,
        }}
      ></div>
      <div
        className="absolute top-0 w-2 h-20 bg-blue-600 cursor-pointer"
        style={{ left: `${startTrim}%` }}
        onMouseDown={() => setIsDragging("start")}
      ></div>
      <div
        className="absolute top-0 w-2 h-20 bg-blue-600 cursor-pointer"
        style={{ left: `${endTrim}%` }}
        onMouseDown={() => setIsDragging("end")}
      ></div>
    </div>
  );
}
