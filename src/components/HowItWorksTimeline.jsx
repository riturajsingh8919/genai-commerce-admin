"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import BloodTestCards from "./ui/BloodTestCards";
import Biomarkers from "./ui/Biomarkers";
import Recommendations from "./ui/Recommendations";
import Calendar from "./ui/Calendar";

const steps = [
  {
    id: 1,
    step: "Step 1",
    title: "Set up NxRing and create your account",
    description: "Simple set up of your NxRing to your smartphone.",
    bullets: [
      "In person onboarding buddy available for an additional fee (select at checkout).",
    ],
    image: "/how/step-1.png",
    type: "image",
  },
  {
    id: 2,
    step: "Step 2",
    title: "Establish your baseline",
    description:
      "Schedule your blood draw through the app. Take it at home or at a partner diagnostic center.",
    bullets: [
      "150+ biomarkers analyzed",
      "Upload PDFs of past medical records",
    ],
    component: <BloodTestCards />,
    type: "component",
  },
  {
    id: 3,
    step: "Step 3",
    title: "Decode the Data",
    description:
      "Our proprietary AI model translates complex lab results into a clear biological dashboard.",
    bullets: [
      "Clear, concise analysis in plain English, no jargon.",
      "Understand your body.",
    ],
    component: <Biomarkers />,
    type: "component",
  },
  {
    id: 4,
    step: "Step 4",
    title: "Take Action",
    description:
      "Follow your care pathways that are personalized for your body.",
    bullets: ["Clear next steps", "Recommended action plan"],
    component: <Recommendations />,
    type: "component",
  },
  {
    id: 5,
    step: "Step 5",
    title: "Repeat",
    description: "Re-test and visualize your improvement in your own health.",
    bullets: [],
    component: <Calendar />,
    type: "component",
  },
];

const Dot = ({ scrollYProgress, threshold }) => {
  const scale = useTransform(
    scrollYProgress,
    [threshold - 0.05, threshold, threshold + 0.05],
    [0.8, 1.2, 0.8],
  );
  const color = useTransform(
    scrollYProgress,
    [threshold - 0.05, threshold],
    ["rgba(255, 255, 255, 0.2)", "rgba(86, 70, 163, 1)"],
  );
  const borderColor = useTransform(
    scrollYProgress,
    [threshold - 0.05, threshold],
    ["rgba(255, 255, 255, 0.2)", "rgba(86, 70, 163, 0.5)"],
  );

  return (
    <div className="w-10 h-10 rounded-full bg-[#000d24] border-2 border-white/20 flex items-center justify-center relative">
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor, scale: 1.2 }}
      />
      <motion.div
        className="w-4 h-4 rounded-full"
        style={{ scale, backgroundColor: color }}
      />
    </div>
  );
};

const HowItWorksTimeline = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 20%"],
  });

  const height = useSpring(
    useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
    {
      stiffness: 100,
      damping: 30,
      restDelta: 0.001,
    },
  );

  return (
    <section
      ref={containerRef}
      className="bg-[#000d24] py-20 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-16 relative">
        {/* Central Timeline Line (Desktop) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/10 -translate-x-1/2">
          <motion.div
            className="absolute top-0 left-0 w-full bg-[#5646a3] origin-top"
            style={{ height }}
          >
            {/* Glowing Tip */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#5646a3] rounded-full shadow-[0_0_20px_rgba(86,70,163,1)] z-20"
              style={{
                opacity: useTransform(scrollYProgress, [0, 0.01], [0, 1]),
              }}
            />
          </motion.div>
        </div>

        {/* Steps */}
        <div className="space-y-20 lg:space-y-40 relative">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            const threshold = index / (steps.length - 1);

            return (
              <div
                key={step.id}
                className="relative flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24"
              >
                {/* Timeline Dot (Desktop) */}
                <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <Dot
                    scrollYProgress={scrollYProgress}
                    threshold={threshold}
                  />
                </div>

                {/* Content Side */}
                <motion.div
                  className={`w-full md:w-[45%] ${isEven ? "md:order-1" : "md:order-2"}`}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="bg-[#5646a3]/10 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#5646a3] text-white text-sm font-medium mb-6">
                      {step.step}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-light text-white mb-6">
                      {step.title}
                    </h3>
                    <p className="text-white/70 text-lg mb-6">
                      {step.description}
                    </p>
                    {step.bullets.length > 0 && (
                      <ul className="space-y-3">
                        {step.bullets.map((bullet, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-white/60"
                          >
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5646a3] shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>

                {/* Visual Side */}
                <motion.div
                  className={`w-full md:w-[45%] aspect-4/3 relative ${isEven ? "md:order-2" : "md:order-1"}`}
                  initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="w-full h-full rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative">
                    {step.type === "image" ? (
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
                        <div className="w-full h-full">{step.component}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksTimeline;
