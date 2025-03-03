"use client";

import { useState, useEffect, useRef } from "react";
import { formatTime } from "../utils/formatTime";
import WaveSurfer from "wavesurfer.js";
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

interface Segment {
  id: string;
  start: number;
  end: number;
}

interface TrimToolsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  startTrim: number;
  endTrim: number;
  setStartTrim: (value: number) => void;
  setEndTrim: (value: number) => void;
  videoDuration: number;
  audioDuration: number;
  isDragging: "start" | "end" | null;
  setIsDragging: (value: "start" | "end" | null) => void;
  tooltipPosition: { x: number; y: number };
  setTooltipPosition: (value: { x: number; y: number }) => void;
  tooltipTime: number;
  setTooltipTime: (value: number) => void;
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
}: {
  id: string;
  start: number;
  end: number;
  thumbnail: string;
  videoDuration: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "pointer",
  };

  console.log(`Rendering segment: ${id}`); // Debugging

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: `${((end - start) / videoDuration) * 100}%`,
        marginRight: "10px",
        backgroundImage: `url(${thumbnail})`,
      }}
      className="flex-shrink-0 h-20 bg-cover bg-center relative"
    >
      {/* Drag Handle (Only this area will trigger drag events) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0"
        style={{ cursor: "grab" }}
      />

      {/* Remove Icon (X) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering drag events
          e.preventDefault(); // Prevent default behavior
          console.log("X button clicked for segment:", id); // Debugging
          onRemove(id); // Call the onRemove callback
        }}
        onMouseDown={(e) => {
          e.stopPropagation(); // Prevent drag from starting
          e.preventDefault(); // Prevent default behavior
        }}
        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:bg-red-600"
        style={{ zIndex: 1000, pointerEvents: "auto" }} // Ensure the button is clickable
      >
        ×
      </button>

      {/* Time Display */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center text-sm p-1">
        {formatTime(start)} - {formatTime(end)}
      </div>
    </div>
  );
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
  const [segments, setSegments] = useState<Segment[]>([
    { id: "segment-1", start: 0, end: videoDuration },
  ]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [splitBarPosition, setSplitBarPosition] = useState<number | null>(null);
  const [isSplitBarVisible, setIsSplitBarVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);

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

  // Update current time
  useEffect(() => {
    if (!videoRef.current) return;

    const updateTime = () => {
      setCurrentTime(videoRef.current!.currentTime);
    };

    videoRef.current.addEventListener("timeupdate", updateTime);
    return () =>
      videoRef.current!.removeEventListener("timeupdate", updateTime);
  }, [videoRef]);

  // Handle splitting the video/audio
  const handleSplit = () => {
    if (splitBarPosition === null) return;

    const newSegmentId = `segment-${segments.length + 1}`;
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
    setIsSplitBarVisible(false);
    setSplitBarPosition(null);
  };

  // Handle reordering segments with @dnd-kit/core
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
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
  };

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
        let newTime = startTrim;

        segments.forEach((segment) => {
          if (startTrim >= segment.start && startTrim < segment.end) {
            newTime = segment.end;
          }
        });

        videoRef.current.currentTime = newTime;
        waveSurfer.seekTo(newTime / audioDuration);
        videoRef.current.play();
        waveSurfer.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.ontimeupdate = () => {
        const currentTime = videoRef.current!.currentTime;
        let shouldStop = true;

        segments.forEach((segment) => {
          if (currentTime >= segment.start && currentTime < segment.end) {
            shouldStop = false;
          }
        });

        if (shouldStop) {
          videoRef.current!.pause();
          setIsPlaying(false);
        }
      };
    }

    if (waveSurfer) {
      waveSurfer.on("audioprocess", () => {
        const currentTime = waveSurfer.getCurrentTime();
        let shouldStop = true;

        segments.forEach((segment) => {
          if (currentTime >= segment.start && currentTime < segment.end) {
            shouldStop = false;
          }
        });

        if (shouldStop) {
          waveSurfer.pause();
          setIsPlaying(false);
        }
      });
    }
  }, [segments, videoRef, waveSurfer, audioDuration]);

  // Handle clicking on the timeline to position the split bar
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || !isSplitBarVisible) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = getActiveDuration();
    const splitTime = (x / rect.width) * duration;

    setSplitBarPosition(splitTime);
  };

  // Function to handle segment removal
// Function to handle segment removal
const handleRemoveSegment = (id: string) => {
  console.log("Removing segment:", id); // Debugging
  setSegments((prevSegments) => {
    const updatedSegments = prevSegments.filter((segment) => segment.id !== id);
    console.log("Updated segments:", updatedSegments); // Debugging
    return updatedSegments;
  });
};

  return (
    <>
      {/* Video Thumbnails */}
      {trimMode !== "audio" && (
        <div
          className="relative w-full mt-4"
          ref={timelineRef}
          onClick={handleTimelineClick}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={segments}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex w-full h-20 overflow-x-auto rounded-lg shadow-lg">
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
                    onRemove={handleRemoveSegment} // Pass the onRemove function
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Split Bar */}
          {isSplitBarVisible && splitBarPosition !== null && (
            <div
              className="absolute top-0 h-full w-1 bg-red-500 cursor-pointer"
              style={{
                left: `${(splitBarPosition / getActiveDuration()) * 100}%`,
              }}
            ></div>
          )}

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
            className="absolute top-0 h-[100px] bg-blue-500 opacity-50 cursor-ew-resize"
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

      {/* Split Bar Activation Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => setIsSplitBarVisible(!isSplitBarVisible)}
          className="p-2 bg-blue-500 text-white rounded-full"
        >
          {isSplitBarVisible ? "Hide Split Bar" : "Show Split Bar"}
        </button>
      </div>

      {isSplitBarVisible && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleSplit}
            className="p-2 bg-green-500 text-white rounded-full"
          >
            Split at{" "}
            {splitBarPosition !== null
              ? formatTime(splitBarPosition)
              : "Selected Position"}
          </button>
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