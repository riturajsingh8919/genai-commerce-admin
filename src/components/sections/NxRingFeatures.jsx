"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";

const ringFeatures = [
  {
    title: "Wake up your best self:",
    description:
      "Decode your Deep, Light, and REM cycles to understand the quality of your rest and master your recovery.",
    image: "/ring/1.png",
  },
  {
    title: "Listen to your heart, literally:",
    description:
      "Monitor your Heart Rate Variability (HRV) and resting pulse 24/7.",
    image: "/ring/2.png",
  },
  {
    title: "Find your calm in the chaos:",
    description:
      "Real-time stress scores analyze your body’s autonomic response.",
    image: "/ring/3.png",
  },
];

const NxRingFeatures = () => {
  return (
    <section className="bg-[#000d24] py-24 font-sans">
      <div className="container mx-auto px-4 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 flex items-center justify-between gap-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white max-w-4xl leading-tight">
            NexCura works great on its own. NxRing makes it even better.
          </h2>

          <Link
            href={"/what-we-test"}
            className="bg-[#0027ED] text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-[#002e7d] transition-colors flex items-center gap-2"
          >
            Learn more{" "}
            <span className="text-xl">
              <FaChevronRight className="text-sm" />
            </span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {ringFeatures.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col group"
            >
              <div className="relative w-full aspect-4/3 sm:aspect-square md:aspect-4/3 mb-8 rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#000d24]/80 via-transparent to-transparent pointer-none" />
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-light text-white">{item.title}</h3>
                <p className="text-white/60 text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NxRingFeatures;
