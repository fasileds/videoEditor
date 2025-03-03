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
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipTime, setTooltipTime] = useState<string>("");
  const [isTrimmed, setIsTrimmed] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<
    "video" | "audio" | "text" | null
  >(null);
  const [videos, setVideos] = useState<string[]>([]);
  const [audios, setAudios] = useState<string[]>([]);
  const [texts, setTexts] = useState<string[]>([]);
  const [addedComponents, setAddedComponents] = useState<
    { type: "video" | "audio" | "text"; src: string; id: string }[]
  >([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trimMode, setTrimMode] = useState<"both" | "video" | "audio">("video");

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

  const handleAddText = () => {
    setIsOpen(true)
  };

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

  const handleRemoveComponent = (id: string) => {
    setAddedComponents(addedComponents.filter((comp) => comp.id !== id));
  };

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

  const handleDownload = async () => {
    if (videoRef.current && isTrimmed) {
      const startTime = (startTrim / 100) * videoDuration;
      const endTime = (endTrim / 100) * videoDuration;

      const video = document.createElement("video");
      video.src = videoRef.current.src;
      video.currentTime = startTime;

      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });

      const stream = (video as any).captureStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, (endTime - startTime) * 1000);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trimmed-video.webm";
        a.click();
        URL.revokeObjectURL(url);
      };

      video.play();
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          setVideoDuration(videoRef.current.duration || 0);
        }
      };
    }
  }, [video]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration || 0);
        }
      };
    }
  }, [audios]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 font-[family-name:var(--font-geist-sans)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Left Sidebar for Icons */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="space-y-4">
                <button
                  onClick={() =>
                    setActiveSidebar(activeSidebar === "video" ? null : "video")
                  }
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  <VideoCameraIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveSidebar(activeSidebar === "audio" ? null : "audio")
                  }
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
                >
                  <MusicalNoteIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveSidebar(activeSidebar === "text" ? null : "text")
                  }
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowTrimTools(!showTrimTools)}
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105"
                >
                  <ScissorsIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          {activeSidebar && (
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
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
                        className="w-full flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 cursor-pointer"
                      >
                        <span>Add Video</span>
                      </label>
                      {videos.map((video, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 p-4 rounded-lg relative"
                        >
                          <video
                            src={video}
                            controls
                            className="w-full rounded-lg"
                          />
                          <button
                            onClick={() => handleAddComponent("video", video)}
                            className="absolute bottom-2 right-2 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
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
                        className="w-full flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 cursor-pointer"
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
                            className="absolute bottom-2 right-2 bg-green-600 text-white p-1 rounded-full hover:bg-green-700 transition-colors"
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
                        className="w-full flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
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
                            className="absolute bottom-2 right-2 bg-purple-600 text-white p-1 rounded-full hover:bg-purple-700 transition-colors"
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

          {/* Main Content Area */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ScissorsIcon className="w-6 h-6 text-blue-600" />
                <span>Edit Your Video</span>
              </h2>
              <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                {video ? (
                  <>
                    <video
                      ref={videoRef}
                      src={video}
                      controls
                      crossOrigin="anonymous"
                      className="w-full h-full rounded-lg"
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
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
                        >
                          Download Trimmed Video
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
      <footer className="bg-white shadow-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
          <p className="text-gray-600">© 2025 VideoPro. All rights reserved.</p>
        </div>
      </footer>
      {isOpen && <TextEditorModal isOpen={isOpen} onClose={()=>{setIsOpen(false)}} onSave={(text) => setTexts([...texts, text])}/>}
    </div>
  );
}
