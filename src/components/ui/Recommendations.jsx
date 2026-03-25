"use client";

import React from "react";
import { motion } from "framer-motion";
import { MdRestaurant, MdScience, MdFitnessCenter } from "react-icons/md";

const recommendations = [
  {
    id: 1,
    category: "Foods",
    icon: <MdRestaurant />,
    details: "6oz Grilled Chicken Breast, 1 tsp Ghee, Organic Parsley...",
  },
  {
    id: 2,
    category: "Supplements",
    icon: <MdScience />,
    details: "600mg Ashwagandha, 500mg Curcumin, 100mg CoQ10...",
  },
  {
    id: 3,
    category: "Lifestyle",
    icon: <MdFitnessCenter />,
    details: "7–9 hrs sleep, Pranayama, Stretching, Muscle growth...",
  },
];

const Recommendations = () => {
  return (
    <div className="w-full h-full flex flex-col gap-3 justify-center bg-[#fbf9f4] rounded-2xl p-4 md:p-6 border border-[#ede9e1]">
      {recommendations.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.15 }}
          viewport={{ once: true }}
          whileHover={{ x: 5 }}
          className="bg-white rounded-xl p-3 border border-[#ede9e1]/50 flex items-center gap-4 transition-all duration-300"
        >
          {/* Icon Placeholder */}
          <div className="w-10 h-10 bg-[#5646a3] rounded-lg shrink-0 flex items-center justify-center text-white text-xl">
            {item.icon}
          </div>

          <div className="flex flex-col gap-0.5 overflow-hidden">
            <h4 className="text-sm font-light text-[#2d2d2d]">
              {item.category}
            </h4>
            <p className="text-[11px] text-[#9a9187] leading-tight line-clamp-1">
              {item.details}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Recommendations;
