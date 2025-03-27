"use client";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Router from "next/router";
interface CheckoutFormProps {
  budget: number;
  onClose: () => void; // Added onClose prop
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ budget, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [sussfull, setSussfull] = useState(false);

  // Handle form submission and payment
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!stripe || !elements) return;

    try {
      if (paymentMethod === "card") {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setErrorMessage("Card element not found.");
          setLoading(false);
          return;
        }

        // Create payment intent on backend
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: budget, currency: "usd" }),
        });

        if (!response.ok) throw new Error("Failed to create payment intent.");
        const { clientSecret } = await response.json();

        // Confirm payment using Stripe
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name, email },
          },
        });

        if (result.error) {
          setErrorMessage(result.error.message || "Payment failed.");
        } else if (result.paymentIntent?.status === "succeeded") {
          Swal.fire({
            title: "Payment Successful!",
            text: "Your payment has been processed successfully. you are now subscribe for one monthe",
            icon: "success",
            confirmButtonText: "OK",
          });
        }
      } else if (paymentMethod === "bank_transfer") {
        console.log("Bank transfer selected. Implement logic here.");
      }
    } catch (error) {
      setErrorMessage("Payment processing error.");
      console.error(error);

      Swal.fire({
        title: "Payment Error",
        text: "An unexpected error occurred. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg animate__animated animate__fadeIn animate__delay-0.5s">
        <h2 className="text-4xl font-semibold text-center text-indigo-700 mb-6">
          Checkout
        </h2>

        {/* Close Button */}
        <button
          onClick={onClose} // Call onClose when clicked
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition duration-150"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-800"
              htmlFor="name"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-md focus:ring-2 focus:ring-indigo-500 transition duration-150"
              placeholder="John Doe"
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-800"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-md focus:ring-2 focus:ring-indigo-500 transition duration-150"
              placeholder="example@example.com"
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-800"
              htmlFor="payment-method"
            >
              Payment Method
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-md text-gray-800 focus:ring-2 focus:ring-indigo-500 transition duration-150"
            >
              <option value="card" className="text-gray-800">
                Credit/Debit Card
              </option>
              <option value="bank_transfer" className="text-gray-800">
                Bank Transfer
              </option>
            </select>
          </div>

          {paymentMethod === "card" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Card Information
              </label>
              <CardElement
                options={{
                  hidePostalCode: true,
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#32325d",
                      padding: "10px",
                    },
                    invalid: { color: "#fa755a" },
                  },
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || loading}
            className={`w-full py-3 px-4 font-semibold rounded-lg text-white ${
              loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-500"
            } focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-200`}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>

          {errorMessage && (
            <p className="mt-4 text-red-600 text-center text-sm">
              {errorMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CheckoutForm;
