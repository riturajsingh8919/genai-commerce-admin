"use client";

import React from "react";
import { motion } from "framer-motion";

function WhatWeTestHero() {
  return (
    <section className="relative min-h-[70vh] flex items-end justify-center overflow-hidden bg-[#000d24]">
      {/* Immersive Background Shapes */}
      <div className="absolute inset-0 z-0">
        {/* Main diagonal glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-[-20%] left-[-10%] w-[120%] h-[140%] rotate-15 bg-linear-to-r from-[#5646a3]/40 via-[#0027ED]/30 to-transparent blur-[120px]"
        />

        {/* Secondary soft purple glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 3, delay: 0.5 }}
          className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[80%] bg-[#5646a3]/40 blur-[150px] rounded-full"
        />

        {/* Deep blue accent */}
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-[#0027ED]/20 blur-[100px] rounded-full" />
      </div>

      {/* Grain Overlay */}
      <div
        className="absolute inset-0 z-1 opacity-[0.4] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content Container */}
      <div className="container mx-auto px-4 lg:px-16 relative z-10 pb-20">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h4 className="text-[10px] font-light uppercase tracking-widest text-white/40">
              What we <span className="text-white">Test</span>
            </h4>

            <h1 className="text-5xl md:text-7xl font-sans font-extralight tracking-tight text-white leading-[1.05]">
              The Biomarkers <br className="hidden md:block" />
              <span className="opacity-90">Behind Better Decisions</span>
            </h1>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default WhatWeTestHero;
