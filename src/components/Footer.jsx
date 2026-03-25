"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaLinkedin, FaInstagram } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-24 pb-12 font-sans overflow-hidden">
      <div className="container mx-auto px-4 lg:px-16">
        {/* 1. Top CTA Section */}
        <div className="flex flex-col items-center text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.1] max-w-4xl mb-10 tracking-tight"
          >
            The next generation of care, built for the people of today.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/contact"
              className="bg-[#0027ED] text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Get Started
            </Link>
          </motion.div>
        </div>

        {/* 2. Middle Divider */}
        <div className="w-full h-px bg-white/10 mb-16" />

        {/* 3. Links Section */}
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-8 items-start">
          <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-50 items-start">
            {/* Column 1: Product */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Link
                  href="/how-it-works"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  How it Works
                </Link>
                <Link
                  href="/what-we-test"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  What we Test
                </Link>
                <Link
                  href="/nxring"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  NxRing
                </Link>
                <Link
                  href="/enterprise-wellness"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  Enterprise Wellness
                </Link>
              </div>
            </div>

            {/* Column 2: Legal */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/404"
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  404
                </Link>
              </div>
            </div>
          </div>

          {/* Column 3: Social Icons */}
          <div className="flex flex-col gap-6 md:items-end">
            <div className="flex flex-col gap-4 items-start md:items-end">
              <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                Connect
              </span>

              {/* Social Icons - Directly beneath Connect */}
              <div className="flex items-center gap-6">
                <Link
                  href="https://www.linkedin.com/company/gen-ai-healthcare/posts/?feedView=all"
                  target="_blank"
                  className="text-2xl text-white hover:text-blue-500 transition-colors"
                >
                  <FaLinkedin />
                </Link>
                <Link
                  href="https://www.instagram.com/genaihealthcare/?hl=en"
                  target="_blank"
                  className="text-2xl text-white hover:text-pink-500 transition-colors"
                >
                  <FaInstagram />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Copyright */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} NexCura. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
