"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/genai-admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0027ED]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0027ED]/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white border border-[#e2e8f0] p-12 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden">
          {/* Subtle Inner Glow */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0027ED]" />

          <div className="text-center mb-12 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-[#0027ED] mb-8 shadow-2xl shadow-[#0027ED]/30 group">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-light text-[#0f172a] tracking-tight mb-3 italic">
              Nxring Admin
            </h1>
            <p className="text-[#64748b] font-light text-xs uppercase tracking-[0.2em]">
              Authorized Access Only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 relative">
            <div className="space-y-3">
              <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-widest ml-1">
                Operator Identity
              </label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748b] group-focus-within:text-[#0027ED] transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@nexring.pro"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4.5 pl-14 pr-6 text-[#0f172a] font-light placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-light text-[#0027ED] uppercase tracking-widest ml-1">
                Security Key
              </label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748b] group-focus-within:text-[#0027ED] transition-colors">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl py-4.5 pl-14 pr-6 text-[#0f172a] font-light placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0027ED] focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-light uppercase tracking-wider shadow-sm shadow-rose-500/5"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0027ED] text-white py-5 rounded-[20px] text-[13px] font-light uppercase tracking-[0.2em] shadow-2xl shadow-[#0027ED]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Enter Nxring
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[#94a3b8] text-[9px] font-light uppercase tracking-widest leading-loose">
              &copy; 2026 NexRing Systems Core.
              <br />
              Security Level 4 Authorization Required.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
