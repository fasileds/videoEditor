"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import SignIN from "../components/SignIn";

export default function Home() {
  const [video, setVideo] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const router = useRouter();

  const handleVideoUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setVideo(reader.result);
          router.push(`/Edit?video=${encodeURIComponent(reader.result)}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Header />
      <main className="flex flex-col items-center justify-center flex-grow p-8 sm:p-12">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900">
            Video<span className="text-blue-600">Pro</span>
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Edit, Trim, and Enhance Your Videos with Ease
          </p>
        </header>

        <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-6 sm:p-8 transform transition-all hover:scale-105">
          <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Video Editor
            </h2>
            <p className="text-sm text-gray-600 text-center">
              Enhance your videos with our editing tools. Apply filters, trim
              clips, add text, and overlay audio seamlessly.
            </p>

            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white shadow-md rounded-lg text-center transform transition-all hover:scale-105">
                <h3 className="text-lg font-medium text-gray-800">
                  Trim Video
                </h3>
                <p className="text-sm text-gray-600">
                  Cut unwanted parts of your video to keep only the essential
                  moments.
                </p>
              </div>

              <div className="p-4 bg-white shadow-md rounded-lg text-center transform transition-all hover:scale-105">
                <h3 className="text-lg font-medium text-gray-800">Add Text</h3>
                <p className="text-sm text-gray-600">
                  Overlay captions, titles, or subtitles to enhance your
                  content.
                </p>
              </div>

              <div className="p-4 bg-white shadow-md rounded-lg text-center transform transition-all hover:scale-105">
                <h3 className="text-lg font-medium text-gray-800">Add Audio</h3>
                <p className="text-sm text-gray-600">
                  Insert background music or voiceovers to improve engagement.
                </p>
              </div>

              <div className="p-4 bg-white shadow-md rounded-lg text-center transform transition-all hover:scale-105">
                <h3 className="text-lg font-medium text-gray-800">
                  Apply Filters
                </h3>
                <p className="text-sm text-gray-600">
                  Adjust brightness, contrast, and color to create stunning
                  visuals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          onClick={() => setShowSignIn(true)}
          className="mt-6 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium transform transition-all hover:scale-105"
        >
          Sign In
        </button>
      </main>

      <footer className="text-center text-gray-600 text-sm py-4">
        <p>© 2025 VideoPro. All rights reserved.</p>
      </footer>

      {/* Sign In Popup */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative transform transition-all hover:scale-105">
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✖
            </button>
            <SignIN isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
