'use client';

import { Scale, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const handleLoginClick = () => {
    window.open('/login', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-8">
          <Scale className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          AI Lawyer
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          AI-powered law firm management system
        </p>
        <button
          onClick={handleLoginClick}
          className="inline-flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
        >
          <span>Live Demo</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

