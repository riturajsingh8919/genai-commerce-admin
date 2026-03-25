"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import validator from "validator";
import { useRouter } from "next/navigation";
import { getCurrencySymbol, formatPrice } from "@/lib/currency";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

const STYLES = {
  input:
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#0027ED] transition-all",
  label:
    "block text-[10px] font-light uppercase tracking-widest text-white/40 mb-2 ml-1",
};

const AddressBlock = ({ addr, onChange, label, currency }) => {
  const isIndia = currency === "INR";
  return (
    <div className="space-y-4">
      {label && (
        <p className="text-xs font-light uppercase tracking-widest text-[#0027ED] ml-1">
          {label}
        </p>
      )}
      <div>
        <label className={STYLES.label}>Street Address</label>
        <input
          type="text"
          className={STYLES.input}
          placeholder={isIndia ? "House No, Street, Area" : "123 Street Name"}
          value={addr.address}
          onChange={(e) => onChange({ ...addr, address: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={STYLES.label}>City</label>
          <input
            type="text"
            className={STYLES.input}
            placeholder={isIndia ? "Mumbai" : "New York"}
            value={addr.city}
            onChange={(e) => onChange({ ...addr, city: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={STYLES.label}>{isIndia ? "State / UT" : "State"}</label>
          <input
            type="text"
            className={STYLES.input}
            placeholder={isIndia ? "Maharashtra" : "NY"}
            value={addr.state}
            onChange={(e) => onChange({ ...addr, state: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={STYLES.label}>{isIndia ? "PIN Code" : "ZIP Code"}</label>
          <input
            type="text"
            className={STYLES.input}
            placeholder={isIndia ? "400001" : "10001"}
            maxLength={isIndia ? 6 : 10}
            value={addr.zip}
            onChange={(e) => onChange({ ...addr, zip: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
};

const emptyAddr = { address: "", city: "", state: "", zip: "" };

const CheckoutForm = ({
  step,
  setStep,
  formData,
  setFormData,
  subtotal,
  taxAmount,
  shippingAmount,
  cartTotal,
  cart,
  isGift,
  appliedCoupon,
  discountAmount,
  cartCurrency,
}) => {
  const sym = getCurrencySymbol(cartCurrency);
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCart();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [isRecognizedUser, setIsRecognizedUser] = useState(false);
  const router = useRouter();

  // User checking logic
  useEffect(() => {
    const checkUser = async () => {
      if (!formData.email || !validator.isEmail(formData.email)) {
        setIsRecognizedUser(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/checkout/user-check?email=${encodeURIComponent(formData.email)}`,
        );
        const data = await res.json();

        if (data.exists) {
          setIsRecognizedUser(true);
          // Only pre-fill if fields are empty to avoid overwriting intentional changes
          setFormData((prev) => ({
            ...prev,
            name: prev.name || data.user.name || "",
            address: prev.address || data.user.address || "",
            city: prev.city || data.user.city || "",
            state: prev.state || data.user.state || "",
            zip: prev.zip || data.user.zip || "",
          }));
        } else {
          setIsRecognizedUser(false);
        }
      } catch (err) {
        console.error("User lookup failed:", err);
      }
    };

    const timer = setTimeout(checkUser, 800);
    return () => clearTimeout(timer);
  }, [formData.email, setFormData]);

  // Flatten cart items into individual units for specific address labeling
  const flattenedItems = cart.flatMap((item) =>
    Array(item.quantity).fill({
      ...item,
      variantLabel: `${item.selectedColor.name}, Size ${item.selectedSize}`,
    }),
  );

  const totalRingQty = flattenedItems.length;
  const [sameAddress, setSameAddress] = useState(true);
  // Extra addresses for ring 2, 3, etc. Index 0 = ring 2's addr, etc.
  const [extraAddresses, setExtraAddresses] = useState([]);
  // Which extra ring copies an earlier address (null = own address)
  const [copyFrom, setCopyFrom] = useState([]);

  // Sync address slots when sameAddress is toggled off
  const handleSameAddressToggle = (checked) => {
    setSameAddress(checked);
    if (!checked && totalRingQty > 1) {
      const needed = totalRingQty - 1;
      setExtraAddresses((prev) => {
        const arr = [...prev];
        const primaryAddrObj = {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        };
        while (arr.length < needed) arr.push({ ...primaryAddrObj });
        return arr.slice(0, needed);
      });
      setCopyFrom((prev) => {
        const arr = [...prev];
        while (arr.length < needed) arr.push(null);
        return arr.slice(0, needed);
      });
    }
  };

  useEffect(() => {
    if ((step === 2 || step === 3) && cartTotal > 0) {
      fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cartTotal,
          currency: (cartCurrency || "USD").toLowerCase(),
          metadata: {
            email: formData.email,
            name: formData.name,
          },
        }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    }
  }, [step, cartTotal, cartCurrency, formData.email, formData.name]);

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!formData.otp || formData.otp.length < 6) {
      setError("Please enter the complete 6-digit access code.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          email: formData.email,
          otp: formData.otp,
        }),
      });

      const data = await res.json();
      setProcessing(false);

      if (data.success) {
        setStep(3);
      } else {
        setError(
          data.error || "Invalid access code. Please check your transmission.",
        );
      }
    } catch (err) {
      setProcessing(false);
      setError("Authorizing failed. Please check your link to the Nxring.");
    }
  };

  // Generate a real reCAPTCHA v3 token.
  // Uses try-catch because execute() can throw SYNCHRONOUSLY if the site key
  // isn't registered yet — .catch() alone won't intercept that.
  const getRecaptchaToken = (action = "checkout_otp") =>
    new Promise((resolve) => {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) return resolve(null);

      const attemptExecute = () => {
        try {
          window.grecaptcha
            .execute(siteKey, { action })
            .then((token) => resolve(token))
            .catch(() => resolve(null));
        } catch (err) {
          console.warn("reCAPTCHA execute failed (suppressed):", err.message);
          resolve(null);
        }
      };

      // Poll until grecaptcha is loaded and has the ready() method
      const maxWait = 6000;
      const start = Date.now();
      const poll = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(attemptExecute);
        } else if (Date.now() - start < maxWait) {
          setTimeout(poll, 150);
        } else {
          console.warn("reCAPTCHA: timed out waiting for script");
          resolve(null);
        }
      };
      poll();
    });

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    // Basic validation if called from Step 1
    if (step === 1) {
      if (!validator.isEmail(formData.email)) {
        setError("Please enter a valid, professional email address.");
        return;
      }
      if (validator.isEmpty(formData.name)) {
        setError("Please enter your full name.");
        return;
      }
      // Validate primary address
      if (
        validator.isEmpty(formData.address) ||
        validator.isEmpty(formData.city) ||
        validator.isEmpty(formData.state) ||
        validator.isEmpty(formData.zip)
      ) {
        setError("All shipping fields are required for Ring 1.");
        return;
      }
      // Validate extra addresses when not same
      if (!sameAddress && totalRingQty > 1) {
        for (let i = 0; i < extraAddresses.length; i++) {
          if (copyFrom[i] !== null) continue; // copied from another ring, skip
          const a = extraAddresses[i];
          if (
            !a ||
            validator.isEmpty(a.address || "") ||
            validator.isEmpty(a.city || "") ||
            validator.isEmpty(a.state || "") ||
            validator.isEmpty(a.zip || "")
          ) {
            setError(`All shipping fields are required for Ring ${i + 2}.`);
            return;
          }
        }
      }
    }

    setProcessing(true);
    setError(null);

    try {
      // Get a real reCAPTCHA v3 token — required by the Lambda email service
      const recaptchaToken = await getRecaptchaToken("checkout_otp");
      console.log("reCAPTCHA token obtained:", !!recaptchaToken);

      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          email: formData.email,
          recaptchaToken,
        }),
      });
      const data = await res.json();
      setProcessing(false);

      if (data.success) {
        if (step === 1) setStep(2);
      } else {
        setError(
          data.error ||
            "Failed to transmit access code. Please verify your frequency.",
        );
      }
    } catch (err) {
      setProcessing(false);
      setError("Nxring interruption. Please re-attempt transmission.");
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (isRecognizedUser) {
      setStep(3);
    } else {
      handleSendOtp(e);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: formData.name,
            email: formData.email,
          },
        },
      });

    if (stripeError) {
      router.push(
        `/checkout/error?message=${encodeURIComponent("Your card was declined or the payment details are incorrect. Please verify and try again.")}`,
      );
      setProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      // Build shipping addresses array
      const buildAddresses = () => {
        const primary = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip}`;
        if (sameAddress || totalRingQty <= 1) {
          return Array(totalRingQty).fill(primary);
        }
        let addrs = [primary];
        if (!sameAddress) {
          for (let i = 0; i < extraAddresses.length; i++) {
            if (copyFrom[i] !== null) {
              addrs.push(addrs[copyFrom[i]]);
            } else {
              const a = extraAddresses[i];
              addrs.push(`${a.address}, ${a.city}, ${a.state} - ${a.zip}`);
            }
          }
        }
        return addrs;
      };

      const finalIsGift = localStorage.getItem("nexring-is-gift") === "true";

      // Payment successful, now save to DB and send email
      try {
        const res = await fetch("/api/checkout/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            formData,
            items: cart,
            total: cartTotal,
            isGift: finalIsGift,
            appliedCoupon: appliedCoupon
              ? {
                  code: appliedCoupon.code,
                  discount: appliedCoupon.discount,
                  amount: discountAmount,
                }
              : null,
            shippingAddresses: buildAddresses(),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Store important info in sessionStorage for the success page
          sessionStorage.setItem(
            "lastOrder",
            JSON.stringify({
              orderId: data.orderId,
              email: formData.email,
            }),
          );

          localStorage.removeItem("checkout-form-data"); // Clear persisted form data on success
          // Cart will be cleared on the success page to avoid empty-cart flash during redirect
          router.push("/checkout/success");
        } else {
          const errData = await res.json();
          router.push(
            `/checkout/error?message=${encodeURIComponent(errData.error || "The secure payment channel encountered an issue. Please attempt again in a few moments.")}`,
          );
          setProcessing(false);
        }
      } catch (err) {
        router.push(
          `/checkout/error?message=${encodeURIComponent("A network interruption occurred. Rest assured, no charges were made. Please check your connection and retry.")}`,
        );
        setProcessing(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-16">
      {/* Checkout Steps */}
      <div className="flex-1">
        <div className="mb-12 flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${step >= 1 ? "bg-[#0027ED] border-[#0027ED] text-white" : "border-white/10 text-white/20"}`}
          >
            {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
          </div>
          <div
            className={`h-px flex-1 transition-all ${step > 1 ? "bg-[#0027ED]" : "bg-white/10"}`}
          />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${step >= 2 ? "bg-[#0027ED] border-[#0027ED] text-white" : "border-white/10 text-white/20"}`}
          >
            {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : "2"}
          </div>
          <div
            className={`h-px flex-1 transition-all ${step > 2 ? "bg-[#0027ED]" : "bg-white/10"}`}
          />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${step >= 3 ? "bg-[#0027ED] border-[#0027ED] text-white" : "border-white/10 text-white/20"}`}
          >
            3
          </div>
        </div>

        <form
          onSubmit={
            step === 1
              ? handleNextStep
              : step === 2
                ? handleVerifyOtp
                : handleSubmitPayment
          }
          className="space-y-8"
        >
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <Link
                  href="/cart"
                  className="text-xs font-light uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2 mb-4 cursor-pointer w-fit"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Cart
                </Link>

                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={STYLES.label}>Full Name</label>
                      <input
                        type="text"
                        className={STYLES.input}
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className={STYLES.label}>Email Address</label>
                      <input
                        type="email"
                        className={STYLES.input}
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Primary Address — Ring 1 */}
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs font-light uppercase tracking-widest text-[#8da0ff] mb-4 ml-1">
                      {totalRingQty > 1
                        ? `${flattenedItems[0].variantLabel} — DELIVERY ADDRESS`
                        : "Delivery Address"}
                    </p>
                    <AddressBlock
                      addr={formData}
                      currency={cartCurrency}
                      onChange={(updated) =>
                        setFormData({ ...formData, ...updated })
                      }
                    />
                  </div>

                  {isRecognizedUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-[#0027ED]/10 border border-[#0027ED]/20 rounded-2xl flex items-center gap-3 text-[#8da0ff] text-xs font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Recognized profile! We&apos;ve pre-filled your details and
                      will skip the verification step.
                    </motion.div>
                  )}

                  {/* Multi-address logic */}
                  {totalRingQty > 1 && (
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={sameAddress}
                            onChange={(e) =>
                              handleSameAddressToggle(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 border-2 border-white/20 rounded-md peer-checked:bg-[#0027ED] peer-checked:border-[#0027ED] transition-all flex items-center justify-center">
                            {sameAddress && (
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
                        <span className="text-sm font-light text-white/60 group-hover:text-white/80 transition-colors">
                          All rings headed to the same address
                        </span>
                      </label>

                      <AnimatePresence>
                        {!sameAddress &&
                          extraAddresses.map((addr, i) => {
                            const ringNum = i + 2;
                            return (
                              <motion.div
                                key={`extra-${i}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-3 pt-4 border-t border-white/5"
                              >
                                <p className="text-xs font-light uppercase tracking-widest text-[#8da0ff] ml-1">
                                  {flattenedItems[i + 1].variantLabel} —
                                  Delivery Address
                                </p>

                                {/* Copy from options */}
                                {i > 0 && (
                                  <div className="space-y-2">
                                    {Array.from({ length: i + 1 }, (_, j) => (
                                      <label
                                        key={j}
                                        className="flex items-center gap-3 cursor-pointer group"
                                      >
                                        <div className="relative">
                                          <input
                                            type="checkbox"
                                            checked={copyFrom[i] === j}
                                            onChange={(e) => {
                                              setCopyFrom((prev) => {
                                                const next = [...prev];
                                                next[i] = e.target.checked
                                                  ? j
                                                  : null;
                                                return next;
                                              });
                                            }}
                                            className="sr-only peer"
                                          />
                                          <div className="w-4 h-4 border-2 border-white/20 rounded peer-checked:bg-[#0027ED] peer-checked:border-[#0027ED] transition-all flex items-center justify-center">
                                            {copyFrom[i] === j && (
                                              <svg
                                                className="w-2.5 h-2.5 text-white"
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
                                        <span className="text-xs font-light text-white/40 group-hover:text-white/60">
                                          Same address as{" "}
                                          {flattenedItems[j].variantLabel}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {/* Single ring only has one option */}
                                {i === 0 && (
                                  <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                      <input
                                        type="checkbox"
                                        checked={copyFrom[i] === 0}
                                        onChange={(e) => {
                                          setCopyFrom((prev) => {
                                            const next = [...prev];
                                            next[i] = e.target.checked
                                              ? 0
                                              : null;
                                            return next;
                                          });
                                        }}
                                        className="sr-only peer"
                                      />
                                      <div className="w-4 h-4 border-2 border-white/20 rounded peer-checked:bg-[#0027ED] peer-checked:border-[#0027ED] transition-all flex items-center justify-center">
                                        {copyFrom[i] === 0 && (
                                          <svg
                                            className="w-2.5 h-2.5 text-white"
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
                                    <span className="text-xs font-light text-white/40 group-hover:text-white/60">
                                      Same address as{" "}
                                      {flattenedItems[0].variantLabel}
                                    </span>
                                  </label>
                                )}

                                {/* Show address form only if not copying */}
                                {copyFrom[i] === null && (
                                  <AddressBlock
                                    addr={addr}
                                    currency={cartCurrency}
                                    onChange={(updated) => {
                                      setExtraAddresses((prev) => {
                                        const next = [...prev];
                                        next[i] = updated;
                                        return next;
                                      });
                                    }}
                                  />
                                )}
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-5 bg-[#0027ED] hover:bg-[#0021c7] disabled:opacity-50 text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Transmitting...
                    </>
                  ) : (
                    <>
                      {isRecognizedUser
                        ? "Continue to Payment"
                        : "Verify Email Address"}{" "}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            ) : step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-light uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2 mb-4 cursor-pointer w-fit"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Shipping
                </button>

                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Email Verification</h3>
                    <p className="text-sm text-white/40 font-light">
                      We&apos;ve sent a unique access code to{" "}
                      <span className="text-white font-medium">
                        {formData.email}
                      </span>
                      . Please enter it below to proceed to the secure payment
                      hub.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className={STYLES.label}>Security OTP Code</label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[9px] font-light uppercase tracking-[0.2em] text-white hover:text-[#ccc] transition-colors mb-2 mr-1 cursor-pointer"
                      >
                        Resend Code
                      </button>
                    </div>
                    <input
                      type="text"
                      className={`${STYLES.input} text-center tracking-[1em] text-2xl font-mono`}
                      placeholder="000000"
                      maxLength={6}
                      value={formData.otp || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, otp: e.target.value })
                      }
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleVerifyOtp}
                    className="w-full py-5 bg-[#0027ED] hover:bg-[#0021c7] disabled:opacity-50 text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Authorizing...
                      </>
                    ) : (
                      <>
                        Authorize & Pay{" "}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-light uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2 mb-4 cursor-pointer w-fit"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Verification
                </button>
                {/* ... existing payment fields ... */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">Payment Details</h3>
                    <div className="flex items-center gap-2 text-[10px] font-light uppercase tracking-[0.2em] text-white">
                      <Lock className="w-3 h-3" /> Secure Payment
                    </div>
                  </div>

                  <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                    <CardElement
                      options={{
                        hidePostalCode: true,
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#ffffff",
                            "::placeholder": {
                              color: "rgba(255, 255, 255, 0.2)",
                            },
                          },
                          invalid: {
                            color: "#ff4d4d",
                          },
                        },
                      }}
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    disabled={!stripe || processing || !clientSecret}
                    className="w-full py-6 bg-[#0027ED] hover:bg-[#0021c7] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-light uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : (
                      `Finalize Payment (${sym}${formatPrice(cartTotal, cartCurrency)})`
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Side Summary */}
      <div className="w-full lg:w-[380px]">
        <div className="bg-white/5 border border-white/10 rounded-4xl p-8 space-y-8 backdrop-blur-xl">
          <h2 className="text-2xl font-serif font-light">Order Summary</h2>

          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.selectedColor.name}-${item.selectedSize}`}
                className="flex gap-4"
              >
                <div className="w-16 h-16 relative bg-[#001233] rounded-xl overflow-hidden shrink-0 border border-white/5">
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
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="text-sm font-medium truncate">{item.title}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">
                    {item.selectedColor.name} | Size {item.selectedSize} x{" "}
                    {item.quantity}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.mrp > item.price && (
                      <div className="relative inline-block">
                        <span className="text-[10px] text-white/20 font-light">
                          {sym}
                          {formatPrice(item.mrp * item.quantity, cartCurrency)}
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
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm font-light">
                      {sym}
                      {formatPrice(item.price * item.quantity, cartCurrency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-xs text-white/40 uppercase tracking-wider">
              <span>Items Total</span>
              <span>
                {sym}
                {formatPrice(subtotal, cartCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-white/40 uppercase tracking-wider">
              <span>Standard Tax</span>
              <span>
                {sym}
                {formatPrice(taxAmount, cartCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-white/40 uppercase tracking-wider">
              <span>Secured Shipping</span>
              <span>
                {sym}
                {formatPrice(shippingAmount, cartCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-serif pt-4 border-t border-white/5">
              <span>Total</span>
              <span className="text-2xl font-light tracking-tight text-white">
                <span className="text-sm align-top mr-1 font-medium">
                  {sym}
                </span>
                {formatPrice(cartTotal, cartCurrency)}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center text-[#8da0ff] pt-2">
                <span className="text-[10px] uppercase tracking-widest font-light">
                  Coupon ({appliedCoupon.code})
                </span>
                <span className="text-sm font-light">
                  -{sym}
                  {formatPrice(discountAmount, cartCurrency)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CheckoutClient() {
  const {
    cart,
    subtotal,
    taxAmount,
    shippingAmount,
    cartTotal,
    cartCount,
    settings,
    appliedCoupon,
    discountAmount,
    cartCurrency,
  } = useCart();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [isGift] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nexring-is-gift") === "true";
    }
    return false;
  });

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("checkout-form-data");
      return saved
        ? { ...JSON.parse(saved), otp: "" }
        : {
            name: "",
            email: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            otp: "",
          };
    }
    return {
      name: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      otp: "",
    };
  });

  // Save changes to storage (excluding volatile OTP)
  useEffect(() => {
    const { otp, ...persistable } = formData;
    localStorage.setItem("checkout-form-data", JSON.stringify(persistable));
  }, [formData]);
  const router = useRouter();

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
        <h1 className="text-4xl font-serif font-light text-white mb-8">
          No Items to Checkout
        </h1>
        <Link
          href="/nxring"
          className="px-8 py-4 bg-[#0027ED] text-white rounded-full font-light uppercase tracking-widest text-xs hover:bg-[#0021c7]"
        >
          Explore NxRing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000d24] text-white pt-32 pb-24 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <Elements stripe={stripePromise}>
          <CheckoutForm
            step={step}
            setStep={setStep}
            formData={formData}
            setFormData={setFormData}
            subtotal={subtotal}
            taxAmount={taxAmount}
            shippingAmount={shippingAmount}
            cartTotal={cartTotal}
            cart={cart}
            isGift={isGift}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
            cartCurrency={cartCurrency}
          />
        </Elements>
      </div>
    </div>
  );
}
