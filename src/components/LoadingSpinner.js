"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner({ fullPage = false, message = "Loading..." }) {
  const spinnerElement = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16">
        {/* Outer Ring - Blau */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {/* Middle Ring - Grana */}
        <motion.div
          className="absolute inset-1 rounded-full border-4 border-r-red-600 border-t-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner Pulse - Gold */}
        <motion.div
          className="absolute inset-3.5 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/20"
          animate={{ scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {message && (
        <p className="text-sm font-semibold tracking-wider text-muted-foreground animate-pulse">
          {message.toUpperCase()}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
        {spinnerElement}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-12">
      {spinnerElement}
    </div>
  );
}
