"use client";

import { useState, useEffect, useRef } from "react";
import { formatTime } from "../utils/formatTime";
import WaveSurfer from "wavesurfer.js";

interface TrimToolsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  startTrim: number;
  endTrim: number;
  setStartTrim: (value: number) => void;
  setEndTrim: (value: number) => void;
  videoDuration: number;
  audioDuration: number;
  isDragging: "start" | "end" | null;
  setIsDragging: (value: "start" | "end" | null) => void;
  tooltipPosition: { x: number; y: number } | null;
  setTooltipPosition: (value: { x: number; y: number } | null) => void;
  tooltipTime: string;
  setTooltipTime: (value: string) => void;
  trimMode: "both" | "video" | "audio";
  setTrimMode: (mode: "both" | "video" | "audio") => void;
}

export default function TrimTools({
  videoRef,
  audioRef,
  startTrim,
  endTrim,
  setStartTrim,
  setEndTrim,
  videoDuration,
  audioDuration,
  isDragging,
  setIsDragging,
  tooltipPosition,
  setTooltipPosition,
  tooltipTime,
  setTooltipTime,
  trimMode,
  setTrimMode,
}: TrimToolsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize WaveSurfer for audio visualization
  useEffect(() => {
    if (!waveformRef.current || !audioRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#ddd",
      progressColor: "#007bff",
      cursorColor: "#007bff",
      barWidth: 2,
    });

    ws.load(audioRef.current.src);
    setWaveSurfer(ws);

    return () => ws.destroy();
  }, [audioRef]);

  // Extract video frames as thumbnails
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || videoDuration <= 0) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const thumbnailCount = 20;
    const interval = videoDuration / thumbnailCount;
    const thumbnails: string[] = [];

    const extractFrame = (time: number) => {
      return new Promise<void>((resolve) => {
        video.currentTime = time;
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          thumbnails.push(dataUrl);
          resolve();
        };
      });
    };

    const extractAllFrames = async () => {
      for (let i = 0; i < thumbnailCount; i++) {
        await extractFrame(i * interval);
      }
      setThumbnails(thumbnails);
    };

    extractAllFrames();
  }, [videoDuration, videoRef]);

  const getActiveDuration = () => {
    return trimMode === "audio" ? audioDuration : videoDuration;
  };

  const handleMouseDown = (e: React.MouseEvent, type: "start" | "end") => {
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = getActiveDuration();
    const newTime = (x / rect.width) * duration;

    if (isDragging === "start") {
      setStartTrim(Math.max(0, Math.min(newTime, endTrim - 0.1)));
    } else if (isDragging === "end") {
      setEndTrim(Math.min(duration, Math.max(newTime, startTrim + 0.1)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startTrim, endTrim]);

  const handlePlayPause = () => {
    if (videoRef.current && waveSurfer) {
      if (isPlaying) {
        videoRef.current.pause();
        waveSurfer.pause();
      } else {
        videoRef.current.currentTime = startTrim;
        waveSurfer.seekTo(startTrim / audioDuration);
        videoRef.current.play();
        waveSurfer.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.ontimeupdate = () => {
        if (videoRef.current && videoRef.current.currentTime >= endTrim) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      };
    }

    if (waveSurfer) {
      waveSurfer.on("audioprocess", () => {
        if (waveSurfer.getCurrentTime() >= endTrim) {
          waveSurfer.pause();
          setIsPlaying(false);
        }
      });
    }
  }, [startTrim, endTrim, videoRef, waveSurfer, audioDuration]);

  return (
    <>
      {/* Video Thumbnails */}
      {trimMode !== "audio" && (
        <div className="relative w-full mt-4" ref={timelineRef}>
          <div className="flex w-full h-20 overflow-hidden rounded-lg shadow-lg">
            {thumbnails.map((thumbnail, index) => (
              <div
                key={index}
                className="flex-shrink-0 h-20 bg-cover bg-center"
                style={{
                  width: `${100 / thumbnails.length}%`,
                  backgroundImage: `url(${thumbnail})`,
                }}
              ></div>
            ))}
          </div>
          <div
            className="absolute top-0 h-full bg-blue-500 opacity-50 cursor-ew-resize"
            style={{
              left: `${(startTrim / getActiveDuration()) * 100}%`,
              width: `${((endTrim - startTrim) / getActiveDuration()) * 100}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, "start")}
          ></div>
          <div
            className="absolute top-0 h-full bg-blue-500 opacity-50 cursor-ew-resize"
            style={{
              left: `${(endTrim / getActiveDuration()) * 100}%`,
              width: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "end")}
          ></div>
        </div>
      )}

      {/* Audio Waveform */}
      {trimMode !== "video" && (
        <div className="w-full mt-4 relative" ref={timelineRef}>
          <div
            ref={waveformRef}
            className="w-full h-16 relative rounded-lg shadow-lg"
          ></div>
          <div
            className="absolute top-0 h-full bg-blue-500 opacity-50 cursor-ew-resize"
            style={{
              left: `${(startTrim / getActiveDuration()) * 100}%`,
              width: `${((endTrim - startTrim) / getActiveDuration()) * 100}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, "start")}
          ></div>
          <div
            className="absolute top-0 h-full bg-blue-500 opacity-50 cursor-ew-resize"
            style={{
              left: `${(endTrim / getActiveDuration()) * 100}%`,
              width: "2px",
            }}
            onMouseDown={(e) => handleMouseDown(e, "end")}
          ></div>
        </div>
      )}

      {/* Play/Pause Button */}
      <div className="mt-24 flex justify-center space-x-4">
        <button
          onClick={handlePlayPause}
          className="p-2 bg-blue-500 text-white rounded-full"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Trim Mode Selection */}
      <div className="mt-24 flex justify-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="video"
            checked={trimMode === "video"}
            onChange={() => setTrimMode("video")}
            className="form-radio"
          />
          <span>Video Only</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="audio"
            checked={trimMode === "audio"}
            onChange={() => setTrimMode("audio")}
            className="form-radio"
          />
          <span>Audio Only</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="both"
            checked={trimMode === "both"}
            onChange={() => setTrimMode("both")}
            className="form-radio"
          />
          <span>Both Audio and Video</span>
        </label>
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
    </>
  );
}
