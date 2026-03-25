"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Truck,
  RotateCcw,
  Shield,
  BatteryCharging,
  Gift,
  Tag,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    subtotal,
    taxAmount,
    shippingAmount,
    cartTotal,
    cartCount,
    settings,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    cartCurrency,
  } = useCart();

  const sym = getCurrencySymbol(cartCurrency);

  const [isMounted, setIsMounted] = React.useState(false);
  const [isGift, setIsGift] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState("");
  const [couponError, setCouponError] = React.useState("");
  const [isApplying, setIsApplying] = React.useState(false);

  // Sync gift flag to localStorage for checkout
  React.useEffect(() => {
    localStorage.setItem("nexring-is-gift", isGift ? "true" : "false");
  }, [isGift]);

  const badgeIcons = [Truck, RotateCcw, Shield, BatteryCharging];
  const featureBadges = (
    settings.featureBadges || [
      { label: "2-day shipping" },
      { label: "30-day returns" },
      { label: "1-year warranty" },
      { label: "Charger included" },
    ]
  ).map((b, i) => ({ ...b, icon: badgeIcons[i % badgeIcons.length] }));

  const membership = settings.membership || {
    name: "NexCura Membership",
    price: "5.99",
    description:
      "New members receive a free trial month. $5.99 USD/month afterwards.",
  };

  const regionalMembershipPrice =
    cart.length > 0 && cart[0].membershipPrice != null
      ? cart[0].membershipPrice
      : membership.price;

  const dynamicDescription = `New members receive a free trial month. ${sym}${formatPrice(regionalMembershipPrice, cartCurrency)} ${cartCurrency}/month afterwards.`;

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setIsApplying(true);
    setCouponError("");

    // Slight delay for UX feedback
    await new Promise((r) => setTimeout(r, 600));

    const result = applyCoupon(couponCode);
    if (!result.success) {
      setCouponError(result.error);
    } else {
      setCouponCode("");
    }
    setIsApplying(false);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#000d24] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0027ED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-[#000d24] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <ShoppingBag className="w-10 h-10 text-white/20" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-light text-white">
              Your Cart is Empty
            </h1>
            <p className="text-white/40 max-w-sm mx-auto">
              Add a NexRing to your collection and start tracking your health
              journey today.
            </p>
          </div>
          <Link
            href="/nxring"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0027ED] text-white rounded-full font-light uppercase tracking-widest text-xs hover:bg-[#0021c7] transition-all active:scale-95 cursor-pointer"
          >
            Explore NxRing <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000d24] text-white pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Cart Items */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-col space-y-4">
              <Link
                href="/nxring"
                className="inline-flex items-center gap-2 text-base font-light uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3 h-3 rotate-180" /> Back to Nxring
              </Link>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <h1 className="text-4xl font-serif font-light">
                  Shopping Cart
                </h1>
                <span className="text-white/40 text-sm">{cartCount} items</span>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-3">
              {featureBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full hover:border-[#8da0ff] transition-colors cursor-pointer"
                >
                  <badge.icon className="w-3.5 h-3.5 text-[#8da0ff]" />
                  <span className="text-sm font-light text-white/60 tracking-wide">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.selectedColor.name}-${item.selectedSize}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row gap-6 p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all"
                  >
                    {/* Item Image ... */}
                    <div className="w-full sm:w-32 h-32 relative bg-[#001233] rounded-2xl overflow-hidden shadow-xl border border-white/5">
                      <Image
                        src={
                          (item.selectedColor.heroAssets &&
                            item.selectedColor.heroAssets.find(
                              (a) => a.type === "image",
                            )?.url) ||
                          item.selectedColor.productImage ||
                          "/placeholder-ring.png"
                        }
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium mb-1">
                            {item.title}
                          </h3>
                          <p className="text-xs font-light uppercase tracking-widest text-white/60">
                            Finish: {item.selectedColor.name} | Size: {item.selectedSize}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            removeFromCart(item.id, item.selectedColor.name, item.selectedSize)
                          }
                          className="p-2 text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-full border border-white/10">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.selectedColor.name,
                                item.selectedSize,
                                item.quantity - 1,
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-light">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.selectedColor.name,
                                item.selectedSize,
                                item.quantity + 1,
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3">
                          {item.mrp > item.price && (
                            <div className="relative inline-block">
                              <span className="text-base text-white/30 font-light">
                                {sym}{formatPrice(item.mrp * item.quantity, cartCurrency)}
                              </span>
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
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="text-2xl font-light tracking-tight">
                            <span className="text-sm align-top mr-1 font-medium text-white/40">
                              {sym}
                            </span>
                            {formatPrice(item.price * item.quantity, cartCurrency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* NexCura Membership */}
            <div className="flex items-start gap-5 p-6 border-t border-white/10">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-[#97a8ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-base font-medium text-white">
                    {membership.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-[#97a8ff]">
                      FREE
                    </span>
                    <span className="text-sm text-white/30 line-through">
                      {formatPrice(regionalMembershipPrice, cartCurrency)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-white/40 font-light leading-relaxed">
                  {dynamicDescription}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-white/30 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-full">
                    HSA/FSA eligible
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="w-full lg:w-[380px]">
            <div className="sticky top-32 bg-white/5 border border-white/10 rounded-4xl p-8 space-y-8 backdrop-blur-xl shadow-2xl">
              <h2 className="text-2xl font-serif font-light">Order Summary</h2>

              {/* This is a gift */}
              <label className="flex items-center gap-3 p-4 bg-white/3 border border-white/10 rounded-2xl cursor-pointer group hover:border-white/20 transition-all">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-white/20 rounded-md peer-checked:bg-[#0027ED] peer-checked:border-[#0027ED] transition-all flex items-center justify-center">
                    {isGift && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <Gift className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                <span className="text-sm font-light text-white/60 group-hover:text-white/80 transition-colors">
                  This is a gift
                </span>
              </label>

              <div className="space-y-4">
                <div className="flex justify-between text-sm text-white/40 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white">{sym}{formatPrice(subtotal, cartCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/40 uppercase tracking-widest">
                  <span>Tax Amount</span>
                  <span className="text-white">{sym}{formatPrice(taxAmount, cartCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/40 uppercase tracking-widest">
                  <span>Shipping Cost</span>
                  <span className="text-white">
                    {sym}{formatPrice(shippingAmount, cartCurrency)}
                  </span>
                </div>

                {/* Promo Code Input */}
                <div className="pt-4 space-y-3">
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="text"
                            placeholder="PROMO CODE"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#0027ED] transition-all"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!couponCode || isApplying}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-light uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isApplying ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-red-400 ml-1 font-light italic">
                          {couponError}
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-[#0027ED]/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0027ED]/10 border border-[#0027ED]/20 rounded-lg flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-[#8da0ff]" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-white tracking-widest">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-[9px] text-[#8da0ff] font-light uppercase tracking-tighter">
                            Coupon Applied
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="p-2 text-white/20 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-[#8da0ff] uppercase tracking-widest font-medium">
                    <span>Discount</span>
                    <span>-{sym}{formatPrice(discountAmount, cartCurrency)}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-serif">Total</span>
                <span className="text-3xl font-light tracking-tight text-white">
                  <span className="text-base align-top mr-1 font-medium">
                    {sym}
                  </span>
                  {formatPrice(cartTotal, cartCurrency)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="group w-full py-6 bg-[#0027ED] hover:bg-[#0021c7] text-white rounded-2xl text-xs font-light uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
              >
                Checkout Now{" "}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="space-y-4 pt-4">
                <p className="text-base text-white/20 text-center uppercase tracking-[0.2em]">
                  Secure Checkout Powered by Stripe
                </p>
                <div className="flex justify-center gap-3 opacity-30 grayscale filter invert">
                  <Image
                    src="https://img.icons8.com/color/48/visa.png"
                    alt="Visa"
                    width={32}
                    height={32}
                  />
                  <Image
                    src="https://img.icons8.com/color/48/mastercard.png"
                    alt="Mastercard"
                    width={32}
                    height={32}
                  />
                  <Image
                    src="https://img.icons8.com/color/48/amex.png"
                    alt="Amex"
                    width={32}
                    height={32}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal / Policy Text */}
        <div className="mt-16 pt-8 border-t border-white/5 space-y-4">
          <p className="text-base text-white/40 leading-relaxed">
            By placing an order, you agree to the NexCura{" "}
            <Link
              href="/terms"
              className="underline hover:text-white/40 transition-colors"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline hover:text-white/40 transition-colors"
            >
              Privacy Policy
            </Link>
            . You may cancel at any time. All purchases, including pre‑paid
            items, are non‑refundable after 30 days.
          </p>
          <p className="text-base text-white/40 leading-relaxed">
            NexRing is manufactured by NexCura Health Labs. There are no returns
            or exchanges on sale items. Before you complete your purchase,
            please confirm that you have the latest firmware version available.
          </p>
          <p className="text-base text-white/40 leading-relaxed">
            To the extent allowed by law, the NexRing is provided to you without
            any warranty by NexCura. NexCura hereby disclaims all warranties
            (express, implied, and statutory) with respect to the device,
            including but not limited to the implied warranties of
            merchantability and fitness for a particular purpose.
          </p>
        </div>
      </div>
    </div>
  );
}
