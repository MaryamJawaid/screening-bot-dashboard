"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function ScreeningDashboard() {
  const [candidateName, setCandidateName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const canStartCall = candidateName.trim() && phoneNumber && !isLoading;

  const handleStartScreening = async () => {
    if (!canStartCall) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/start-screening', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: candidateName.trim(),
          phoneNumber: phoneNumber || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start screening call');
      }

      setMessage({
        type: 'success',
        text: `Screening call initiated for ${candidateName}! The candidate will receive a call shortly.`
      });

      // Reset form
      setCandidateName("");
      setPhoneNumber("");

    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to start screening call'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            KSA Screening Interview Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered screening interviews for candidates
          </p>
          <div className="mt-4">
            <Link 
              href="/history" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              View Call History →
            </Link>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Start Screening Call
          </h2>

          <div className="space-y-6">
            {/* Candidate Name */}
            <div>
              <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Name *
              </label>
              <input
                id="candidateName"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate's full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                disabled={isLoading}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                defaultCountry="SA"
                placeholder="Enter phone number"
                disabled={isLoading}
                international
                countries={['SA', 'PK', 'AE', 'US', 'GB']}
              />
              <p className="mt-1 text-xs text-gray-500">
                International format (e.g., +966 for Saudi, +92 for Pakistan)
              </p>
            </div>


            {/* Action Button */}
            <button
              onClick={handleStartScreening}
              disabled={!canStartCall}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initiating Call...
                </div>
              ) : (
                "Start Screening Interview"
              )}
            </button>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• The candidate will receive an automated call from Ahmad, our AI interviewer</li>
            <li>• The screening covers sales experience, target achievement, and market knowledge</li>
            <li>• Complete transcription and analysis will be available in call history</li>
            <li>• Each interview typically lasts 10-15 minutes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
