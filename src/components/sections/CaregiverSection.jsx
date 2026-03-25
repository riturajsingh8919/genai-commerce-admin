"use client";

import React from "react";
import { motion } from "framer-motion";
import CaregiverGlobe from "../ui/CaregiverGlobe";

const CaregiverSection = () => {
  return (
    <section className="bg-[#000d24] pt-12 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-16 relative z-10">
        {/* Minimal Centered Text Content at Top */}
        <div className="max-w-5xl mx-auto text-center mb-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 md:mb-8 leading-tight tracking-tight">
              Watching over them a thousand miles away{" "}
              <br className="hidden sm:block" />
              <span className="text-white/80">
                Monitor your family&apos;s health metrics
              </span>
            </h2>
            <h3 className="text-lg md:text-2xl text-white font-light tracking-wide max-w-3xl mx-auto px-4">
              Real-time health insights and proactive alerts that make the
              distance disappear.
            </h3>
          </motion.div>
        </div>
      </div>

      {/* Premium Immersive Globe Container */}
      <div className="w-full relative h-[450px] sm:h-[600px] lg:h-[850px] mt-12 md:mt-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-full h-full"
        >
          <CaregiverGlobe />
        </motion.div>

        {/* Cinematic Overlays for Depth */}
        <div className="hidden md:block absolute inset-0 pointer-events-none bg-linear-to-b from-[#000d24] via-transparent to-[#000d24] z-10" />

        {/* Bottom Mask - Adjusted for responsive height */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 md:h-40 bg-linear-to-t from-[#000d24] to-transparent z-20" />

        {/* Subtle Radial Glow to blend the globe edge */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(45,212,191,0.02)_0%,transparent_70%)] pointer-events-none" />
      </div>
    </section>
  );
};

export default CaregiverSection;
