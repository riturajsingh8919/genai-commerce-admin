"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("nexring-cart");
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [settings, setSettings] = useState({
    taxRate: "12",
    shippingCharges: "15",
    coupons: [],
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nexring-coupon");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  useEffect(() => {
    // Fetch global settings for taxes and shipping
    const fetchSettings = () => {
      fetch("/api/admin/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setSettings({
              taxRate: data.taxRate || "12",
              shippingCharges: data.shippingCharges || "15",
              featureBadges: data.featureBadges || [],
              membership: data.membership || null,
              coupons: data.coupons || [],
            });
          }
        })
        .catch((err) => console.error("Failed to sync store settings:", err));
    };

    fetchSettings();
    // Auto-refresh settings every 30 seconds for live admin updates
    const interval = setInterval(fetchSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("nexring-cart", JSON.stringify(cart));
  }, [cart]);
  
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("nexring-coupon", JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem("nexring-coupon");
    }
  }, [appliedCoupon]);

  const addToCart = (product, color, size, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) =>
          item.id === product.id && item.selectedColor.name === color.name && item.selectedSize === size,
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id && item.selectedColor.name === color.name && item.selectedSize === size
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [
        ...prevCart,
        {
          ...product,
          selectedColor: color,
          selectedSize: size,
          quantity,
          currency: product.currency || "USD",
          detectedCountry: product.detectedCountry || "US",
          taxRate: product.taxRate,
          shippingFee: product.shippingFee,
          membershipPrice: product.membershipPrice,
          coupons: product.coupons || [],
          discountPercent: product.discountPercent,
          startDate: product.startDate,
          endDate: product.endDate,
        },
      ];
    });
  };

  const removeFromCart = (productId, colorName, size) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(item.id === productId && item.selectedColor.name === colorName && item.selectedSize === size),
      ),
    );
  };

  const updateQuantity = (productId, colorName, size, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId, colorName, size);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.selectedColor.name === colorName && item.selectedSize === size
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code) => {
    if (!code) return { success: false, error: "Please enter a coupon code" };

    let coupon = (settings.coupons || []).find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    );

    // If coupon not found in global settings, it might be a regional-only code
    // we'll check validity against the item's whitelist below.
    if (!coupon) {
      coupon = { code: code.toUpperCase(), status: "Active" };
    }

    // Regional restriction & Discount % calculation:
    // If the cart has items and those items specify a whitelist of coupons for their region,
    // verify the applied coupon is in that list and use the regional discount percentage.
    const item = cart.length > 0 ? cart[0] : null;
    const validRegionalCoupons = item?.coupons || [];
    const regionalDiscountPercent = item?.discountPercent || null;
    const regionalStartDate = item?.startDate || null;
    const regionalEndDate = item?.endDate || null;

    if (validRegionalCoupons.length > 0 && !validRegionalCoupons.includes(code.toUpperCase())) {
      return { success: false, error: "This coupon is not valid in your selected region." };
    }

    const nowStr = new Date().toISOString().split("T")[0];

    // Check regional dates if they exist
    if (regionalStartDate && nowStr < regionalStartDate) {
      return { success: false, error: "This regional promotion is not yet active." };
    }
    if (regionalEndDate && nowStr > regionalEndDate) {
      return { success: false, error: "This regional promotion has expired." };
    }

    if (coupon.status !== "Active")
      return { success: false, error: "This coupon is no longer active" };

    const todayStr = nowStr;

    if (coupon.startDate && todayStr < coupon.startDate)
      return { success: false, error: "This coupon is not yet active" };

    if (coupon.endDate && todayStr > coupon.endDate)
      return { success: false, error: "This coupon has expired" };

    // Use regional discount percentage if available, otherwise use global coupon discount
    if (regionalDiscountPercent) {
      setAppliedCoupon({
        ...coupon,
        discount: `${regionalDiscountPercent}%`,
      });
    } else {
      setAppliedCoupon(coupon);
    }
    return { success: true };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Base items cost
  const subtotal =
    Math.round(
      cart.reduce((total, item) => total + item.price * item.quantity, 0) * 100,
    ) / 100;

  // Regional Overrides: Use settings from the first cart item if available
  const regionalTaxRate =
    cart.length > 0 && cart[0].taxRate !== undefined
      ? cart[0].taxRate
      : settings.taxRate;
  const regionalShippingFee =
    cart.length > 0 && cart[0].shippingFee !== undefined
      ? cart[0].shippingFee
      : settings.shippingCharges;

  // Dynamic calculations
  const taxAmount =
    Math.round(((subtotal * parseFloat(regionalTaxRate)) / 100) * 100) / 100;
  const shippingAmount = parseFloat(regionalShippingFee);

  let discountAmount = 0;
  if (appliedCoupon) {
    const val = appliedCoupon.discount;
    if (val.includes("%")) {
      const percent = parseFloat(val.replace("%", ""));
      discountAmount = Math.round(((subtotal * percent) / 100) * 100) / 100;
    } else {
      discountAmount = parseFloat(val.replace("$", ""));
    }
  }

  const cartTotal =
    Math.round((subtotal + taxAmount + shippingAmount - discountAmount) * 100) /
    100;

  // Currency for the cart — uses the first item's currency or defaults to USD
  const cartCurrency = cart.length > 0 ? (cart[0].currency || "USD") : "USD";

  return (
    <CartContext.Provider
        value={{
          cart,
          addToCart,
          removeFromCart,
          updateQuantity,
          clearCart,
          cartCount,
          subtotal,
          taxAmount,
          shippingAmount,
          cartTotal,
          appliedCoupon,
          applyCoupon,
          removeCoupon,
          discountAmount,
          cartCurrency,
          settings, // Export raw settings if needed
        }}
    >
      {children}
    </CartContext.Provider>
  );
};
