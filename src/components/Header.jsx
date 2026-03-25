"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { cartCount } = useCart();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const navLinks = [
    { name: "How it Works", href: "/how-it-works" },
    { name: "What We Test", href: "/what-we-test" },
    { name: "NxRing", href: "/nxring" },
    { name: "Enterprise Wellness", href: "/enterprise-wellness" },
  ];

  return (
    <header className="absolute top-0 w-full z-50 py-4">
      <div className="container mx-auto px-4 lg:px-16">
        {/* Header Container with Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mt-1">
              <Image
                src="/logo.svg"
                alt="NxRing Logo"
                width={320}
                height={80}
                className="w-[120px] h-auto lg:w-[160px] lg:h-auto"
              />
            </Link>

            {/* Desktop Navigation - Center */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/70 text-lg font-light hover:text-white transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side - Cart & Contact */}
            <div className="flex items-center gap-4">
              <Link
                href="/cart"
                className="relative p-2 text-white/70 hover:text-white transition-colors group"
              >
                <ShoppingBag className="w-6 h-6" />
                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0027ED] text-white text-[10px] font-light w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:block">
                <Link
                  href="/contact"
                  className="group relative inline-flex items-center justify-center px-6 py-2 overflow-hidden rounded-full"
                >
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-md border border-white/30 rounded-full transition-all duration-300 group-hover:bg-white/30 group-hover:border-white/50" />
                  <span className="relative z-10 text-white text-sm font-medium">
                    Contact
                  </span>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white cursor-pointer"
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-1.5">
                  <span
                    className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
                  />
                  <span
                    className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
                  />
                  <span
                    className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 px-4 lg:px-16 mt-2 transition-all duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div className="container mx-auto">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/80 text-lg font-medium hover:text-white transition-colors duration-300 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/contact"
                className="mt-2 w-full py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-medium text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
