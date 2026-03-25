"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";

const CTAFinal = () => {
  return (
    <section className="bg-[#000d24] py-16 relative overflow-hidden font-sans">
      <div className="container mx-auto px-4 lg:px-16 relative z-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 md:p-20 text-center shadow-2xl"
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-light text-white mb-8 leading-[1.1] tracking-tight">
            Unlock the level of <br className="hidden md:block" /> insight you
            need
          </h2>

          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col gap-2">
              <p className="text-xl md:text-2xl text-white/50 font-light italic">
                Need help deciding?
              </p>
            </div>

            <Link href="/contact" className="group relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-[#000d24] px-10 py-5 rounded-full text-xl font-medium transition-all shadow-xl shadow-white/5 flex items-center gap-3 overflow-hidden"
              >
                <span>What we Test</span>
                <FaChevronRight className="text-sm group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTAFinal;
