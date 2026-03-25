"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Mail,
  MapPin,
  ChevronRight,
  Share2,
  Check,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

export default function SuccessPage() {
  const [orderInfo, setOrderInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart on success page load
    clearCart();

    // Load order data from session
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Use a small delay or microtask to avoid "cascading render" lint warning 
        // while ensuring we don't have hydration mismatches.
        setTimeout(() => setOrderInfo(parsed), 0);
      } catch (err) {
        console.error("Failed to recover session manifest:", err);
      }
    }
  }, [clearCart]);

  const handleShare = async () => {
    const shareData = {
      title: "NexRing by Nexcura",
      text: "I just ordered a NexRing — the future of smart health tracking!",
      url: typeof window !== 'undefined' ? `${window.location.origin}` : process.env.NEXT_PUBLIC_URL,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareData.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          // ignore
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#000d24] text-white pt-32 pb-24 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/3 border border-white/10 rounded-[48px] p-12 backdrop-blur-3xl overflow-hidden relative"
        >
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 text-center space-y-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-5xl font-serif font-light tracking-tight">
                Order Confirmed
              </h1>
              <p className="text-white/40 text-lg max-w-lg mx-auto leading-relaxed">
                Thank you for your purchase. Your NexRing order has been
                confirmed and is being prepared for shipment.
              </p>
            </div>

            {/* Order Card */}
            <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">
                    Order ID
                  </p>
                  <h3 className="text-xl font-mono text-white/90">
                    {orderInfo
                      ? `#${orderInfo.orderId.split("-")[0].toUpperCase()}`
                      : "#--------"}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-2 text-white/80 font-light text-xs uppercase tracking-widest">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                    Confirmed
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/5 pb-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl">
                      <Mail className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                        Confirmation Email
                      </p>
                      <p className="text-sm text-white/60">
                        {orderInfo?.email || "Sent to your email"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl">
                      <Package className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                        Current Status
                      </p>
                      <p className="text-sm text-white/60">
                        Processing Implementation
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
                <p className="text-xs text-white/40 mb-4 leading-relaxed italic">
                  * Order activation codes have been sent to your email. Please check your inbox (and spam folder) to activate your NexRing in the mobile app.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/order-status"
                className="w-full sm:w-auto px-10 py-5 bg-white text-black border border-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
              >
                Track Your Order{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white rounded-full font-light uppercase tracking-widest text-[10px] hover:bg-white/15 transition-all flex items-center justify-center gap-2 group"
              >
                Continue Exploring{" "}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={handleShare}
                className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white/60 rounded-full font-light uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Link Copied
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Share
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
