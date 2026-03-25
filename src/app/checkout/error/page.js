"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, HelpCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message =
    searchParams.get("message") ||
    "The payment transaction could not be completed at this time.";

  return (
    <div className="min-h-screen bg-[#000d24] text-white pt-32 pb-24 px-6 font-sans">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-red-500/20 rounded-[48px] p-12 backdrop-blur-3xl relative overflow-hidden text-center"
        >
          {/* Subtle Red Glow */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 space-y-8">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-serif font-light tracking-tight text-white">
                Transaction Interrupted
              </h1>
              <p className="text-white/60 leading-relaxed text-sm">
                We encountered an obstacle while processing your request.
                Don&apos;t worry, your funds are safe and no charges have been
                finalized.
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-sm text-red-400 font-medium">
              Reason: {message}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 text-left p-4 bg-white/5 rounded-2xl">
                <RefreshCcw className="w-5 h-5 text-white/40 shrink-0" />
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-light">
                  Try checking your card details or use a different payment
                  method.
                </p>
              </div>
              <div className="flex items-center gap-4 text-left p-4 bg-white/5 rounded-2xl">
                <HelpCircle className="w-5 h-5 text-white/40 shrink-0" />
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-light">
                  Contact our support hub if the issue persists across multiple
                  attempts.
                </p>
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <Link
                href="/cart"
                className="w-full py-5 bg-white text-[#000d24] rounded-full font-light uppercase tracking-widest text-[10px] hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
                Back to Cart
              </Link>
              <Link
                href="/"
                className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-full font-light uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
              >
                Return to Nxring Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000d24] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
