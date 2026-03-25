"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#000d24] text-white flex items-center justify-center px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center"
      >
        {/* Animated icon */}
        <div className="relative w-28 h-28 mx-auto mb-10">
          <div className="absolute inset-0 rounded-full border border-[#0027ED]/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-[#0027ED]/30 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-[#0027ED]/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-[#0027ED]" />
          </div>
        </div>

        {/* Error code */}
        <p className="text-[10px] font-light uppercase tracking-[0.4em] text-[#bfcaff] mb-4">
          Runtime Error
        </p>

        <h1 className="text-3xl md:text-4xl font-serif font-light mb-4 leading-tight">
          Something Went Wrong
        </h1>

        <p className="text-sm font-light text-white/40 leading-relaxed max-w-sm mx-auto mb-10">
          NxRing encountered an unexpected issue while loading this page. This
          is usually temporary — try refreshing or return to the homepage.
        </p>

        {/* Error detail (dev-friendly) */}
        {error?.message && (
          <div className="mb-10 mx-auto max-w-md bg-white/5 border border-white/5 rounded-2xl p-4">
            <p className="text-[10px] font-mono text-white/30 break-all leading-relaxed">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-7 py-4 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.25em] transition-all cursor-pointer group active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            Retry
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-7 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.25em] transition-all active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>

        {/* Decorative line */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="w-8 h-px bg-white/10" />
          <p className="text-[9px] font-light uppercase tracking-[0.3em] text-white/20">
            NxRing by Nexcura
          </p>
          <div className="w-8 h-px bg-white/10" />
        </div>
      </motion.div>
    </div>
  );
}
