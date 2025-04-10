"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
<<<<<<< HEAD
=======
import {
  DndContext,
  useDraggable,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"; // Import DndContext and useDraggable
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
import {
  ScissorsIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  SparklesIcon,
  PlayIcon,
  VideoCameraIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Header from "../components/Header";
import { formatTime } from "../utils/formatTime";
import TrimTools from "./TrimTools";
import TextEditorModal from "./TextEditorModal";
import { ClipLoader } from "react-spinners";
<<<<<<< HEAD
import { DndContext, DragEndEvent, useDraggable } from "@dnd-kit/core";
import { Rnd } from "react-rnd";
=======

>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
interface EditPageProps {
  videoUrl: string | null;
}

interface TextOverlay {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  startTime: number;
  endTime: number;
  id: string;
}

<<<<<<< HEAD
=======
// Draggable Text Overlay Component
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
function DraggableTextOverlay({
  id,
  text,
  x,
  y,
  color,
  fontSize,
  onDragEnd,
}: TextOverlay & { onDragEnd: (id: string, x: number, y: number) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
<<<<<<< HEAD
    position: "absolute",
=======
    position: "absolute", // Explicitly set to "absolute"
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
    left: x,
    top: y,
    color,
    fontSize: `${fontSize}px`,
    cursor: "move",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {text}
    </div>
  );
}

export default function EditPage({ videoUrl }: EditPageProps) {
  const [video, setVideo] = useState<string | null>(videoUrl);
  const [showTrimTools, setShowTrimTools] = useState(false);
  const [startTrim, setStartTrim] = useState(0);
  const [endTrim, setEndTrim] = useState(100);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipTime, setTooltipTime] = useState<string>("");
  const [isTrimmed, setIsTrimmed] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<
    "video" | "audio" | "text" | null
  >(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [videos, setVideos] = useState<string[]>([]);
  const [audios, setAudios] = useState<string[]>([]);
  const [texts, setTexts] = useState<string[]>([]);
  const [addedComponents, setAddedComponents] = useState<
    { type: "video" | "audio" | "text"; src: string; id: string }[]
  >([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trimMode, setTrimMode] = useState<"both" | "video" | "audio">("video");
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
<<<<<<< HEAD
  const [zoomBox, setZoomBox] = useState({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });

  const [zoomStartTime, setZoomStartTime] = useState(2); // in seconds
  const [zoomEndTime, setZoomEndTime] = useState(6); // in seconds
  const [targetZoomLevel, setTargetZoomLevel] = useState(2); // 2x zoom
  const [videoWidth, setVideoWidth] = useState(960);
  const [videoHeight, setVideoHeight] = useState(540);
  const [showZoomTool, setShowZoomTool] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const t = video.currentTime;
      if (t >= zoomStartTime && t <= zoomEndTime) {
        const progress = (t - zoomStartTime) / (zoomEndTime - zoomStartTime);
        const eased = easeInOutCubic(progress);
        setZoomLevel(1 + (2 - 1) * eased); // zoom to 2x smoothly
      } else {
        setZoomLevel(1);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [zoomStartTime, zoomEndTime]);

  // Handle mouse wheel event for zooming
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const delta = event.deltaY;
        const zoomFactor = 0.1;

        setZoomLevel((prevZoom) => {
          let newZoom = prevZoom - delta * zoomFactor * 0.01;
          newZoom = Math.max(0.5, Math.min(3, newZoom));
          return newZoom;
        });
      }
    };

    const videoContainer = videoContainerRef.current;
    if (videoContainer) {
      videoContainer.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (videoContainer) {
        videoContainer.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

=======
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle adding text overlay
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
  const handleAddTextOverlay = (
    text: string,
    style: CSSProperties,
    x: number,
    y: number
  ) => {
    const newTextOverlay: TextOverlay = {
      text,
      x,
      y,
      color: style.color || "black",
      fontSize: parseInt(style.fontSize?.toString() || "16", 10),
      startTime: videoRef.current?.currentTime || 0,
<<<<<<< HEAD
      endTime: (videoRef.current?.currentTime || 0) + 5,
=======
      endTime: (videoRef.current?.currentTime || 0) + 5, // Default 5 seconds duration
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
      id: Math.random().toString(36).substring(7),
    };
    setTextOverlays([...textOverlays, newTextOverlay]);
    setIsOpen(false);
  };

<<<<<<< HEAD
=======
  // Handle updating text overlay position
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;

    setTextOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id
          ? { ...overlay, x: overlay.x + delta.x, y: overlay.y + delta.y }
          : overlay
      )
    );
  };

>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setVideos([...videos, reader.result]);
          setVideo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle audio upload
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAudios([...audios, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding text
  const handleAddText = () => {
    setIsOpen(true);
  };

  // Handle adding components
  const handleAddComponent = (
    type: "video" | "audio" | "text",
    src: string
  ) => {
    const newComponent = {
      type,
      src,
      id: Math.random().toString(36).substring(7),
    };
    setAddedComponents([...addedComponents, newComponent]);

    if (type === "video") {
      setVideo(src);
    }
  };

  // Handle removing components
  const handleRemoveComponent = (id: string) => {
    setAddedComponents(addedComponents.filter((comp) => comp.id !== id));
  };

  // Handle trimming
  const handleDone = () => {
    if (videoRef.current) {
      setIsTrimmed(true);
      const startTime = (startTrim / 100) * videoDuration;
      const endTime = (endTrim / 100) * videoDuration;

      videoRef.current.currentTime = startTime;

      videoRef.current.onplay = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = startTime;
        }
      };

      videoRef.current.ontimeupdate = () => {
        if (videoRef.current && videoRef.current.currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
      };
    }
  };

<<<<<<< HEAD
  // Sharpen image using convolution
  const sharpenImage = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data.length);
    const width = imageData.width;
    const height = imageData.height;

    const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = x + kx;
            const py = y + ky;
            const index = (py * width + px) * 4;
            const k = kernel[(ky + 1) * 3 + (kx + 1)];
            r += data[index] * k;
            g += data[index + 1] * k;
            b += data[index + 2] * k;
          }
        }

        const i = (y * width + x) * 4;
        output[i] = Math.min(Math.max(r, 0), 255);
        output[i + 1] = Math.min(Math.max(g, 0), 255);
        output[i + 2] = Math.min(Math.max(b, 0), 255);
        output[i + 3] = data[i + 3];
      }
    }

    ctx.putImageData(new ImageData(output, width, height), 0, 0);
  };
  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Handle downloading trimmed video with all effects
  const handleDownload = async () => {
    if (!videoRef.current) {
      console.error("Video reference not found");
      return;
    }

    setIsLoading(true);
    console.log("Starting video processing...");

    try {
      const startTime = (startTrim / 100) * videoDuration;
      const endTime = (endTrim / 100) * videoDuration;
      console.log(`Trimming from ${startTime}s to ${endTime}s`);

      // Create temporary video element
      const video = document.createElement("video");
      video.src = videoRef.current.src;
      video.currentTime = startTime;
      video.muted = true; // Ensure video plays without audio issues
      document.body.appendChild(video); // Required for some browsers

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video loading timed out"));
        }, 5000);

        video.onloadeddata = () => {
          clearTimeout(timeout);
          resolve();
        };

        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Video loading failed"));
        };
      });

      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas dimensions (accounting for zoom)
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

      // Setup media recorder
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      const chunks: Blob[] = [];
      let recordingFailed = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        recordingFailed = true;
        mediaRecorder.stop();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Frame rendering function
      const drawFrame = () => {
        if (video.currentTime >= endTime || recordingFailed) {
          console.log("Stopping recording");
          mediaRecorder.stop();
          return;
        }

        try {
          // Clear and draw video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const currentTime = video.currentTime;

          // Transition-based zoom scale
          let zoomScale = 1;
          if (currentTime >= zoomStartTime && currentTime <= zoomEndTime) {
            const progress =
              (currentTime - zoomStartTime) / (zoomEndTime - zoomStartTime);
            zoomScale = 1 + (targetZoomLevel - 1) * easeInOutCubic(progress);
          }

          // Compute center of zoom box
          const zoomCenterX = zoomBox.x + zoomBox.width / 2;
          const zoomCenterY = zoomBox.y + zoomBox.height / 2;

          ctx.save();

          // Translate to zoom center, apply scale, translate back
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(zoomScale, zoomScale);
          ctx.translate(-zoomCenterX, -zoomCenterY);

          // Draw full video (zooming happens virtually through scale)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          ctx.restore();

          // Apply effects
          sharpenImage(canvas, ctx);

          // Draw text overlays (with error handling)

          textOverlays.forEach((overlay) => {
            try {
              if (
                currentTime >= overlay.startTime &&
                currentTime <= overlay.endTime
              ) {
                ctx.fillStyle = overlay.color;
                ctx.font = `${
                  overlay.fontSize * zoomLevel
                }px Arial, sans-serif`;
                ctx.textBaseline = "top";
                ctx.fillText(
                  overlay.text,
                  overlay.x * zoomLevel,
                  overlay.y * zoomLevel
                );

                // Debug visualization (remove in production)
                ctx.strokeStyle = "rgba(255,0,0,0.3)";
                ctx.strokeRect(
                  overlay.x * zoomLevel,
                  overlay.y * zoomLevel,
                  ctx.measureText(overlay.text).width,
                  overlay.fontSize * zoomLevel
                );
              }
            } catch (textError) {
              console.warn(
                `Error rendering text "${overlay.text}":`,
                textError
              );
            }
          });

          // Continue processing
          requestAnimationFrame(drawFrame);
        } catch (frameError) {
          console.error("Frame rendering error:", frameError);
          recordingFailed = true;
          mediaRecorder.stop();
        }
      };

      // Start processing when video plays
      video.onplay = () => {
        console.log("Video playback started");
        drawFrame();
      };

      // Handle recording completion
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          console.log("Recording stopped");
          resolve();
        };

        // Start playback
        video.play().catch((e) => {
          console.error("Video play failed:", e);
          recordingFailed = true;
          mediaRecorder.stop();
        });
      });

      // Final output
      if (!recordingFailed && chunks.length > 0) {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `edited-video-${new Date().getTime()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        console.log("Download initiated");
      } else {
        throw new Error("Recording failed - no data available");
      }
    } catch (error) {
      console.error("Video processing failed:", error);
      alert(
        `Error processing video: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
      // Clean up temporary elements
      document.querySelectorAll("video").forEach((el) => {
        if (el !== videoRef.current) el.remove();
      });
    }
