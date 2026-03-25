"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import BloodTestCards from "../ui/BloodTestCards";

const caregiverFeatures = [
  {
    title: "Concierge device setup",
    description:
      "Technology should never be a barrier to care. Our specialists visit your parents in-person to handle the entire setup, ensuring a seamless start.",
    image: "/caregiver/1.png",
  },
  {
    title: "Remote care dispatch",
    description:
      "NexCura will notify caregivers of any concerning trends. You command the testing from abroad; we deliver the care at home.",
    component: <BloodTestCards />,
  },
  {
    title: "Continuous Biometric Oversight",
    description:
      "Monitor a 24/7 stream of their critical biomarkers, including heart rate, sleep, and stress scores, giving you total visibility across time zones.",
    image: "/caregiver/3.png",
  },
];

const CaregiverFeatures = () => {
  return (
    <section className="bg-[#000d24] py-12 font-sans">
      <div className="container mx-auto px-4 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {caregiverFeatures.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col group"
            >
              <div className="relative w-full aspect-4/3 mb-8 rounded-lg overflow-hidden shadow-xl">
                {item.component ? (
                  item.component
                ) : (
                  <>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent pointer-none" />
                  </>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-light text-white group-hover:text-[#ccc] transition-colors duration-300">
                  {item.title}
                </h3>
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

export default CaregiverFeatures;
