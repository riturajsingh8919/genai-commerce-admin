"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Key,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { id: 1, icon: <Users className="w-4 h-4" />, label: "Health Info" },
    { id: 2, icon: <CreditCard className="w-4 h-4" />, label: "Billing" },
    { id: 3, icon: <CheckCircle2 className="w-4 h-4" />, label: "Done" },
  ];

  return (
    <div className="flex items-center justify-center gap-6 mb-16 px-4">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center relative">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: currentStep >= s.id ? "#0027ED" : "rgba(255, 255, 255, 0.05)",
                borderColor: currentStep >= s.id ? "#0027ED" : "rgba(255, 255, 255, 0.1)",
                color: currentStep >= s.id ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-md transition-all z-10"
            >
              {currentStep > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
            </motion.div>
            <span className={`absolute -bottom-7 text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors ${
              currentStep >= s.id ? "text-white" : "text-white/30"
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="relative h-px w-12 md:w-20 bg-white/10 overflow-hidden rounded-full">
              <motion.div
                initial={false}
                animate={{ width: currentStep > s.id ? "100%" : "0%" }}
                className="absolute top-0 left-0 h-full bg-[#0027ED]"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ActivationContent = ({ initialEmail }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [dependentsCount, setDependentsCount] = useState(0);
  const [codes, setCodes] = useState([""]);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [verificationData, setVerificationData] = useState(null);
  const [planType, setPlanType] = useState("Essential");
  const [nextBillDate, setNextBillDate] = useState("");

  // Update codes array when dependentsCount changes
  useEffect(() => {
    const requiredLength = dependentsCount + 1;
    setCodes(prev => {
      const newCodes = [...prev];
      if (newCodes.length < requiredLength) {
        return [...newCodes, ...Array(requiredLength - newCodes.length).fill("")];
      } else if (newCodes.length > requiredLength) {
        return newCodes.slice(0, requiredLength);
      }
      return newCodes;
    });
  }, [dependentsCount]);

  // Robust Email Locking Logic
  useEffect(() => {
    const lockedEmail = sessionStorage.getItem("lockedActivationEmail");
    
    if (!lockedEmail && initialEmail) {
      sessionStorage.setItem("lockedActivationEmail", initialEmail);
      setEmail(initialEmail);
    } else if (lockedEmail) {
      setEmail(lockedEmail);
      if (initialEmail && decodeURIComponent(initialEmail) !== lockedEmail) {
        router.replace(`/activate-subscription/${encodeURIComponent(lockedEmail)}`);
      }
    } else {
      router.push("/");
    }
  }, [initialEmail, router]);

  const handleVerifyCodes = async () => {
    const activeCodes = codes.filter(c => c.trim() !== "");
    if (activeCodes.length === 0) {
      setError("Please enter at least one activation code.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/activate-subscription/verify-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: activeCodes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify codes");

      setVerificationData(data);
      const purchaseDate = new Date(data.createdAt);
      const nextYear = new Date(purchaseDate.setFullYear(purchaseDate.getFullYear() + 1));
      setNextBillDate(nextYear.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      
      const intentRes = await fetch("/api/activate-subscription/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentData.error || "Payment setup failed");
      setClientSecret(intentData.clientSecret);

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { email },
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/activate-subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          codes: codes.filter(c => c.trim() !== ""),
          orderId: verificationData.orderId,
          mainEmail: verificationData.purchaserEmail,
          planType,
          paymentMethodId: setupIntent.payment_method,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Activation failed");
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 relative z-10">
      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl"
          >
            <div className="text-center mb-10">
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Membership Portal</span>
              <h1 className="text-4xl font-serif text-white mb-4 tracking-tight">Activate Subscription</h1>
              <div className="bg-white/5 py-3 px-6 rounded-2xl inline-flex items-center gap-3 border border-white/10 group">
                 <ShieldCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                 <p className="text-sm text-white/70 font-medium">
                   Email: <span className="text-blue-400 font-bold">{email}</span>
                 </p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                  <Users className="w-3 h-3" />
                  How many dependents are you activating?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map(count => (
                    <button
                      key={count}
                      onClick={() => setDependentsCount(count)}
                      className={`relative overflow-hidden py-5 rounded-3xl border transition-all cursor-pointer ${
                        dependentsCount === count
                          ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/10"
                          : "border-white/5 bg-white/5 text-white/30 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <span className="relative z-10 text-lg font-bold">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                  <Key className="w-3 h-3" />
                  Enter NxRing Activation Codes
                </label>
                <div className="space-y-3">
                  {codes.map((code, idx) => (
                    <div key={idx} className="relative group">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        placeholder={`Activation Code #${idx + 1}`}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-sans font-medium tracking-wider cursor-pointer"
                        value={code}
                        onChange={(e) => {
                          const newCodes = [...codes];
                          newCodes[idx] = e.target.value.toUpperCase();
                          setCodes(newCodes);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                  <CreditCard className="w-3 h-3" />
                  Select your Plan Level
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "Essential", price: "$199", detail: "Foundation" },
                    { id: "Comprehensive", price: "$125", detail: "/ month" }
                  ].map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setPlanType(plan.id)}
                      className={`relative flex flex-col items-center p-6 rounded-4xl border transition-all cursor-pointer ${
                        planType === plan.id
                          ? "border-blue-500 bg-blue-500/20 text-white"
                          : "border-white/5 bg-white/5 text-white/30 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-[0.3em] font-bold mb-2 opacity-60">
                        {plan.id}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-serif">{plan.price}</span>
                        <span className="text-[10px] font-medium opacity-40">{plan.detail}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-10 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={handleVerifyCodes}
              disabled={processing || codes.every(c => !c.trim())}
              className="w-full mt-10 py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-3xl text-[11px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] cursor-pointer"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl"
          >
            <div className="text-center mb-10">
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">Secure Checkout</span>
              <h2 className="text-4xl font-serif text-white mb-2 tracking-tight">Billing Info</h2>
              <p className="text-white/50 text-sm font-medium">Primary: <span className="text-white/80">{verificationData?.purchaserEmail}</span></p>
            </div>

            <div className="bg-white/5 p-8 rounded-4xl border border-white/10 mb-10 text-center">
               <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-3 font-bold">First Bill Date</p>
               <p className="text-4xl font-bold font-serif text-white tracking-tight">{nextBillDate}</p>
               <p className="text-[10px] text-blue-400/60 mt-4 uppercase tracking-widest font-medium">
                 Annual charge after ring purchase window
               </p>
            </div>

            <form onSubmit={handleActivate} className="space-y-8">
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                   <CreditCard className="w-3 h-3" />
                   Card Details
                </label>
                <div className="p-6 bg-white rounded-2xl border border-white/10 shadow-inner cursor-pointer">
                  <CardElement
                    options={{
                      hidePostalCode: true,
                      style: {
                        base: {
                          fontSize: "18px",
                          color: "#1e293b",
                          fontFamily: "Outfit, sans-serif",
                          "::placeholder": { color: "#94a3b8" },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={processing}
                  className="flex-1 py-6 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-3xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-2 py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-3xl text-[11px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Activation"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-3xl p-16 rounded-[3rem] border border-white/10 text-center space-y-10"
          >
            <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl font-serif text-white tracking-tight">Activation Successful</h2>
              <div className="space-y-4">
                <p className="text-white/80 text-lg font-medium">
                  Welcome to the premium health journey. Your membership is now linked and active.
                </p>
                <p className="text-white/50 text-base leading-relaxed max-w-sm mx-auto">
                  To begin your health transformation, please <strong>log in to the NexRing Mobile App</strong>. From there, you can monitor your biometric data, manage your subscription, and access personalized insights designed for your wellbeing.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ActivationPage() {
  const params = useParams();
  const email = params.email ? decodeURIComponent(params.email) : "";

  return (
    <div className="min-h-screen bg-[#000d24] font-sans selection:bg-blue-500/30 overflow-x-hidden pt-32 pb-20 relative">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full" />
      
      <Elements stripe={stripePromise}>
        <ActivationContent initialEmail={email} />
      </Elements>
    </div>
  );
}