=======
  // Handle downloading trimmed video
  const handleDownload = async () => {
    console.log(videoRef.current?.src); // Log the video source
    if (!videoRef.current || !videoRef.current.src) {
      console.error("Video reference or source is not available.");
      alert("Please ensure a video is loaded before downloading.");
      return;
    }

    setIsLoading(true); // Show spinner

    const startTime = (startTrim / 100) * videoDuration;
    const endTime = (endTrim / 100) * videoDuration;

    // Create a new video element for processing
    const video = document.createElement("video");
    video.src = videoRef.current.src; // Set the source from videoRef.current
    video.currentTime = startTime;
    video.muted = true; // Mute the video to avoid permission issues

    // Wait for the video to load its metadata
    await new Promise((resolve) => {
      video.onloadeddata = resolve;
    });

    // Now the video is fully loaded, and we can access its properties
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Canvas context is not available.");
      setIsLoading(false); // Hide spinner on error
      return;
    }

    // Set canvas dimensions based on the video's original dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const stream = canvas.captureStream();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9", // Use a supported MIME type
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trimmed-video.webm";
      a.click();
      URL.revokeObjectURL(url);

      setIsLoading(false); // Hide spinner after download is complete
    };

    mediaRecorder.start();

    const drawFrame = () => {
      if (video.currentTime >= endTime) {
        mediaRecorder.stop();
        return;
      }

      // Clear the canvas before drawing the new frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw text overlays
      textOverlays.forEach((overlay) => {
        if (
          video.currentTime >= overlay.startTime &&
          video.currentTime <= overlay.endTime
        ) {
          ctx.fillStyle = overlay.color;
          ctx.font = `${overlay.fontSize}px Arial`;
          ctx.fillText(overlay.text, overlay.x, overlay.y);
        }
      });

      requestAnimationFrame(drawFrame);
    };

    video.play();
    drawFrame();
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
  };
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, []);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;

    setTextOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id
          ? { ...overlay, x: overlay.x + delta.x, y: overlay.y + delta.y }
          : overlay
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 font-[family-name:var(--font-geist-sans)]">
      <Header />
      <main className="sm:px-6 lg:px-2 py-2 h-[100%]">
        <div className="flex gap-2 h-auto">
          {/* Left Sidebar for Icons */}
          <div className="flex flex-1 h-auto">
            {/* Sidebar with buttons */}
            <div className="w-16 ml-0 h-auto">
              <div className="bg-white rounded-lg p-2 h-full flex flex-col">
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setActiveSidebar(
                        activeSidebar === "video" ? null : "video"
                      )
                    }
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveSidebar(
                        activeSidebar === "audio" ? null : "audio"
                      )
                    }
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <MusicalNoteIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveSidebar(activeSidebar === "text" ? null : "text")
                    }
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowTrimTools(!showTrimTools)}
                    className="flex items-center justify-center p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <ScissorsIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowZoomTool(!showZoomTool)}
                    className={`flex items-center justify-center p-2 bg-gradient-to-r ${
                      showZoomTool
                        ? "from-yellow-500 to-yellow-600"
                        : "from-gray-300 to-gray-400"
                    } text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2`}
                  >
                    <SparklesIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Vertical Line Separator */}
            {activeSidebar && (
              <div className="border-l border-gray-300 h-full"></div>
            )}

            {/* Active Sidebar Content */}
            {activeSidebar && (
              <div className="w-[300px] h-full">
                <div className="bg-white rounded-lg p-6 h-full overflow-y-auto">
                  {activeSidebar === "video" && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <VideoCameraIcon className="w-6 h-6 text-blue-600" />
                        <span>Video</span>
                      </h2>
                      <div className="space-y-4">
                        <input
                          type="file"
                          className="hidden"
                          id="video-upload"
                          accept="video/*"
                          onChange={handleVideoUpload}
                        />
                        <label
                          htmlFor="video-upload"
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <span>Add Video</span>
                        </label>
                        {videos.map((video, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 p-4 rounded-lg relative"
                          >
                            <video
                              ref={videoRef}
                              src={video}
                              controls
<<<<<<< HEAD
                              className="w-full h-auto"
=======
                              crossOrigin="anonymous"
                              className="w-full rounded-lg"
                              muted
                              autoPlay
                              onLoadedMetadata={() => {
                                if (videoRef.current) {
                                  setVideoDuration(
                                    videoRef.current.duration || 0
                                  );
                                }
                              }}
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
                            />
                            <button
                              onClick={() => handleAddComponent("video", video)}
                              className="absolute bottom-2 right-2 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {activeSidebar === "audio" && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <MusicalNoteIcon className="w-6 h-6 text-green-600" />
                        <span>Audio</span>
                      </h2>
                      <div className="space-y-4">
                        <input
                          type="file"
                          className="hidden"
                          id="audio-upload"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                        />
                        <label
                          htmlFor="audio-upload"
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          <span>Add Audio</span>
                        </label>
                        {audios.map((audio, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 p-4 rounded-lg relative"
                          >
                            <audio
                              ref={index === 0 ? audioRef : null}
                              src={audio}
                              controls
                              className="w-full"
                            />
                            <button
                              onClick={() => handleAddComponent("audio", audio)}
                              className="absolute bottom-2 right-2 bg-green-600 text-white p-1 rounded-full hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {activeSidebar === "text" && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                        <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                        <span>Text</span>
                      </h2>
                      <div className="space-y-4">
                        <button
                          onClick={handleAddText}
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                          <span>Add Text</span>
                        </button>
                        {textOverlays.map((text, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 p-4 rounded-lg relative"
                          >
                            <p className="text-gray-700">{text.text}</p>
                            <button
                              onClick={() =>
                                handleAddComponent("text", text.text)
                              }
                              className="absolute bottom-2 right-2 bg-purple-600 text-white p-1 rounded-full hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-4 w-full">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ScissorsIcon className="w-6 h-6 text-blue-600" />
                <span>Edit Your Video</span>
              </h2>
              <div
                ref={videoContainerRef}
                className="bg-gray-100 mt-10 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] overflow-hidden relative"
              >
                {video ? (
                  <>
<<<<<<< HEAD
                    <div className="relative w-full h-full">
                      <div className="relative w-full max-w-[960px] mx-auto">
                        {/* Base full video (unchanged) */}
                        <video
                          ref={videoRef}
                          src={video}
                          controls
                          autoPlay
                          muted
                          crossOrigin="anonymous"
                          className="w-full h-auto block"
                          onLoadedMetadata={() => {
                            if (videoRef.current) {
                              setVideoDuration(videoRef.current.duration || 0);
                            }
                          }}
                        />

                        {/* Zoom box (visual only) */}
                        {showZoomTool && (
                          <div
                            className="absolute border-2 border-dashed border-red-500 pointer-events-none"
                            style={{
                              top: `${zoomBox.y}px`,
                              left: `${zoomBox.x}px`,
                              width: `${zoomBox.width}px`,
                              height: `${zoomBox.height}px`,
                              zIndex: 5,
                            }}
                          />
                        )}

                        {/* Zoomed video (clipped to red box) */}
                        {showZoomTool && (
                          <video
                            src={video}
                            autoPlay
                            muted
                            playsInline
                            className="absolute"
                            style={{
                              top: `${zoomBox.y}px`,
                              left: `${zoomBox.x}px`,
                              width: `${zoomBox.width}px`,
                              height: `${zoomBox.height}px`,
                              transform: `scale(${zoomLevel})`,
                              transformOrigin: "top left",
                              objectFit: "none", // Do not stretch
                              objectPosition: `-${zoomBox.x}px -${zoomBox.y}px`,
                              transition: "transform 0.2s ease-in-out",
                              zIndex: 10,
                              pointerEvents: "none",
                            }}
                          />
                        )}
                      </div>

                      {showZoomTool && (
                        <Rnd
                          size={{
                            width: zoomBox.width,
                            height: zoomBox.height,
                          }}
                          position={{ x: zoomBox.x, y: zoomBox.y }}
                          onDragStop={(e, d) =>
                            setZoomBox((prev) => ({ ...prev, x: d.x, y: d.y }))
                          }
                          onResizeStop={(
                            e,
                            direction,
                            ref,
                            delta,
                            position
                          ) => {
                            setZoomBox({
                              width: parseInt(ref.style.width),
                              height: parseInt(ref.style.height),
                              x: position.x,
                              y: position.y,
                            });
                          }}
                          bounds="parent"
                          style={{
                            border: "2px dashed red",
                            position: "absolute",
                            zIndex: 20,
                            pointerEvents: "auto",
                          }}
                        />
                      )}
                      <DndContext onDragEnd={handleDragEnd}>
                        {textOverlays.map((overlay) => (
                          <DraggableTextOverlay
                            key={overlay.id}
                            {...overlay}
                            onDragEnd={(id, x, y) => {
                              setTextOverlays((prev) =>
                                prev.map((o) =>
                                  o.id === id ? { ...o, x, y } : o
                                )
                              );
                            }}
                          />
                        ))}
                      </DndContext>
                    </div>
=======
                    {isCanvasLoading && (
                      <div className="flex items-center justify-center">
                        <ClipLoader color="#000000" size={30} />
                        <span className="ml-2">Loading video...</span>
                      </div>
                    )}
                    {error && (
                      <div className="text-red-500 text-center">
                        <p>{error}</p>
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      src={video}
                      controls
                      crossOrigin="anonymous"
                      className="w-full rounded-lg"
                      muted
                      autoPlay
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          console.log(
                            "Video Metadata Loaded:",
                            videoRef.current.duration
                          );
                          setVideoDuration(videoRef.current.duration || 0);
                        }
                      }}
                      onError={(e) => {
                        console.error("Error loading video:", e);
                        setError(
                          "Error loading video. Please check the file and try again."
                        );
                      }}
                    />
                    {/* Text Overlays */}
                    <DndContext onDragEnd={handleDragEnd}>
                      {textOverlays.map((overlay) => (
                        <DraggableTextOverlay
                          key={overlay.id}
                          {...overlay}
                          onDragEnd={(id, x, y) => {
                            setTextOverlays((prev) =>
                              prev.map((o) =>
                                o.id === id ? { ...o, x, y } : o
                              )
                            );
                          }}
                        />
                      ))}
                    </DndContext>
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
                    {showTrimTools && (
                      <TrimTools
                        videoRef={videoRef}
                        audioRef={audioRef}
                        startTrim={startTrim}
                        endTrim={endTrim}
                        setStartTrim={setStartTrim}
                        setEndTrim={setEndTrim}
                        videoDuration={videoDuration}
                        audioDuration={audioDuration}
                        isDragging={isDragging}
                        setIsDragging={setIsDragging}
                        tooltipPosition={tooltipPosition}
                        setTooltipPosition={setTooltipPosition}
                        tooltipTime={tooltipTime}
                        setTooltipTime={setTooltipTime}
                        trimMode={trimMode}
                        setTrimMode={setTrimMode}
                      />
                    )}
                    {showTrimTools && (
                      <>
                        <button
                          onClick={handleDone}
                          className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
                        >
                          Done
                        </button>
                        <button
                          onClick={handleDownload}
                          className="mt-4 ml-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
<<<<<<< HEAD
                          disabled={isLoading}
=======
                          disabled={!video || isLoading} // Disable button if no video is loaded or while loading
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
                        >
                          {isLoading ? (
                            <ClipLoader color="#ffffff" size={20} />
                          ) : (
<<<<<<< HEAD
                            "Download Edited Video"
=======
                            "Download Trimmed Video"
>>>>>>> f1fe9d9c769f804b2deada20c6880cc0cc88529b
                          )}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <PlayIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">
                      Add a video from the sidebar to start editing
                    </p>
                  </div>
                )}
              </div>

              {/* Display Added Components */}
              <div className="mt-6 space-y-4">
                {addedComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="bg-gray-100 p-4 rounded-lg relative"
                  >
                    {comp.type === "video" && (
                      <video
                        src={comp.src}
                        controls
                        className="w-full rounded-lg"
                      />
                    )}
                    {comp.type === "audio" && (
                      <div className="text-gray-700">Audio File</div>
                    )}
                    {comp.type === "text" && (
                      <p className="text-gray-700">{comp.src}</p>
                    )}
                    <button
                      onClick={() => handleRemoveComponent(comp.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow-sm mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
          <p className="text-gray-600">© 2025 VideoPro. All rights reserved.</p>
        </div>
      </footer>
      {isOpen && (
        <TextEditorModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={(text, style, x, y) => {
            handleAddTextOverlay(text, style, x, y);
          }}
        />
      )}
    </div>
  );
}
