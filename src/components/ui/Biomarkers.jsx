"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MdOpacity,
  MdOutlineNature,
  MdFavoriteBorder,
  MdOutlineHourglassBottom,
} from "react-icons/md";

const biomarkersData = [
  { id: 1, name: "Blood", icon: <MdOpacity />, status: "in-range", value: 85 },
  {
    id: 2,
    name: "Environmental Toxins",
    icon: <MdOutlineNature />,
    status: "out-range",
    value: 30,
  },
  {
    id: 3,
    name: "Heart",
    icon: <MdFavoriteBorder />,
    status: "in-range",
    value: 92,
  },
  {
    id: 4,
    name: "Biological Age",
    icon: <MdOutlineHourglassBottom />,
    status: "in-range",
    value: 78,
  },
];

const Biomarkers = () => {
  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center font-outfit text-[#2d2d2d] bg-[#fbf9f4] rounded-2xl p-4 md:p-6 border border-[#ede9e1] overflow-hidden">
      {/* Category List */}
      <div className="w-full md:w-1/2 space-y-3">
        {biomarkersData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5646a3]/5 flex items-center justify-center text-lg text-[#5646a3]/60 group-hover:text-[#5646a3] transition-colors">
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-light text-[#2d2d2d]/80">
                  {item.name}
                </span>
                <div className="flex gap-1 h-1 w-12">
                  <div
                    className={`h-full rounded-full ${item.status === "in-range" ? "bg-[#A8E6CF] w-[70%]" : "bg-[#A8E6CF]/30 w-[30%]"}`}
                  />
                  <div
                    className={`h-full rounded-full ${item.status === "out-range" ? "bg-[#FFD3B6] w-[70%]" : "bg-[#FFD3B6]/30 w-[40%]"}`}
                  />
                </div>
              </div>
            </div>
            <div className="text-[#2d2d2d]/10">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero Summary */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-2">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-[#2d2d2d]/5"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="54"
              stroke="#A8E6CF"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="339.12"
              initial={{ strokeDashoffset: 339.12 }}
              whileInView={{ strokeDashoffset: 339.12 * (1 - 0.75) }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
              strokeLinecap="round"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="54"
              stroke="#FFD3B6"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="339.12"
              initial={{ strokeDashoffset: 339.12 }}
              whileInView={{ strokeDashoffset: 339.12 * (1 - 0.25) }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
              strokeLinecap="round"
              className="transform rotate-270"
              style={{ transformOrigin: "center" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-sans text-[#2d2d2d]">104</span>
            <span className="text-[8px] uppercase tracking-widest font-light text-[#2d2d2d]/40">
              Biomarkers
            </span>
          </div>
        </div>

        <div className="w-full mt-4 space-y-2 px-2">
          <div className="flex items-center justify-between text-[10px] font-light text-[#2d2d2d]/60">
            <span>In Range</span>
            <span>86</span>
          </div>
          <div className="w-full h-1 bg-[#2d2d2d]/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "82%" }}
              viewport={{ once: true }}
              className="h-full bg-[#A8E6CF]"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-light text-[#2d2d2d]/60 mt-1">
            <span>Out of range</span>
            <span>18</span>
          </div>
          <div className="w-full h-1 bg-[#2d2d2d]/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "28%" }}
              viewport={{ once: true }}
              className="h-full bg-[#FFD3B6]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Biomarkers;
