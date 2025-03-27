"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function SignIN({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            {/* Custom Close Icon (X) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Sign in Button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/Edit" })}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-3 transition-all mt-6 shadow-md hover:shadow-lg"
        >
          {/* Custom Google Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="24"
            height="24"
            className="w-5 h-5"
          >
            <path
              fill="#4285F4"
              d="M23.49 12.3c0-.72-.06-1.41-.17-2.07H12v3.93h6.29c-.27 1.33-1.04 2.46-2.13 3.16v2.63h3.44c2.02-1.86 3.17-4.61 3.17-8.03z"
            />
            <path
              fill="#34A853"
              d="M12 7.2c1.08 0 2.02.37 2.77.98l2.07-2.07C15.09 5.1 13.42 4 11.5 4 8.41 4 6 6.41 6 9.5s2.41 5.5 5.5 5.5c1.73 0 3.27-.73 4.36-1.95l-2.07-2.07c-.61.41-1.37.65-2.29.65-1.66 0-3-1.34-3-3s1.34-3 3-3z"
            />
            <path
              fill="#FBBC05"
              d="M8.21 5.93C7.51 6.93 7 8.22 7 9.5c0 1.28.51 2.57 1.21 3.57l-2.07 2.07C5.06 13.03 4 11.72 4 9.5c0-2.42 1.23-4.53 3.21-5.57z"
            />
            <path
              fill="#EA4335"
              d="M11.5 4c-.92 0-1.74.33-2.38.89l-2.07-2.07C8.41 1.09 9.98 0 11.5 0c3.09 0 5.5 2.41 5.5 5.5s-2.41 5.5-5.5 5.5c-2.08 0-3.87-1.15-4.79-2.83l2.07-2.07c.97.96 2.26 1.58 3.72 1.58 1.66 0 3-1.34 3-3s-1.34-3-3-3z"
            />
          </svg>
          <span className="font-medium">Continue with Google</span>
        </button>

        {/* Footer */}
        <div className="text-sm text-gray-600 text-center mt-4">
          Don't have an account?{" "}
          <a href="#" className="text-blue-600 hover:underline font-medium">
            Sign up
          </a>
        </div>
      </motion.div>
    </div>
  );
}
