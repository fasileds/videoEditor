"use client";

import React, { useState } from "react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(
  "pk_test_51Q8bc2IXfR0igwVwEOEfIzV1c1qTbwA9UGczCBN9tGqLag8s57xFetKTTSCCFT0FAxiI89PRxc5OMe2HvF43J9e4006fk2OqVX"
);
export default function Header() {
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckoutOpen = () => {
    setShowCheckout(true);
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <VideoCameraIcon className="w-6 h-6 text-blue-600" />
          <span>VideoPro</span>
        </h1>
        <nav className="space-x-6">
          <a href="/" className="text-gray-700 hover:text-gray-900">
            Home
          </a>
          <a href="/Edit" className="text-gray-700 hover:text-gray-900">
            Video Editor
          </a>
          <button
            onClick={handleCheckoutOpen}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Pro for 30 days
          </button>
        </nav>
      </div>

      {/* Render CheckoutForm only when showCheckout is true */}
      <Elements stripe={stripePromise}>
        {showCheckout && (
          <CheckoutForm budget={100} onClose={handleCheckoutClose} />
        )}
      </Elements>
    </header>
  );
}
