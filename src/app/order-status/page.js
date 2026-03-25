"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setOrders(null);

    try {
      const res = await fetch(
        `/api/orders/track?email=${encodeURIComponent(email)}`,
      );
      const data = await res.json();

      if (res.ok) {
        setOrders(data);
        if (data.length === 0) {
          setError("No orders found for this email address.");
        }
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-track if email is in URL
  useEffect(() => {
    if (searchParams.get("email")) {
      handleTrack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "SHIPPED":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "PROCESSING":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Package className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "SHIPPED":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "PROCESSING":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-[#000d24] pt-32 pb-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0027ED]/10 text-[#8da0ff] border border-[#0027ED]/20 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase mb-8"
          >
            <ShieldCheck className="w-4 h-4" /> Secure Order Verification
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-light text-white mb-6 tracking-tight"
          >
            Track Your Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg max-w-xl mx-auto font-light"
          >
            Access your NexRing status by entering your registered verification
            credentials.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl p-2 rounded-3xl border border-white/10 mb-16 flex flex-col md:flex-row gap-2 relative z-10"
        >
          <form
            onSubmit={handleTrack}
            className="flex-1 flex items-center px-6"
          >
            <Mail className="w-5 h-5 text-white/20 mr-4 shrink-0" />
            <input
              type="email"
              placeholder="vitals@nexring.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-4 text-white placeholder:text-white/20 focus:outline-none text-lg bg-transparent font-light"
              required
            />
          </form>
          <button
            onClick={handleTrack}
            disabled={loading}
            className="bg-[#0027ED] text-white px-10 py-5 rounded-2xl font-medium tracking-widest uppercase text-xs flex items-center justify-center gap-3 hover:bg-[#0021c7] transition-all active:scale-95 disabled:opacity-70 group cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            Track Orders
          </button>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl flex items-center gap-4 text-red-500"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

          {orders && orders.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-2 mb-4">
                <h2 className="text-2xl font-serif font-light text-white">
                  Your Orders
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] font-light text-white/40">
                  {orders.length} Records Recovered
                </span>
              </div>

              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/3 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-sm group transition-all"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center mb-10 pb-10 border-b border-white/5">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/20 group-hover:bg-[#0027ED]/10 group-hover:text-[#0027ED] transition-all">
                          <Package className="w-10 h-10 text-[#8da0ff]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">
                            Protocol Reference
                          </p>
                          <p className="text-2xl font-mono font-medium text-white tracking-tight">
                            #{order.id.split("-")[0].toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div
                          className={`px-6 py-3 rounded-full border text-[10px] font-bold tracking-widest flex items-center gap-3 ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : order.status === "SHIPPED"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : order.status === "PROCESSING"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-white/5 text-white/40 border-white/10"
                          }`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                        <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold tracking-widest text-white/40">
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                        <div className="px-6 py-3 bg-[#0027ED]/10 border border-[#0027ED]/20 rounded-full text-[14px] font-bold tracking-widest text-[#8da0ff] flex items-baseline gap-1">
                          <span>{getCurrencySymbol(order.currency || "USD")}</span>
                          <span>{formatPrice(order.total, order.currency || "USD")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-6">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                          Manifest Details
                        </p>
                        <div className="space-y-4">
                          {order.items.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-end border-b border-white/5 pb-4"
                            >
                              <div>
                                <h4 className="text-white font-medium mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                  {item.color} {item.size ? `| Size: ${item.size}` : ""}
                                </p>
                              </div>
                              <span className="text-[#8da0ff] font-mono text-lg">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/2 p-8 md:p-10 rounded-[32px] border border-white/5">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6">
                          Logistics & Destinations
                        </p>
                        <div className="space-y-4">
                          {order.shipments && order.shipments.length > 0 ? (
                            <div className="space-y-4">
                              {order.shipments.map((s, i) => (
                                <div key={i} className="p-5 bg-white/2 border border-white/5 rounded-3xl space-y-3">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${
                                        s.status === "DELIVERED" ? "bg-emerald-400" : 
                                        s.status === "SHIPPED" ? "bg-blue-400" : 
                                        s.status === "PROCESSING" ? "bg-amber-400" : "bg-white/20"
                                      }`} />
                                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">{s.status}</span>
                                    </div>
                                    <span className="text-[10px] text-white/20 font-mono">Shipment #{i + 1}</span>
                                  </div>
                                  <p className="text-white/70 text-[13px] leading-relaxed font-light">{s.address}</p>
                                  
                                  {/* Rings in this shipment */}
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {(s.itemIndices?.length > 0 
                                      ? s.itemIndices.map(idx => {
                                          // Map global ring index to an expanded item list
                                          const expandedItems = [];
                                          order.items?.forEach(item => {
                                            for(let k=0; k<item.quantity; k++) expandedItems.push(item);
                                          });
                                          return expandedItems[idx];
                                        }) 
                                      : order.items || []
                                    ).map((item, ii) => (
                                      <span key={ii} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/50 font-medium whitespace-nowrap">
                                        {item?.color} {item?.size ? `| Size: ${item.size}` : ""}
                                      </span>
                                    ))}
                                  </div>

                                  {s.trackingNumber && (
                                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                      <span className="text-[9px] uppercase text-white/30 font-bold tracking-widest">Tracking Number</span>
                                      <span className="text-[12px] font-mono text-[#8da0ff]">{s.trackingNumber}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-4">
                              <Truck className="w-5 h-5 text-white/20 shrink-0 mt-1" />
                              <p className="text-white/80 leading-relaxed font-light text-[15px]">
                                {order.shippingAddress || (order.shippingAddresses && order.shippingAddresses[0])}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Link */}
        <div className="mt-20 text-center">
          <p className="text-white/20 text-sm font-light">
            Need logistical assistance?{" "}
            <a
              href="/contact"
              className="text-[#8da0ff] hover:text-white transition-colors underline decoration-white/10 underline-offset-8 mt-4 inline-block tracking-widest uppercase text-[10px] font-bold"
            >
              Inquire Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#000d24]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0027ED]" />
        </div>
      }
    >
      <OrderStatusContent />
    </Suspense>
  );
}
