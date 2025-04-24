"use client";

import { useState, useEffect, useRef } from "react";
import { formatTime } from "../utils/formatTime";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { v4 as uuidv4 } from "uuid";
import WaveSurfer from "wavesurfer.js";

// Initialize FFmpeg
const ffmpeg = createFFmpeg({ log: true });

// Load FFmpeg
const loadFFmpeg = async () => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
};

// Spinner Component
const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

interface Segment {
  id: string;
  start: number;
  end: number;
}

interface TrimToolsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoDuration: number;
  audioDuration: number;
  startTrim: number;
  endTrim: number;
  setStartTrim: React.Dispatch<React.SetStateAction<number>>;
  setEndTrim: React.Dispatch<React.SetStateAction<number>>;
  isDragging: "start" | "end" | null;
  setIsDragging: React.Dispatch<React.SetStateAction<"start" | "end" | null>>;
  tooltipPosition: { x: number; y: number } | null;
  setTooltipPosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
  tooltipTime: string;
  setTooltipTime: React.Dispatch<React.SetStateAction<string>>;
  trimMode: "video" | "audio" | "both";
  setTrimMode: (value: "video" | "audio" | "both") => void;
}

// Draggable Segment Component for Video
function SortableVideoSegment({
  id,
  start,
  end,
  thumbnail,
  duration,
  onRemove,
  onTrim,
  isDraggable, // New prop to control drag state
}: {
  id: string;
  start: number;
  end: number;
  thumbnail: string;
  duration: number;
  onRemove: (id: string) => void;
  onTrim: (id: string, newStart: number, newEnd: number) => void;
  isDraggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled: !isDraggable }); // Disable sorting when not draggable

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDraggable ? "grab" : "pointer",
  };

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const segmentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft || isDraggingRight) {
        if (!segmentRef.current) return;

        const rect = segmentRef.current.getBoundingClientRect();
        const newTime =
          ((e.clientX - rect.left) / rect.width) * (end - start) + start;

        if (isDraggingLeft) {
          onTrim(id, Math.min(newTime, end - 0.1), end);
        } else if (isDraggingRight) {
          onTrim(id, start, Math.max(newTime, start + 0.1));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, start, end, id, onTrim]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        segmentRef.current = node;
      }}
      style={{
        ...style,
        width: `${((end - start) / duration) * 100}%`,
        marginRight: "10px",
        backgroundImage: `url(${thumbnail})`,
        borderRadius: "8px",
        overflow: "hidden",
        transition: "transform 0.2s ease-in-out",
      }}
      className={`flex-shrink-0 h-20 bg-cover bg-center relative ${
        isDraggable ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Dragging Handle - Only show when draggable */}
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0"
          style={{ cursor: "grab" }}
        />
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(id);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all"
        style={{ zIndex: 1000, pointerEvents: "auto" }}
      >
        ×
      </button>

      {/* Timestamp Display */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center text-xs p-1 rounded-b-lg">
        {formatTime(start)} - {formatTime(end)}
      </div>

      {/* Left Border for Trimming */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 ${
          isDraggable ? "bg-blue-700" : "bg-blue-500"
        } cursor-ew-resize hover:bg-blue-600 transition-all`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingLeft(true);
        }}
        style={{
          borderTopLeftRadius: "8px",
          borderBottomLeftRadius: "8px",
        }}
      ></div>

      {/* Right Border for Trimming */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 ${
          isDraggable ? "bg-blue-700" : "bg-blue-500"
        } cursor-ew-resize hover:bg-blue-600 transition-all`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingRight(true);
        }}
        style={{
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
        }}
      ></div>
    </div>
  );
}

// Draggable Segment Component for Audio
// Draggable Segment Component for Audio
function SortableAudioSegment({
  id,
  start,
  end,
  duration,
  onRemove,
  onTrim,
  audioSrc,
  isDraggable = false,
}: {
  id: string;
  start: number;
  end: number;
  duration: number;
  onRemove: (id: string) => void;
  onTrim: (id: string, newStart: number, newEnd: number) => void;
  audioSrc: string;
  isDraggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDraggable ? "grab" : "default",
  };

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const segmentRef = useRef<HTMLDivElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !audioSrc) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(0, 123, 255, 0.5)",
      progressColor: "rgba(0, 123, 255, 0.8)",
      cursorColor: "rgba(255, 255, 255, 0.2)",
      barWidth: 1,
      height: 80,
      backend: "MediaElement",
      normalize: true,
      responsive: true,
    });

    wavesurferRef.current = wavesurfer;

    const handleReady = () => {
      setIsLoading(false);
      setHasError(false);

      // Zoom to the segment's time range
      wavesurfer.zoom(((end - start) / duration) * 100);
    };

    const handleError = (error: Error) => {
      console.error("WaveSurfer error:", error);
      setIsLoading(false);
      setHasError(true);
    };

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("error", handleError);

    try {
      wavesurfer.load(audioSrc);
    } catch (error) {
      console.error("Error loading audio:", error);
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      wavesurfer.un("ready", handleReady);
      wavesurfer.un("error", handleError);
      // try {
      //   wavesurfer.destroy();
      // } catch (err) {
      //   console.warn("Error destroying WaveSurfer:", err);
      // }
    };
  }, [audioSrc, start, end, duration]);

  // Handle trimming
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!segmentRef.current) return;

      const rect = segmentRef.current.getBoundingClientRect();
      const newTime =
        ((e.clientX - rect.left) / rect.width) * (end - start) + start;

      if (isDraggingLeft) {
        onTrim(id, Math.min(newTime, end - 0.1), end);
      } else if (isDraggingRight) {
        onTrim(id, start, Math.max(newTime, start + 0.1));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, start, end, id, onTrim]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        segmentRef.current = node;
      }}
      style={{
        ...style,
        width: `${((end - start) / duration) * 100}%`,
        marginRight: "10px",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "transform 0.2s ease-in-out",
        backgroundColor: "#ffffff",
      }}
      className={`flex-shrink-0 h-20 relative ${
        isDraggable ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Dragging Handle */}
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0"
          style={{ cursor: "grab" }}
        />
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(id);
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all z-50"
      >
        ×
      </button>

      {/* Timestamp Display */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center text-xs p-1 rounded-b-lg z-10">
        {formatTime(start)} - {formatTime(end)}
      </div>

      {/* Waveform Container */}
      <div ref={waveformRef} className="w-full h-20 relative">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-red-500 text-sm p-2">
            Failed to load audio waveform
          </div>
        )}
      </div>

      {/* Left Border for Trimming */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 ${
          isDraggingLeft ? "bg-blue-700" : "bg-blue-500"
        } cursor-ew-resize hover:bg-blue-600 transition-all z-20`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingLeft(true);
        }}
        style={{
          borderTopLeftRadius: "8px",
          borderBottomLeftRadius: "8px",
        }}
      />

      {/* Right Border for Trimming */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 ${
          isDraggingRight ? "bg-blue-700" : "bg-blue-500"
        } cursor-ew-resize hover:bg-blue-600 transition-all z-20`}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingRight(true);
        }}
        style={{
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
        }}
      />
    </div>
  );
}

