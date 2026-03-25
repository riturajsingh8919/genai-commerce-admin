"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  User,
  MessageSquare,
  FileText,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg("Please fill in all required fields.");
      setStatus("error");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#000d24] text-white pt-32 pb-24 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-light uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> Back to Home
          </Link>
          <h1 className="text-5xl md:text-6xl font-serif font-light tracking-tight">
            Get in Touch
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
            Have a question about NexRing or our health tracking solutions?
            We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:w-[340px] space-y-8"
          >
            <div className="bg-white/3 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl space-y-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
                  Contact Email
                </p>
                <a
                  href="mailto:contact.us@genaihealth.care"
                  className="flex items-center gap-4 group"
                >
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors">
                    <Mail className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80 group-hover:text-white transition-colors">
                      contact.us@genaihealth.care
                    </p>
                    <p className="text-[11px] text-white/20 mt-0.5">
                      We respond within 24 hours
                    </p>
                  </div>
                </a>
              </div>

              <div className="border-t border-white/5 pt-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
                  About NexRing
                </p>
                <p className="text-sm text-white/40 leading-relaxed">
                  NexRing is a next-generation smart health ring by Nexcura. We
                  combine advanced biosensors with AI-powered insights to help
                  you predict, prevent, and protect your health.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <div className="bg-white/3 border border-white/10 rounded-[32px] p-8 md:p-10 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16 space-y-6"
                  >
                    <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif font-light">
                        Message Sent
                      </h3>
                      <p className="text-white/40 max-w-sm mx-auto">
                        Thank you for reaching out. We&apos;ve sent a
                        confirmation to your email and will get back to you
                        within 24 hours.
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 rounded-full text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                          <User className="w-3.5 h-3.5" /> Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                          <Mail className="w-3.5 h-3.5" /> Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                        <FileText className="w-3.5 h-3.5" /> Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this regarding?"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                        <MessageSquare className="w-3.5 h-3.5" /> Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Tell us how we can help..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                        required
                      />
                    </div>

                    {/* Error Message */}
                    {status === "error" && errorMsg && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400/80 text-sm"
                      >
                        {errorMsg}
                      </motion.p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="w-full md:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white rounded-full font-light uppercase tracking-widest text-[10px] hover:bg-white/15 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message{" "}
                          <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
