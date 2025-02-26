import React from "react";

export default function SignIN({ isOpen, onClose }: any) {
  return (
    <div className="relative">
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Sign in to your account
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-2"
              >
                &times;
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Your email
                </label>
                <input
                  type="email"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">
                  Your password
                </label>
                <input
                  type="password"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-blue-700 hover:underline">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-700 text-white p-2.5 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300"
              >
                Login
              </button>
              <div className="text-sm text-gray-500 text-center">
                Not registered?{" "}
                <a href="#" className="text-blue-700 hover:underline">
                  Create account
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
