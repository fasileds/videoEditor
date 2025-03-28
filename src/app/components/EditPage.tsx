"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import {
  DndContext,
  useDraggable,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"; // Import DndContext and useDraggable
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

// Draggable Text Overlay Component
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
    position: "absolute", // Explicitly set to "absolute"
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
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle adding text overlay
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
      endTime: (videoRef.current?.currentTime || 0) + 5, // Default 5 seconds duration
      id: Math.random().toString(36).substring(7),
    };
    setTextOverlays([...textOverlays, newTextOverlay]);
    setIsOpen(false);
  };

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

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setVideos([...videos, reader.result]);
          setVideo(reader.result); // Set the uploaded video as the main video
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
      id: Math.random().toString(36).substring(7), // Generate a unique ID
    };
    setAddedComponents([...addedComponents, newComponent]);

    // Set the video as the main video if it's a video component
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
                          disabled={!video || isLoading} // Disable button if no video is loaded or while loading
                        >
                          {isLoading ? (
                            <ClipLoader color="#ffffff" size={20} /> // Show spinner while loading
                          ) : (
                            "Download Trimmed Video"
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