export default function TrimTools({
  videoRef,
  audioRef,
  videoDuration,
  audioDuration,
}: TrimToolsProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({}); // Thumbnails for each video segment
  const [videoSegments, setVideoSegments] = useState<Segment[]>([
    { id: uuidv4(), start: 0, end: videoDuration },
  ]);
  const [audioSegments, setAudioSegments] = useState<Segment[]>([
    { id: uuidv4(), start: 0, end: audioDuration },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoSplitBarPosition, setVideoSplitBarPosition] = useState<
    number | null
  >(null);
  const [audioSplitBarPosition, setAudioSplitBarPosition] = useState<
    number | null
  >(null);
  const [history, setHistory] = useState<
    { video: Segment[]; audio: Segment[] }[]
  >([]); // History stack for undo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoTimelineRef = useRef<HTMLDivElement | null>(null);
  const audioTimelineRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [redoStack, setRedoStack] = useState<
    { video: Segment[]; audio: Segment[] }[]
  >([]);
  const [draggableSegments, setDraggableSegments] = useState<{
    video: boolean;
    audio: boolean;
  }>({ video: false, audio: false });
  // Ensure FFmpeg is loaded
  useEffect(() => {
    loadFFmpeg();
  }, []);

  // Initialize WaveSurfer for audio waveform
  useEffect(() => {
    if (audioRef.current) {
      // Ensure the #waveform container exists
      const waveformContainer = document.getElementById("waveform");
      if (!waveformContainer) {
        console.error("Waveform container not found");
        return;
      }

      // Initialize WaveSurfer
      wavesurferRef.current = WaveSurfer.create({
        container: "#waveform",
        waveColor: "rgba(0, 123, 255, 0.5)", // Blue color for the waveform
        progressColor: "rgba(0, 123, 255, 0.8)", // Brighter blue for progress
        cursorColor: "rgba(255, 255, 255, 0.2)",
        barWidth: 2,
        barHeight: 1,
        barGap: 2,
        height: 100,
      });

      wavesurferRef.current.load(audioRef.current.src);

      wavesurferRef.current.on("ready", () => {
        console.log("WaveSurfer is ready");
      });
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioRef]);

  // Generate Thumbnails for each video segment
  useEffect(() => {
    const generateThumbnails = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const newThumbnails: Record<string, string> = {};

      for (const segment of videoSegments) {
        const time = segment.start; // Capture thumbnail at the start of the segment
        video.currentTime = time;

        await new Promise((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL("image/jpeg");
            newThumbnails[segment.id] = thumbnail;
            resolve(null);
          };
        });
      }

      setThumbnails(newThumbnails);
    };

    generateThumbnails();
  }, [videoRef, videoSegments]);

  // Handle undo action
  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      // Before undoing, push current state to redo stack
      setRedoStack((prevRedoStack) => [
        ...prevRedoStack,
        { video: videoSegments, audio: audioSegments },
      ]);
      setVideoSegments(previousState.video);
      setAudioSegments(previousState.audio);
      setHistory((prevHistory) => prevHistory.slice(0, -1));
    }
  };
  const clearRedoStack = () => {
    setRedoStack([]);
  };

  // Handle confirm action
  const handleConfirm = () => {
    alert("Confirm action executed");
  };
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setVideoSegments(nextState.video);
      setAudioSegments(nextState.audio);
      setRedoStack((prevRedoStack) => prevRedoStack.slice(0, -1));
      // Add current state to history so undo can bring us back
      setHistory((prevHistory) => [
        ...prevHistory,
        { video: videoSegments, audio: audioSegments },
      ]);
    }
  };
  // Handle splitting the video
  const handleMediaSplit = async () => {
    clearRedoStack();
    setIsProcessing(true);

    // Save current state to history
    setHistory((prevHistory) => [
      ...prevHistory,
      { video: videoSegments, audio: audioSegments },
    ]);

    try {
      // VIDEO SPLIT
      if (videoSplitBarPosition !== null && videoRef.current?.src) {
        const newSegmentId = uuidv4();
        const newSegment: Segment = {
          id: newSegmentId,
          start: videoSplitBarPosition,
          end: videoDuration,
        };

        const updatedVideoSegments = videoSegments.map((segment) => {
          if (segment.end > videoSplitBarPosition) {
            return { ...segment, end: videoSplitBarPosition };
          }
          return segment;
        });

        setVideoSegments([...updatedVideoSegments, newSegment]);
        setVideoSplitBarPosition(null);

        await loadFFmpeg();

        const videoBlob = await fetch(videoRef.current.src).then((res) =>
          res.blob()
        );
        const videoFile = new File([videoBlob], "input.mp4", {
          type: "video/mp4",
        });
        ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));

        await ffmpeg.run(
          "-i",
          "input.mp4",
          "-ss",
          `${newSegment.start}`,
          "-to",
          `${newSegment.end}`,
          "-c",
          "copy",
          "output.mp4"
        );

        const outputData = ffmpeg.FS("readFile", "output.mp4");
        const outputBuffer =
          outputData.buffer instanceof ArrayBuffer
            ? outputData.buffer
            : outputData.buffer.slice(0);
        const outputBlob = new Blob([outputBuffer], { type: "video/mp4" });
        videoRef.current.src = URL.createObjectURL(outputBlob);
      }

      // AUDIO SPLIT
      if (audioSplitBarPosition !== null && wavesurferRef.current) {
        const newSegmentId = uuidv4();
        const newSegment: Segment = {
          id: newSegmentId,
          start: audioSplitBarPosition,
          end: audioDuration,
        };

        const updatedAudioSegments = audioSegments.map((segment) => {
          if (segment.end > audioSplitBarPosition) {
            return { ...segment, end: audioSplitBarPosition };
          }
          return segment;
        });

        setAudioSegments([...updatedAudioSegments, newSegment]);
        setAudioSplitBarPosition(null);

        const audioBuffer = wavesurferRef.current.getDecodedData();
        if (audioBuffer) {
          const splitIndex = Math.floor(
            (audioSplitBarPosition / audioDuration) * audioBuffer.length
          );

          const left = audioBuffer.getChannelData(0).slice(0, splitIndex);
          const right = audioBuffer.getChannelData(1).slice(0, splitIndex);

          const newBuffer = new AudioBuffer({
            length: left.length,
            numberOfChannels: 2,
            sampleRate: audioBuffer.sampleRate,
          });

          newBuffer.copyToChannel(left, 0);
          newBuffer.copyToChannel(right, 1);

          const offlineCtx = new OfflineAudioContext({
            length: newBuffer.length,
            sampleRate: newBuffer.sampleRate,
          });

          const src = offlineCtx.createBufferSource();
          src.buffer = newBuffer;
          src.connect(offlineCtx.destination);
          src.start();

          const renderedBuffer = await offlineCtx.startRendering();
          const audioBlob = new Blob(
            [renderedBuffer.getChannelData(0).buffer],
            {
              type: "audio/wav",
            }
          );

          wavesurferRef.current.loadBlob(audioBlob);
        }
      }
    } catch (error) {
      console.error("Media split error:", error);
      alert("An error occurred during media splitting. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle splitting the audio
  // const handleAudioSplit = async () => {
  //   if (audioSplitBarPosition === null) return;

  //   setIsProcessing(true);

  //   // Save current state to history
  //   setHistory((prevHistory) => [
  //     ...prevHistory,
  //     { video: videoSegments, audio: audioSegments },
  //   ]);

  //   // Split logic
  //   const newSegmentId = uuidv4();
  //   const newSegment: Segment = {
  //     id: newSegmentId,
  //     start: audioSplitBarPosition,
  //     end: audioDuration,
  //   };

  //   const updatedSegments = audioSegments.map((segment) => {
  //     if (segment.end > audioSplitBarPosition) {
  //       return { ...segment, end: audioSplitBarPosition };
  //     }
  //     return segment;
  //   });

  //   setAudioSegments([...updatedSegments, newSegment]);
  //   setAudioSplitBarPosition(null);

  //   try {
  //     // Split audio using WaveSurfer
  //     if (wavesurferRef.current) {
  //       const audioBuffer = wavesurferRef.current.getDecodedData();
  //       if (audioBuffer) {
  //         const splitTime = audioSplitBarPosition;
  //         const leftChannel = audioBuffer.getChannelData(0);
  //         const rightChannel = audioBuffer.getChannelData(1);

  //         const splitIndex = Math.floor(
  //           (splitTime / audioDuration) * leftChannel.length
  //         );

  //         const leftPart = leftChannel.slice(0, splitIndex);
  //         const rightPart = rightChannel.slice(0, splitIndex);

  //         const newAudioBuffer = new AudioBuffer({
  //           length: leftPart.length,
  //           numberOfChannels: 2,
  //           sampleRate: audioBuffer.sampleRate,
  //         });

  //         newAudioBuffer.copyToChannel(leftPart, 0);
  //         newAudioBuffer.copyToChannel(rightPart, 1);

  //         const offlineContext = new OfflineAudioContext({
  //           length: newAudioBuffer.length,
  //           sampleRate: newAudioBuffer.sampleRate,
  //         });

  //         const bufferSource = offlineContext.createBufferSource();
  //         bufferSource.buffer = newAudioBuffer;
  //         bufferSource.connect(offlineContext.destination);
  //         bufferSource.start();

  //         const renderedBuffer = await offlineContext.startRendering();
  //         const audioArrayBuffer = renderedBuffer.getChannelData(0).buffer;
  //         const audioBlob = new Blob(
  //           [audioArrayBuffer.slice(0) as ArrayBuffer],
  //           {
  //             type: "audio/wav",
  //           }
  //         );
  //         wavesurferRef.current.loadBlob(audioBlob);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error during audio split operation:", error);
  //     alert("An error occurred while splitting the audio. Please try again.");
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // Handle trimming a video segment
  const handleTrimVideoSegment = async (
    id: string,
    newStart: number,
    newEnd: number
  ) => {
    // Save current state to history
    setHistory((prevHistory) => [
      ...prevHistory,
      { video: videoSegments, audio: audioSegments },
    ]);

    setVideoSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id
          ? { ...segment, start: newStart, end: newEnd }
          : segment
      )
    );

    // Ensure FFmpeg is loaded
    await loadFFmpeg();

    // Use FFmpeg to trim the video
    if (videoRef.current && videoRef.current.src) {
      const videoUrl = videoRef.current.src;
      const videoBlob = await fetch(videoUrl).then((res) => res.blob());
      const videoFile = new File([videoBlob], "input.mp4", {
        type: "video/mp4",
      });

      ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));

      await ffmpeg.run(
        "-i",
        "input.mp4",
        "-ss",
        `${newStart}`,
        "-to",
        `${newEnd}`,
        "-c",
        "copy",
        "output.mp4"
      );

      const outputData = ffmpeg.FS("readFile", "output.mp4");
      const outputBuffer =
        outputData.buffer instanceof ArrayBuffer
          ? outputData.buffer
          : outputData.buffer.slice(0);
      const outputBlob = new Blob(
        [
          outputBuffer instanceof ArrayBuffer
            ? outputBuffer
            : new Uint8Array(outputBuffer),
        ],
        { type: "video/mp4" }
      );
      const outputUrl = URL.createObjectURL(outputBlob);

      // Update the video source with the trimmed video
      videoRef.current.src = outputUrl;
    }
  };

  // Handle trimming an audio segment
  const handleTrimAudioSegment = async (
    id: string,
    newStart: number,
    newEnd: number
  ) => {
    // Save current state to history
    setHistory((prevHistory) => [
      ...prevHistory,
      { video: videoSegments, audio: audioSegments },
    ]);

    setAudioSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id
          ? { ...segment, start: newStart, end: newEnd }
          : segment
      )
    );

    // Use WaveSurfer to trim the audio
    if (wavesurferRef.current) {
      const audioBuffer = wavesurferRef.current.getDecodedData();
      if (audioBuffer) {
        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = audioBuffer.getChannelData(1);

        const startIndex = Math.floor(
          (newStart / audioDuration) * leftChannel.length
        );
        const endIndex = Math.floor(
          (newEnd / audioDuration) * leftChannel.length
        );

        const leftPart = leftChannel.slice(startIndex, endIndex);
        const rightPart = rightChannel.slice(startIndex, endIndex);

        const newAudioBuffer = new AudioBuffer({
          length: leftPart.length,
          numberOfChannels: 2,
          sampleRate: audioBuffer.sampleRate,
        });

        newAudioBuffer.copyToChannel(leftPart, 0);
        newAudioBuffer.copyToChannel(rightPart, 1);

        const offlineContext = new OfflineAudioContext({
          length: newAudioBuffer.length,
          sampleRate: newAudioBuffer.sampleRate,
        });

        const bufferSource = offlineContext.createBufferSource();
        bufferSource.buffer = newAudioBuffer;
        bufferSource.connect(offlineContext.destination);
        bufferSource.start();

        const renderedBuffer = await offlineContext.startRendering();
        const audioArrayBuffer = renderedBuffer.getChannelData(0).buffer;
        const audioBlob = new Blob([audioArrayBuffer.slice(0) as ArrayBuffer], {
          type: "audio/wav",
        });
        wavesurferRef.current.loadBlob(audioBlob);
      }
    }
  };

  // Handle removing a video segment
  const handleRemoveVideoSegment = (id: string) => {
    // Save current state to history
    setHistory((prevHistory) => [
      ...prevHistory,
      { video: videoSegments, audio: audioSegments },
    ]);

    setVideoSegments((prevSegments) =>
      prevSegments.filter((segment) => segment.id !== id)
    );
  };

  // Handle removing an audio segment
  const handleRemoveAudioSegment = (id: string) => {
    // Save current state to history
    setHistory((prevHistory) => [
      ...prevHistory,
      { video: videoSegments, audio: audioSegments },
    ]);

    setAudioSegments((prevSegments) =>
      prevSegments.filter((segment) => segment.id !== id)
    );
  };

  // Handle clicking on the video timeline to position the split bar
  const handleVideoTimelineClick = (e: React.MouseEvent) => {
    if (!videoTimelineRef.current) return;

    const rect = videoTimelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const splitTime = (x / rect.width) * videoDuration;

    setVideoSplitBarPosition(splitTime);
    setDraggableSegments({ video: false, audio: false }); // Disable dragging on single click
  };

  const handleVideoTimelineDoubleClick = (e: React.MouseEvent) => {
    if (!videoTimelineRef.current) return;

    const rect = videoTimelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const splitTime = (x / rect.width) * videoDuration;

    setVideoSplitBarPosition(splitTime);
    setDraggableSegments({ video: true, audio: false }); // Enable video dragging on double click
  };

  // Handle clicking on the audio timeline to position the split bar
  const handleAudioTimelineClick = (e: React.MouseEvent) => {
    if (!audioTimelineRef.current) return;

    const rect = audioTimelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const splitTime = (x / rect.width) * audioDuration;

    setAudioSplitBarPosition(splitTime);
  };
  console.log("audio reference:", audioRef);
  return (
    <>
      {/* Video Thumbnails */}
      <div
        className="relative w-full mt-6"
        ref={videoTimelineRef}
        onClick={handleVideoTimelineClick}
        onDoubleClick={handleVideoTimelineDoubleClick}
      >
        <DndContext
          sensors={useSensors(
            useSensor(PointerSensor, {
              activationConstraint: {
                distance: draggableSegments.video ? 0 : 9999, // Only activate when draggable
              },
            }),
            useSensor(KeyboardSensor, {
              coordinateGetter: sortableKeyboardCoordinates,
            })
          )}
          collisionDetection={closestCenter}
          onDragStart={() => {
            // Optional: Add any effects when dragging starts
          }}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
              // Save to history before making changes
              setHistory((prevHistory) => [
                ...prevHistory,
                { video: videoSegments, audio: audioSegments },
              ]);

              setVideoSegments((segments) => {
                const oldIndex = segments.findIndex(
                  (segment) => segment.id === active.id
                );
                const newIndex = segments.findIndex(
                  (segment) => segment.id === over.id
                );
                return arrayMove(segments, oldIndex, newIndex);
              });
            }
            // Reset dragging state after operation
            setDraggableSegments({ video: false, audio: false });
          }}
          onDragCancel={() => {
            setDraggableSegments({ video: false, audio: false });
          }}
        >
          <SortableContext
            items={videoSegments}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="flex w-full h-28 overflow-x-auto rounded-xl shadow-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 border border-gray-700 backdrop-blur-md"
              onClick={handleVideoTimelineClick}
              onDoubleClick={handleVideoTimelineDoubleClick}
            >
              {videoSegments.map((segment) => (
                <SortableVideoSegment
                  key={segment.id}
                  id={segment.id}
                  start={segment.start}
                  end={segment.end}
                  thumbnail={thumbnails[segment.id] || ""}
                  duration={videoDuration}
                  onRemove={handleRemoveVideoSegment}
                  onTrim={handleTrimVideoSegment}
                  isDraggable={draggableSegments.video} // Pass draggable state
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Video Split Bar */}
        {videoSplitBarPosition !== null && (
          <div
            className="absolute top-0 h-full w-[3px] bg-red-500 rounded-full cursor-pointer transition-all duration-300 animate-pulse shadow-md"
            style={{
              left: `${(videoSplitBarPosition / videoDuration) * 100}%`,
            }}
          />
        )}
      </div>

      {/* Audio Waveform */}
      <div
        className="relative w-full mt-6"
        ref={audioTimelineRef}
        onClick={handleAudioTimelineClick}
      >
        <DndContext
          sensors={useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
              coordinateGetter: sortableKeyboardCoordinates,
            })
          )}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
              setAudioSegments((segments) => {
                const oldIndex = segments.findIndex(
                  (segment) => segment.id === active.id
                );
                const newIndex = segments.findIndex(
                  (segment) => segment.id === over.id
                );
                return arrayMove(segments, oldIndex, newIndex);
              });
            }
          }}
        >
          <SortableContext
            items={audioSegments}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex w-full h-28 overflow-x-auto rounded-xl shadow-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 border border-gray-700 backdrop-blur-md">
              {audioSegments.map((segment) => (
                <SortableAudioSegment
                  key={segment.id}
                  id={segment.id}
                  start={segment.start}
                  end={segment.end}
                  duration={audioDuration}
                  onRemove={handleRemoveAudioSegment}
                  onTrim={handleTrimAudioSegment}
                  audioSrc={audioRef.current?.src || ""} // Pass the audio source
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div id="waveform" className="w-full h-20 mt-2"></div>

        {/* Audio Split Bar */}
        {audioSplitBarPosition !== null && (
          <div
            className="absolute top-0 h-full w-[3px] bg-red-500 rounded-full cursor-pointer transition-all duration-300 animate-pulse shadow-md"
            style={{
              left: `${(audioSplitBarPosition / audioDuration) * 100}%`,
            }}
          />
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-5 left-1/2 transform z-50 -translate-x-1/2 flex items-center gap-6 bg-opacity-90 backdrop-blur-md p-0.5 rounded-full  border ">
        {/* Video Split Button */}
        <button
          onClick={handleMediaSplit}
          className="flex items-center gap-2 p-2  text-green-600 rounded-full hover:bg-green-600 hover:text-white   transition-all duration-200"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">
            {videoSplitBarPosition !== null
              ? formatTime(videoSplitBarPosition)
              : "Split"}
          </span>
        </button>

        {/* Audio Split Button */}
        {/* <button
          onClick={handleAudioSplit}
          className="flex items-center gap-2 p-2  text-green-600 rounded-full hover:bg-green-600 hover:text-white   transition-all duration-200"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">
            {videoSplitBarPosition !== null
              ? formatTime(videoSplitBarPosition)
              : "Split"}
          </span>
        </button> */}

        {/* Undo Button */}
        <button
          onClick={handleUndo}
          className="flex items-center gap-2 p-2  text-gray-700 rounded-full  hover:bg-gray-600 hover:text-white transition-all duration-200"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 12l6-6M3 12l6 6" />
          </svg>
          <span className="hidden sm:inline">Undo</span>
        </button>

        {/* Confirm Button */}
        <button
          onClick={handleRedo}
          className="flex items-center gap-2 p-2 text-purple-600 rounded-full hover:bg-purple-600 hover:text-white transition-all duration-200"
          disabled={redoStack.length === 0}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12h-6M21 12l-6-6M21 12l-6 6" />
          </svg>
          <span className="hidden sm:inline">Redo</span>
        </button>
      </div>

      {/* Processing Spinner */}
      {isProcessing && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
          <Spinner />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"></canvas>
    </>
  );
}
