"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== "undefined") return !navigator.onLine;
    return false;
  });

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 left-0 right-0 z-9999 bg-linear-to-r from-[#1a0a2e] via-[#0d1b3e] to-[#1a0a2e] border-b border-red-500/20 px-6 py-4 flex items-center justify-center gap-4 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <WifiOff className="w-5 h-5 text-red-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-light text-white">
                You&apos;re currently offline
              </p>
              <p className="text-[10px] font-light text-white/40">
                Check your internet connection to continue using NxRing
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-[10px] font-light uppercase tracking-widest transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
