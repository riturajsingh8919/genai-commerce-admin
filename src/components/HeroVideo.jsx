"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";

const HeroVideo = () => {
  const containerRef = useRef(null);
  const headingRef = useRef(null);
  const subheadingRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states for content
      gsap.set([headingRef.current, subheadingRef.current, ctaRef.current], {
        opacity: 0,
        y: 40,
      });

      // Entry animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(headingRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
      })
        .to(
          subheadingRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          "-=0.6",
        )
        .to(
          ctaRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          "-=0.5",
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen min-h-[700px] overflow-hidden flex items-center justify-center"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero-main.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-16 relative z-10 pt-24">
        <div className="max-w-[700px] mx-auto flex flex-col items-center">
          <h1
            ref={headingRef}
            className="text-4xl md:text-6xl font-light text-center text-white mb-6 drop-shadow-lg"
          >
            Predict. Prevent. Protect
          </h1>
          <p
            ref={subheadingRef}
            className="text-base md:text-xl font-extralight text-white/90 leading-relaxed mb-8 max-w-xl text-center"
          >
            Don’t be reactive. Be Proactive. Annual testing covering 150+
            biomarkers integrated with continuous biometric data.
          </p>

          <div ref={ctaRef}>
            <Link
              href={"/nxring"}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 overflow-hidden rounded-full cursor-pointer transition-all duration-500 hover:scale-105"
            >
              <div className="absolute inset-0 bg-[#002e7d] backdrop-blur-xl border border-[#002e7d] rounded-full transition-all duration-500 group-hover:bg-white/25 group-hover:border-white/50" />
              <div className="absolute inset-px rounded-full bg-linear-to-b from-white/20 to-transparent opacity-50" />
              <span className="relative z-10 text-white text-sm font-light tracking-wider">
                Pre-Order Now
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroVideo;
