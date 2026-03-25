"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const dates = [
  { day: "MON", date: 4 },
  { day: "TUE", date: 5 },
  { day: "WED", date: 6 },
  { day: "THU", date: 7 },
  { day: "FRI", date: 8 },
  { day: "SAT", date: 9 },
  { day: "SUN", date: 10 },
  { day: "MON", date: 11 },
];

const times = ["8:30", "8:40", "8:50", "9:00", "9:10", "9:20", "9:30", "9:40"];

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(8);
  const [selectedTime, setSelectedTime] = useState("9:00");

  return (
    <div className="bg-[#f5f0e5] rounded-2xl p-5 md:p-8 border border-[#e8e1d3] max-w-full relative overflow-hidden aspect-4/3 flex flex-col justify-center">
      {/* Date Selector */}
      <div className="relative">
        {/* Subtle Blur Overlays - Only at the absolute edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-[#f5f0e5] via-[#f5f0e5]/80 to-transparent z-10 pointer-events-none backdrop-blur-[1px]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-[#f5f0e5] via-[#f5f0e5]/80 to-transparent z-10 pointer-events-none backdrop-blur-[1px]"></div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 pt-2 px-8 scroll-smooth justify-start md:justify-center items-center h-[140px]">
          {dates.map((item) => (
            <motion.button
              key={item.date}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedDate(item.date)}
              className={`flex flex-col items-center justify-center min-w-[62px] h-[95px] rounded-xl border transition-all duration-500 shrink-0 ${
                selectedDate === item.date
                  ? "bg-[#5646a3] text-white border-transparent"
                  : "bg-[#fbf9f4] text-[#9a9187] border-[#ede9e1] hover:border-[#5646a3]/20"
              }`}
            >
              <span
                className={`text-[9px] uppercase font-light tracking-[0.2em] mb-2 ${selectedDate === item.date ? "text-white/70" : "text-[#b2a9a0]"}`}
              >
                {item.day}
              </span>
              <span className="text-xl font-light leading-none">
                {item.date}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time Selector */}
      <div className="relative">
        {/* Subtle Blur Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-[#f5f0e5] via-[#f5f0e5]/80 to-transparent z-10 pointer-events-none backdrop-blur-[1px]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-[#f5f0e5] via-[#f5f0e5]/80 to-transparent z-10 pointer-events-none backdrop-blur-[1px]"></div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-2 px-8 scroll-smooth justify-start md:justify-center items-center h-[80px]">
          {times.map((time) => (
            <motion.button
              key={time}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTime(time)}
              className={`flex items-center justify-center px-6 py-3.5 rounded-xl border transition-all duration-500 whitespace-nowrap shrink-0 ${
                selectedTime === time
                  ? "bg-[#5646a3] text-white border-transparent"
                  : "bg-[#fbf9f4] text-[#9a9187] border-[#ede9e1] hover:border-[#5646a3]/20"
              }`}
            >
              <span className="text-sm font-light">{time}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
