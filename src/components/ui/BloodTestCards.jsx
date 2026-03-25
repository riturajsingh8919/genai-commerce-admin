"use client";

import React from "react";
import Image from "next/image";
import { HiOutlineBeaker, HiOutlineHome } from "react-icons/hi2";

const BloodTestCards = () => {
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden group">
      {/* Background Image */}
      <Image
        src="/caregiver/2.png"
        alt="Blood Test Options"
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Glassmorphism Cards Center Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3 z-10">
        {/* In Lab Card */}
        <div className="w-full max-w-[280px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <HiOutlineBeaker className="text-xl" />
            </div>
            <span className="text-sm font-light">In lab blood test</span>
          </div>
          {/* <span className="text-xs font-light opacity-80">Free</span> */}
        </div>

        {/* At Home Card */}
        <div className="w-full max-w-[280px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <HiOutlineHome className="text-xl" />
            </div>
            <span className="text-sm font-light">At-home blood test</span>
          </div>
          {/* <span className="text-xs font-light opacity-80">$119</span> */}
        </div>
      </div>
    </div>
  );
};

export default BloodTestCards;
