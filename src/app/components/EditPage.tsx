"use client";

import { useState, useRef, useEffect } from "react";
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trimMode, setTrimMode] = useState<"both" | "video" | "audio">("video");
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Handle mouse wheel event for zooming
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault(); // Prevent default scrolling behavior
        const delta = event.deltaY;
        const zoomFactor = 0.1; // Adjust zoom speed

        setZoomLevel((prevZoom) => {
          let newZoom = prevZoom - delta * zoomFactor * 0.01;
          newZoom = Math.max(0.5, Math.min(3, newZoom)); // Clamp zoom level between 0.5x and 3x
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const drawVideoFrame = () => {
      if (
        videoRef.current &&
        ctx &&
        canvas &&
        !videoRef.current.paused &&
        !videoRef.current.ended
      ) {
        canvas.width = videoRef.current.videoWidth * zoomLevel;
        canvas.height = videoRef.current.videoHeight * zoomLevel;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        sharpenImage(canvas, ctx);
        requestAnimationFrame(drawVideoFrame);
      }
    };

    if (videoRef.current) {
      videoRef.current.onplay = () => {
        drawVideoFrame();
      };
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.onplay = null;
      }
    };
  }, [zoomLevel]);

  const sharpenImage = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
    const kernelSum = kernel.reduce((a, b) => a + b, 0);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (x + kx + (y + ky) * width) * 4;
            r += data[pixelIndex] * kernel[kx + 1 + (ky + 1) * 3];
            g += data[pixelIndex + 1] * kernel[kx + 1 + (ky + 1) * 3];
            b += data[pixelIndex + 2] * kernel[kx + 1 + (ky + 1) * 3];
          }
        }
        const index = (x + y * width) * 4;
        data[index] = Math.min(Math.max(r / kernelSum, 0), 255);
        data[index + 1] = Math.min(Math.max(g / kernelSum, 0), 255);
        data[index + 2] = Math.min(Math.max(b / kernelSum, 0), 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // Sharpen image using convolution

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
    if (videoRef.current) {
      setIsLoading(true); // Show spinner

      const startTime = (startTrim / 100) * videoDuration;
      const endTime = (endTrim / 100) * videoDuration;

      const video = document.createElement("video");
      video.src = videoRef.current.src;
      video.currentTime = startTime;

      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });

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
        mimeType: "video/webm; codecs=vp9",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.start();

      const drawFrame = () => {
        if (video.currentTime >= endTime) {
          mediaRecorder.stop();
          return;
        }

        // Clear the canvas before drawing the new frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate the scaled dimensions based on the zoom level
        const scaledWidth = video.videoWidth * zoomLevel;
        const scaledHeight = video.videoHeight * zoomLevel;

        // Calculate the offset to center the zoomed video
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        // Draw the video frame with the zoom level
        ctx.drawImage(
          video,
          offsetX, // X offset
          offsetY, // Y offset
          scaledWidth, // Scaled width
          scaledHeight // Scaled height
        );

        // Apply sharpening effect (optional)
        sharpenImage(canvas, ctx);

        requestAnimationFrame(drawFrame);
      };

      video.play();
      drawFrame();

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
    }
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
                              className="w-full h-auto"
                              style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: "center center",
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
                        {texts.map((text, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 p-4 rounded-lg relative"
                          >
                            <p className="text-gray-700">{text}</p>
                            <button
                              onClick={() => handleAddComponent("text", text)}
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
                className="bg-gray-100 mt-10 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] overflow-hidden"
              >
                {video ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      id="videoCanvas"
                      className="w-full h-full rounded-lg mb-[70px]"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center center",
                      }}
                    />
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
                    />
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
                          disabled={isLoading} // Disable button while loading
                        >
                          {isLoading ? (
                            <ClipLoader color="#ffffff" size={20} /> // Show spinner while loading
                          ) : (
                            "Download Trimmed Vide"
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
          onClose={() => {
            setIsOpen(false);
          }}
          onSave={(text) => setTexts([...texts, text])}
        />
      )}
    </div>
  );
}
