"use client";

import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-9999">
      <button
        type="button"
        onClick={scrollToTop}
        className={`
          flex items-center justify-center cursor-pointer w-12 h-12 rounded-full 
          bg-white/10 backdrop-blur-md border border-purple-400 text-purple-400 
          shadow-lg hover:bg-white/20 transition-all duration-300 ease-in-out 
          hover:scale-110 focus:outline-none
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
        `}
        aria-label="Scroll to top"
      >
        <FaArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ScrollToTop;
