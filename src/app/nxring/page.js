"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  X,
  Box,
  Cpu,
  Weight,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useCountry } from "@/context/CountryContext";
import { useRouter } from "next/navigation";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";

const SIZE_OPTIONS = ["7", "8", "9", "10", "11", "12"];

export default function NexRingPage() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [colorWarning, setColorWarning] = useState("");
  const [sizeWarning, setSizeWarning] = useState("");

  useEffect(() => {
    if (colorWarning) {
      const timer = setTimeout(() => setColorWarning(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [colorWarning]);

  useEffect(() => {
    if (sizeWarning) {
      const timer = setTimeout(() => setSizeWarning(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [sizeWarning]);

  const checkColorInStock = (colorName, checkProduct = product) => {
    if (!checkProduct?.variants) return true; // Default to true if no variants (legacy support or loading)
    return checkProduct.variants.some(
      (v) =>
        v.color.toLowerCase() === colorName?.toLowerCase() &&
        parseInt(v.stock, 10) > 0,
    );
  };

  const checkSizeInStock = (size) => {
    if (!product?.variants) return true;
    const currentColorName = product.colors[selectedColorIndex]?.name;
    const variant = product.variants.find(
      (v) =>
        v.color.toLowerCase() === currentColorName?.toLowerCase() &&
        v.size === size,
    );
    if (!variant) return false;
    return parseInt(variant.stock, 10) > 0;
  };

  const [activeAssetIndex, setActiveAssetIndex] = useState(0);

  // Reset active asset when color changes
  useEffect(() => {
    setActiveAssetIndex(0);
  }, [selectedColorIndex]);

  const nextAsset = () => {
    const assets = currentColor.heroAssets || [];
    if (assets.length <= 1) return;
    setActiveAssetIndex((prev) => (prev + 1) % assets.length);
  };

  const prevAsset = () => {
    const assets = currentColor.heroAssets || [];
    if (assets.length <= 1) return;
    setActiveAssetIndex((prev) => (prev === 0 ? assets.length - 1 : prev - 1));
  };

  const handleCartAdd = async (e) => {
    if (!product) return;
    const color = product.colors[selectedColorIndex];
    if (color && !checkColorInStock(color.name)) return;
    if (!checkSizeInStock(selectedSize)) return;
    addToCart(product, color, selectedSize);
    router.push("/cart");
  };

  const nextColor = () => {
    if (!product?.colors) return;
    let nextIdx = (selectedColorIndex + 1) % product.colors.length;
    // Skip out of stock colors
    while (
      !checkColorInStock(product.colors[nextIdx].name) &&
      nextIdx !== selectedColorIndex
    ) {
      nextIdx = (nextIdx + 1) % product.colors.length;
    }
    setSelectedColorIndex(nextIdx);
  };

  const prevColor = () => {
    if (!product?.colors) return;
    let prevIdx =
      (selectedColorIndex - 1 + product.colors.length) % product.colors.length;
    // Skip out of stock colors
    while (
      !checkColorInStock(product.colors[prevIdx].name) &&
      prevIdx !== selectedColorIndex
    ) {
      prevIdx = (prevIdx - 1 + product.colors.length) % product.colors.length;
    }
    setSelectedColorIndex(prevIdx);
  };

  const { detectedCountry, loading: countryLoading } = useCountry();

  useEffect(() => {
    if (countryLoading) return; // Wait for country detection to complete

    const fetchProduct = async () => {
      try {
        const countryParam = detectedCountry ? `?country=${detectedCountry}` : "";
        const res = await fetch(`/api/products/nxring${countryParam}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          // Default to first available color
          const firstAvailableIdx = data.colors?.findIndex((c) => {
            if (!data?.variants) return true;
            return data.variants.some(
              (v) =>
                v.color.toLowerCase() === c.name.toLowerCase() &&
                parseInt(v.stock, 10) > 0,
            );
          });
          if (firstAvailableIdx !== -1 && firstAvailableIdx !== undefined) {
            setSelectedColorIndex(firstAvailableIdx);
            // Also pick first available size for this color
            const colorName = data.colors[firstAvailableIdx].name;
            const firstSize = SIZE_OPTIONS.find((s) => {
              const v = data.variants?.find(
                (v) =>
                  v.color.toLowerCase() === colorName.toLowerCase() &&
                  v.size === s,
              );
              return v && parseInt(v.stock, 10) > 0;
            });
            if (firstSize) setSelectedSize(firstSize);
            else setSelectedSize(SIZE_OPTIONS[0]);
          } else {
            setSelectedSize(SIZE_OPTIONS[0]);
          }
        } else {
          const allRes = await fetch("/api/admin/products");
          if (allRes.ok) {
            const allData = await allRes.json();
            if (allData.length > 0) {
              const prod = allData[0];
              setProduct(prod);
              const firstAvailableIdx = prod.colors?.findIndex((c) => {
                if (!prod?.variants) return true;
                return prod.variants.some(
                  (v) =>
                    v.color.toLowerCase() === c.name.toLowerCase() &&
                    parseInt(v.stock, 10) > 0,
                );
              });
              if (firstAvailableIdx !== -1 && firstAvailableIdx !== undefined) {
                setSelectedColorIndex(firstAvailableIdx);
                const colorName = prod.colors[firstAvailableIdx].name;
                const firstSize = SIZE_OPTIONS.find((s) => {
                  const v = prod.variants?.find(
                    (v) =>
                      v.color.toLowerCase() === colorName.toLowerCase() &&
                      v.size === s,
                  );
                  return v && parseInt(v.stock, 10) > 0;
                });
                if (firstSize) setSelectedSize(firstSize);
                else setSelectedSize(SIZE_OPTIONS[0]);
              } else {
                setSelectedSize(SIZE_OPTIONS[0]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch nxring product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [detectedCountry, countryLoading]);

  // Smart size selection when color changes
  useEffect(() => {
    if (!product || !product.variants) return;

    const currentColorName = product.colors[selectedColorIndex]?.name;
    const isCurrentSizeInStock = product.variants.some(
      (v) =>
        v.color.toLowerCase() === currentColorName?.toLowerCase() &&
        v.size === selectedSize &&
        parseInt(v.stock, 10) > 0,
    );

    if (!isCurrentSizeInStock) {
      const firstAvailableSize = SIZE_OPTIONS.find((s) => {
        const v = product.variants.find(
          (v) =>
            v.color.toLowerCase() === currentColorName?.toLowerCase() &&
            v.size === s,
        );
        return v && parseInt(v.stock, 10) > 0;
      });
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize);
      }
    }
  }, [selectedColorIndex, product, selectedSize]);

  if (loading || countryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000d24]">
        <div className="w-12 h-12 border-4 border-[#0027ED]/10 border-t-[#0027ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-light text-[#0f172a]">
            NxRing Artifact Not Detected
          </h1>
          <p className="text-[#64748b] max-w-md">
            The product database is currently out of sync. Please ensure a
            product with slug &quot;nxring&quot; exists in the admin panel.
          </p>
        </div>
      </div>
    );
  }

  const currentColor = product.colors[selectedColorIndex] || product.colors[0];

  return (
    <div className="bg-[#000d24] min-h-screen font-sans text-white selection:bg-[#0027ED]/30">
      {/* Hero Section */}
      <section className="relative pt-26 lg:pt-38 pb-4 lg:pb-24 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-[55%] relative group overflow-hidden bg-[#001233]/50 shadow-2xl aspect-[1.5/1]">
            <AnimatePresence>
              <motion.div
                key={`${selectedColorIndex}-${activeAssetIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {currentColor.heroAssets && currentColor.heroAssets.length > 0 ? (
                  currentColor.heroAssets[activeAssetIndex].type === "video" ? (
                    <video
                      src={currentColor.heroAssets[activeAssetIndex].url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <Image
                      src={currentColor.heroAssets[activeAssetIndex].url}
                      alt={currentColor.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  )
                ) : currentColor.productImage ? (
                  <Image
                    src={currentColor.productImage}
                    alt={currentColor.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#001233] text-[#64748b]">
                    No Image Data
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {((currentColor.heroAssets || []).length > 1) && (
              <div className="absolute inset-0 flex items-center justify-between px-6 z-10 pointer-events-none">
                <button
                  type="button"
                  onClick={prevAsset}
                  className="w-8 h-8 bg-[#000d24]/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white hover:text-[#000d24] transition-all cursor-pointer text-white pointer-events-auto border border-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextAsset}
                  className="w-8 h-8 bg-[#000d24]/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-white hover:text-[#000d24] transition-all cursor-pointer text-white pointer-events-auto border border-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Product Details (With Right-Side Container Padding) */}
          <div className="w-full lg:w-[45%] px-6 lg:pl-16 lg:pr-[5%] xl:pl-24 xl:pr-[10%] py-12 lg:py-0 text-[#0f172a]">
            <div className="flex flex-col space-y-10">
              <div>
                <h1 className="text-5xl lg:text-6xl font-sans font-light tracking-tight text-white mb-2 leading-tight">
                  {product.title}
                </h1>
                <div className="flex items-baseline gap-4 mt-6">
                  {product.mrp && product.mrp > product.price && (
                    <div className="relative inline-block">
                      <span className="text-2xl text-[#94a3b8] font-light">
                        {getCurrencySymbol(product.currency || "USD")}{" "}
                        {formatPrice(product.mrp, product.currency)}
                      </span>
                      {/* Single Line Bent Strike SVG */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="20"
                          y1="100"
                          x2="80"
                          y2="0"
                          stroke="#ff4d4d"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                  <span className="text-4xl font-light text-white tracking-tight">
                    <span className="text-lg align-top mr-1 font-medium text-white/60">
                      {getCurrencySymbol(product.currency || "USD")}
                    </span>
                    {formatPrice(product.price, product.currency)}
                  </span>
                </div>
              </div>

              {/* Colour Selection */}
              <div className="space-y-6">
                <h4
                  className={`text-[11px] font-light uppercase tracking-widest transition-all duration-300 ${!colorWarning && "text-[#64748b]"}`}
                >
                  {colorWarning ? (
                    <span className="text-rose-500 font-medium flex items-center gap-2 animate-pulse">
                      <AlertCircle className="w-3 h-3" /> {colorWarning}
                    </span>
                  ) : (
                    <>
                      Colour.{" "}
                      <span className="text-white">
                        Choose your favourite finish.
                      </span>
                    </>
                  )}
                </h4>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, index) => {
                    const isAvailable = checkColorInStock(color.name);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (!isAvailable) {
                            setColorWarning(
                              `${color.name} finish is currently sold out in your region`,
                            );
                          } else {
                            setSelectedColorIndex(index);
                          }
                        }}
                        onMouseEnter={() =>
                          !isAvailable &&
                          setColorWarning(
                            `${color.name} finish is currently sold out in your region`,
                          )
                        }
                        className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all group ${
                          !isAvailable
                            ? "opacity-50 cursor-not-allowed border-white/5 bg-white/5"
                            : "cursor-pointer"
                        } ${
                          selectedColorIndex === index
                            ? "border-white bg-white/10"
                            : isAvailable
                              ? "border-white/10 bg-transparent hover:border-white/20"
                              : "border-transparent"
                        }`}
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden border border-[#0027ED]/20 shadow-sm relative">
                          <Image
                            src={color.swatchImage}
                            alt={color.name}
                            width={1024}
                            height={1024}
                            className="w-full h-full object-cover"
                          />
                          {!isAvailable && (
                            <div className="absolute inset-0 bg-transparent flex items-center justify-center overflow-hidden">
                              <svg
                                className="w-full h-full pointer-events-none"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                              >
                                <line
                                  x1="20"
                                  y1="100"
                                  x2="80"
                                  y2="0"
                                  stroke="#ff4d4d"
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-light uppercase tracking-tight text-center leading-tight text-[#94a3b8] group-hover:text-white transition-colors">
                          {color.name}
                        </span>
                        {selectedColorIndex === index && (
                          <div className="absolute top-1 right-1 p-0.5 bg-[#0027ED] rounded-full">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Section */}
              <div className="space-y-6">
                <h4
                  className={`text-[11px] font-light uppercase tracking-widest transition-all duration-300 ${!sizeWarning && "text-[#64748b]"}`}
                >
                  {sizeWarning ? (
                    <span className="text-rose-500 font-medium flex items-center gap-2 animate-pulse">
                      <AlertCircle className="w-3 h-3" /> {sizeWarning}
                    </span>
                  ) : (
                    <>
                      Size.{" "}
                      <span className="text-white">Select your ring size.</span>
                    </>
                  )}
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  {SIZE_OPTIONS.map((size) => {
                    const isAvailable = checkSizeInStock(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (!isAvailable) {
                            setSizeWarning(
                              `Size ${size} is currently sold out in your region`,
                            );
                          } else {
                            setSelectedSize(size);
                          }
                        }}
                        onMouseEnter={() =>
                          !isAvailable &&
                          setSizeWarning(
                            `Size ${size} is currently sold out in your region`,
                          )
                        }
                        className={`relative group h-16 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 overflow-visible ${
                          !isAvailable
                            ? "opacity-60 cursor-not-allowed border-white/10 bg-white/5 text-white/80"
                            : isSelected
                              ? "border-white bg-white/10 text-white shadow-lg shadow-white/5"
                              : "border-white/25 bg-transparent hover:border-white/40 text-[#94a3b8] hover:text-white cursor-pointer"
                        }`}
                      >
                        <span
                          className={`text-xl tracking-tighter ${isSelected ? "font-medium" : "font-light"}`}
                        >
                          {size}
                        </span>

                        {/* Out of Stock Indicators */}
                        {!isAvailable && (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                              <svg
                                className="w-full h-full pointer-events-none opacity-60"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                              >
                                <line
                                  x1="0"
                                  y1="100"
                                  x2="100"
                                  y2="0"
                                  stroke="#ff4d4d"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </>
                        )}

                        {/* Selection Glow */}
                        {isSelected && (
                          <motion.div
                            layoutId="sizeGlow"
                            className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none"
                            initial={false}
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-[#0027ED]/10 pt-6">
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] font-light underline uppercase tracking-widest text-[#94a3b8] hover:text-white transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Info className="w-3 h-3" /> Don&apos;t know your size?
                  </button>
                </div>
              </div>

              {/* CTA Button */}
              <div className="fixed bottom-0 left-0 right-0 p-4 lg:relative lg:p-0 z-40 bg-[#000d24] lg:bg-transparent border-t border-white/5 lg:border-none">
                <button
                  onClick={handleCartAdd}
                  disabled={
                    !currentColor ||
                    !checkColorInStock(currentColor.name) ||
                    !checkSizeInStock(selectedSize) ||
                    product.status !== "Active"
                  }
                  className={`w-full py-6 rounded-lg text-sm font-light uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer ${
                    product.status !== "Active" ||
                    !checkColorInStock(currentColor.name) ||
                    !checkSizeInStock(selectedSize)
                      ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                      : "bg-[#0027ED] hover:bg-[#0021c7] text-white shadow-lg shadow-[#0027ED]/20"
                  }`}
                >
                  {product.status !== "Active"
                    ? product.status === "Out of Stock"
                      ? "Sold Out Globally"
                      : "Currently Unavailable"
                    : !checkColorInStock(currentColor.name) ||
                        !checkSizeInStock(selectedSize)
                      ? "Variant Out of Stock"
                      : product.getStartedText || "Get Started"}{" "}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications Section */}
      <section className="pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-5xl font-sans font-light tracking-tighter text-white">
              Technical Specifications
            </h2>
            <div className="h-px w-24 bg-white/20 mx-auto mt-8 rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-1 text-white">
            {/* Model Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 py-12 border-b border-white/5">
              <h5 className="text-[11px] font-light uppercase tracking-[0.2em] text-[#64748b] mb-4 lg:mb-0">
                Model Identity
              </h5>
              <div className="lg:col-span-2">
                <p className="text-xl font-medium text-white/90">
                  {product.techSpecs?.model || "Ring Model: Ring AIR"}
                </p>
              </div>
            </div>

            {/* Body Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 py-12 border-b border-white/5">
              <h5 className="text-[11px] font-light uppercase tracking-[0.2em] text-[#64748b] mb-4 lg:mb-0">
                Chassis & Form
              </h5>
              <div className="lg:col-span-2 space-y-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-light uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Box className="w-3 h-3" /> Dimensions
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.techSpecs?.body?.dimensions?.map((dim, i) => (
                      <p
                        key={i}
                        className="text-lg text-white/80 font-medium border-l border-white/10 pl-4"
                      >
                        {dim}
                      </p>
                    )) || (
                      <>
                        <p className="text-lg text-white/80 font-medium border-l border-white/10 pl-4">
                          Width - 8.1mm
                        </p>
                        <p className="text-lg text-white/80 font-medium border-l border-white/10 pl-4">
                          Thickness - 2.45 - 2.8 mm
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-light uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Weight className="w-3 h-3" /> Weight Profile
                  </p>
                  <p className="text-lg text-white/80 font-medium border-l border-white/10 pl-4">
                    {product.techSpecs?.body?.weight ||
                      "2.4 - 3.6 g (varies with size)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Material Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 py-12 border-b border-white/5">
              <h5 className="text-[11px] font-light uppercase tracking-[0.2em] text-[#64748b] mb-4 lg:mb-0">
                Casing Materials
              </h5>
              <div className="lg:col-span-2 space-y-6">
                {product.techSpecs?.body?.material?.map((mat, i) => (
                  <p
                    key={i}
                    className="text-lg leading-relaxed text-white/80 font-medium"
                  >
                    {mat}
                  </p>
                )) || (
                  <p className="text-lg leading-relaxed text-[#64748b] font-medium italic opacity-40">
                    Materials data not synchronized.
                  </p>
                )}
              </div>
            </div>

            {/* Connectivity Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 py-12 border-b border-white/5">
              <h5 className="text-[11px] font-light uppercase tracking-[0.2em] text-[#64748b] mb-4 lg:mb-0">
                Connectivity Hub
              </h5>
              <div className="lg:col-span-2 space-y-4">
                {product.techSpecs?.connectivity?.map((conn, i) => (
                  <div
                    key={i}
                    className="text-lg text-white/80 font-medium flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />{" "}
                    {conn}
                  </div>
                )) || (
                  <p className="text-lg text-[#64748b] font-medium italic opacity-40">
                    Connectivity protocols pending update.
                  </p>
                )}
              </div>
            </div>

            {/* Sensors Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 pt-12">
              <h5 className="text-[11px] font-light uppercase tracking-[0.2em] text-[#64748b] mb-4 lg:mb-0">
                Onboard Biosensors
              </h5>
              <div className="lg:col-span-2 space-y-4">
                {product.techSpecs?.sensors?.map((sensor, i) => (
                  <div
                    key={i}
                    className="text-base text-white/70 font-medium flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    <Cpu className="w-4 h-4 text-white/40" /> {sensor}
                  </div>
                )) || (
                  <p className="text-lg text-[#64748b] font-medium italic opacity-40">
                    Sensor array data not detected.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowSizeGuide(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#000d24] border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 flex justify-between items-center border-b border-white/10">
                <h3 className="text-xl font-light uppercase tracking-widest text-white">
                  Sizing Artifact
                </h3>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 aspect-video relative bg-[#001233]/30">
                {product.sizeGuide ? (
                  <Image
                    src={product.sizeGuide}
                    alt="Size Guide"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                    <Info className="w-12 h-12 text-[#64748b]" />
                    <p className="text-[#64748b] font-medium italic">
                      Size guide asset not available for this artifact.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
