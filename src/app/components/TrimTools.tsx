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

// Draggable Segment Component
function SortableSegment({
  id,
  start,
  end,
  thumbnail,
  videoDuration,
  onRemove,
  onTrim,
}: {
  id: string;
  start: number;
  end: number;
  thumbnail: string;
  videoDuration: number;
  onRemove: (id: string) => void;
  onTrim: (id: string, newStart: number, newEnd: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "pointer",
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
          onTrim(id, Math.min(newTime, end - 0.1), end); // Ensure start < end
        } else if (isDraggingRight) {
          onTrim(id, start, Math.max(newTime, start + 0.1)); // Ensure end > start
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
        width: `${((end - start) / videoDuration) * 100}%`,
        marginRight: "10px",
        backgroundImage: `url(${thumbnail})`,
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        transition: "transform 0.2s ease-in-out",
      }}
      className="flex-shrink-0 h-20 bg-cover bg-center relative "
    >
      {/* Dragging Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0"
        style={{ cursor: "grab" }}
      />

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
        className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-600 transition-all"
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
        className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-600 transition-all"
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

export default function TrimTools({
  videoRef,
  audioRef,
  videoDuration,
  audioDuration,
  trimMode,
  setTrimMode,
}: TrimToolsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [segments, setSegments] = useState<Segment[]>([
    { id: uuidv4(), start: 0, end: videoDuration },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitBarPosition, setSplitBarPosition] = useState<number | null>(null);
  const [history, setHistory] = useState<Segment[][]>([]); // History stack for undo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Ensure FFmpeg is loaded
  useEffect(() => {
    loadFFmpeg();
  }, []);

  // Generate Thumbnails
  useEffect(() => {
    const generateThumbnails = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const thumbnailCount = 10; // Number of thumbnails to generate
      const thumbnails: string[] = [];

      for (let i = 0; i < thumbnailCount; i++) {
        const time = (i / thumbnailCount) * videoDuration;
        video.currentTime = time;

        await new Promise((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL("image/jpeg");
            thumbnails.push(thumbnail);
            resolve(null);
          };
        });
      }

      setThumbnails(thumbnails);
    };

    generateThumbnails();
  }, [videoRef, videoDuration]);

  // Handle undo action
  const handleUndo = () => {
    if (history.length > 0) {
      const previousSegments = history[history.length - 1];
      setSegments(previousSegments);
      setHistory((prevHistory) => prevHistory.slice(0, -1)); // Remove the last state from history
    }
  };

  // Handle confirm action
  const handleConfirm = () => {
    // Implement confirm logic here
    console.log("Confirm action triggered");
  };

  // Handle splitting the video/audio
  const handleSplit = async () => {
    if (splitBarPosition === null) return;

    setIsProcessing(true);

    // Save current state to history
    setHistory((prevHistory) => [...prevHistory, segments]);

    // Ensure FFmpeg is loaded
    await loadFFmpeg();

    // Split logic
    const newSegmentId = uuidv4();
    const newSegment: Segment = {
      id: newSegmentId,
      start: splitBarPosition,
      end: videoDuration,
    };

    const updatedSegments = segments.map((segment) => {
      if (segment.end > splitBarPosition) {
        return { ...segment, end: splitBarPosition };
      }
      return segment;
    });

    setSegments([...updatedSegments, newSegment]);
    setSplitBarPosition(null);

    // Use FFmpeg to split the video/audio
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
        `${splitBarPosition}`,
        "-to",
        `${videoDuration}`,
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

      // Update the video source with the new split video
      videoRef.current.src = outputUrl;
    }

    setIsProcessing(false);
  };

  // Handle trimming a segment
  const handleTrimSegment = async (
    id: string,
    newStart: number,
    newEnd: number
  ) => {
    // Save current state to history
    setHistory((prevHistory) => [...prevHistory, segments]);

    setSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id
          ? { ...segment, start: newStart, end: newEnd }
          : segment
      )
    );

    // Ensure FFmpeg is loaded
    await loadFFmpeg();

    // Use FFmpeg to trim the video/audio
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

  // Handle removing a segment
  const handleRemoveSegment = (id: string) => {
    // Save current state to history
    setHistory((prevHistory) => [...prevHistory, segments]);

    setSegments((prevSegments) =>
      prevSegments.filter((segment) => segment.id !== id)
    );
  };

  // Handle clicking on the timeline to position the split bar
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = trimMode === "audio" ? audioDuration : videoDuration;
    const splitTime = (x / rect.width) * duration;

    setSplitBarPosition(splitTime);
  };

  return (
    <>
      {/* Video Thumbnails */}
      {trimMode !== "audio" && (
        <div
          className="relative w-full mt-6"
          ref={timelineRef}
          onClick={handleTimelineClick}
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
                setSegments((segments) => {
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
              items={segments}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex w-full h-28 overflow-x-auto rounded-xl shadow-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 border border-gray-700 backdrop-blur-md">
                {segments.map((segment) => (
                  <SortableSegment
                    key={segment.id}
                    id={segment.id}
                    start={segment.start}
                    end={segment.end}
                    thumbnail={
                      thumbnails[
                        Math.floor(
                          (segment.start / videoDuration) * thumbnails.length
                        )
                      ]
                    }
                    videoDuration={videoDuration}
                    onRemove={handleRemoveSegment}
                    onTrim={handleTrimSegment}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Split Bar */}
          {splitBarPosition !== null && (
            <div
              className="absolute top-0 h-full w-[3px] bg-red-500 rounded-full cursor-pointer transition-all duration-300 animate-pulse shadow-md"
              style={{
                left: `${(splitBarPosition / videoDuration) * 100}%`,
              }}
            />
          )}
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-opacity-90 backdrop-blur-md p-0.5 rounded-full shadow-xl border ">
        {/* Split Button */}
        <button
          onClick={handleSplit}
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
            {splitBarPosition !== null ? formatTime(splitBarPosition) : "Split"}
          </span>
        </button>

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
          onClick={handleConfirm}
          className="flex items-center gap-2 p-2  text-blue-500 rounded-full  hover:bg-blue-600 hover:text-white transition-all duration-200"
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
            <path d="M5 12l5 5L19 7" />
          </svg>
          <span className="hidden sm:inline">Confirm</span>
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
