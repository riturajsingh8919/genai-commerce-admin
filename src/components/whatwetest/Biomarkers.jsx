"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { BIOMARKER_GROUPS } from "@/lib/data/biomarkerData";

function AccordionItem({ title, content, isOpen, toggle }) {
  return (
    <div className="border border-[#e2e8f0]/30 bg-[#f1f1f1] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#cbd5e1]/50">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-5 text-left group cursor-pointer"
      >
        <span className="text-base font-medium text-[#1e293b] group-hover:text-[#0f172a]">
          {title}
        </span>
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300">
          {isOpen ? (
            <Minus className="w-4 h-4 text-[#64748b]" />
          ) : (
            <Plus className="w-4 h-4 text-[#64748b]" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-6 text-base leading-relaxed text-[#4f5d6f]">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Biomarkers() {
  const [openId, setOpenId] = useState(null); // format: "groupIndex-itemIndex"
  const [activeCategory, setActiveCategory] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);

  useEffect(() => {
    const observers = [];

    BIOMARKER_GROUPS.forEach((_, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Ignore observer updates during manual jump-scrolling
          if (isManualScrolling) return;

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveCategory(index);
            }
          });
        },
        { threshold: 0.1, rootMargin: "-20% 0px -70% 0px" },
      );

      const el = document.getElementById(`category-${index}`);
      if (el) observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [isManualScrolling]);

  const toggleAccordion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const scrollToSection = (id, index) => {
    const element = document.getElementById(id);
    if (!element) return;

    setIsManualScrolling(true);
    setActiveCategory(index);

    const offset = 100; // Account for general header
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });

    // Reset manual scroll flag after animation completes
    setTimeout(() => {
      setIsManualScrolling(false);
    }, 1000);

    setIsSidebarOpen(false);
  };

  return (
    <section className="bg-white border-t border-[#e2e8f0]/50 relative">
      {/* Vertically Centered Side Index Button */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-100">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-[#0027ED] text-white py-6 px-3 rounded-l-2xl shadow-[-10px_0_30px_rgba(0,39,237,0.2)] hover:pl-5 transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-light uppercase tracking-[0.2em]">
            Quick Index
          </div>
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Floating Sidebar Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-[#000d24]/60 backdrop-blur-sm z-1000 transition-all"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[320px] bg-white z-1001 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-[#e2e8f0]/60 flex items-center justify-between bg-[#f8fafc]">
                <div>
                  <h3 className="text-xl font-light text-[#0f172a] tracking-tight">
                    Biomarkers
                  </h3>
                  <p className="text-xs text-[#64748b] mt-1 font-medium italic">
                    Select a category
                  </p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-[#e2e8f0] rounded-full transition-colors cursor-pointer"
                >
                  <Minus className="w-5 h-5 text-[#64748b]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {BIOMARKER_GROUPS.map((group, gIndex) => (
                  <button
                    key={gIndex}
                    onClick={() =>
                      scrollToSection(`category-${gIndex}`, gIndex)
                    }
                    className={`w-full text-left px-5 py-4 rounded-xl text-[14px] font-light transition-all duration-300 cursor-pointer flex items-center justify-between ${
                      activeCategory === gIndex
                        ? "bg-[#0027ED] text-white shadow-xl shadow-[#0027ED]/20"
                        : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                    }`}
                  >
                    <span className="capitalize">{group.category}</span>
                    {activeCategory === gIndex && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-[#f8fafc] border-t border-[#e2e8f0]/60">
                <p className="text-[11px] text-[#94a3b8] font-light text-center uppercase tracking-widest">
                  Biomarker Library
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="py-8 md:py-16">
        <div className="container mx-auto px-4 lg:px-16">
          <div className="max-w-[1240px] mx-auto space-y-16">
            {BIOMARKER_GROUPS.map((group, gIndex) => (
              <div
                key={gIndex}
                id={`category-${gIndex}`}
                className="scroll-mt-32"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-[#e2e8f0] pb-6">
                  <h2 className="text-xl md:text-2xl font-sans font-medium text-[#0f172a] tracking-tight capitalize">
                    {group.category}
                  </h2>
                  <div className="mt-2 md:mt-0 text-[13px] font-medium text-[#94a3b8] tracking-wide">
                    {group.items.length} biomarkers
                  </div>
                </div>

                {/* Accordion Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {group.items.map((item, iIndex) => {
                    const id = `${gIndex}-${iIndex}`;
                    return (
                      <AccordionItem
                        key={id}
                        title={item.title}
                        content={item.content}
                        isOpen={openId === id}
                        toggle={() => toggleAccordion(id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Biomarkers;
