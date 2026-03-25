"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Target,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";

const SOLUTION_AREAS = [
  "Health plans",
  "Healthcare providers",
  "Research",
  "Corporate gifting",
  "Government & defense",
  "Partners & resellers",
  "Athlete performance",
  "Employee benefits & programs",
  "Wellness & coaching",
];

const ORG_TYPES = [
  "Employer - Provide NxRing to Employees",
  "Insurance Provider",
  "Wellness Services Provider",
  "Benefits Consultancy",
  "Wellness Clinic",
  "Distributor",
  "Fitness Facility",
  "Health Technology",
  "Marketplace",
  "Government, Military, First Responders",
  "Non-profit",
  "Retailer",
  "Individual",
  "Other",
];

const COUNTRIES = [
  "United States 🇺🇸",
  "India 🇮🇳",
  "United Kingdom 🇬🇧",
  "Canada 🇨🇦",
  "Australia 🇦🇺",
  "Germany 🇩🇪",
  "France 🇫🇷",
  "Netherlands 🇳🇱",
  "Singapore 🇸🇬",
  "United Arab Emirates 🇦🇪",
  "Saudi Arabia 🇸🇦",
  "South Africa 🇿🇦",
  "Japan 🇯🇵",
  "South Korea 🇰🇷",
  "Brazil 🇧🇷",
  "Mexico 🇲🇽",
  "Italy 🇮🇹",
  "Spain 🇪🇸",
  "Sweden 🇸🇪",
  "Switzerland 🇨🇭",
  "Other",
];

const QUANTITIES = ["<5", "5–19", "20–49", "50–99", "100–499", "500+"];

const TIMELINES = [
  "1–3 Months",
  "4–6 Months",
  "7–12 Months",
  "Just Exploring / No Immediate Timeline",
];

const REFERRAL_SOURCES = [
  "Industry Event / Conference",
  "Referral",
  "Social Media",
  "Article / Publication",
  "NxRing Website",
  "Google Search",
  "LinkedIn",
  "Other",
];

export default function EnterpriseWellnessPage() {
  const [step, setStep] = useState(1); // 1 = Solution Area, 2 = Main Form, 3 = Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formStartTime, setFormStartTime] = useState(null);

  const [formData, setFormData] = useState({
    solutionArea: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationName: "",
    organizationType: "",
    jobTitle: "",
    country: "",
    ringQuantity: "",
    timeline: "",
    goals: "",
    referralSource: "",
    humanCheck: "",
    companyWebsite: "", // Honeypot
  });

  const [touched, setTouched] = useState({});

  const getFieldError = (name, value) => {
    if (!value && name !== "phone") return "This field is required";
    if (name === "email" && value && !/^\S+@\S+\.\S+$/.test(value))
      return "Please enter a valid email address";
    if (name === "humanCheck" && value && parseInt(value) !== 7)
      return "Incorrect answer. Please try again.";
    return null;
  };

  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleNext = () => {
    if (!formData.solutionArea) {
      setError("Please select a solution area to continue.");
      return;
    }
    setError(null);
    setStep(2);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/organization-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          formStartTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
        window.scrollTo({ top: 200, behavior: "smooth" });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to submit inquiry. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const STYLES = {
    label:
      "block text-[11px] font-medium text-white/40 uppercase tracking-widest mb-2.5 ml-1",
    input:
      "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#97a8ff] focus:ring-1 focus:ring-[#97a8ff] transition-all cursor-pointer",
    select:
      "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white appearance-none focus:outline-none focus:border-[#97a8ff] transition-all cursor-pointer",
    sectionTitle:
      "flex items-center gap-3 text-lg font-medium text-white mb-6 pt-4",
    sectionIcon: "w-5 h-5 text-[#97a8ff]",
    errorText: "text-[10px] text-red-400 mt-2 ml-1 animate-pulse",
  };

  const FormField = ({ label, name, type = "text", placeholder, options, required }) => {
    const error = touched[name] ? getFieldError(name, formData[name]) : null;
    const isSelect = type === "select";
    const isTextarea = type === "textarea";

    return (
      <div className="space-y-1">
        <label className={STYLES.label}>{label}{required ? "*" : ""}</label>
        <div className="relative">
          {isSelect ? (
            <select
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              onBlur={() => handleBlur(name)}
              className={`${STYLES.select} ${error ? 'border-red-400/50' : ''}`}
              required={required}
            >
              <option value="" disabled className="bg-[#000d24]">{placeholder}</option>
              {options.map(opt => (
                <option key={opt} value={opt} className="bg-[#000d24]">{opt}</option>
              ))}
            </select>
          ) : isTextarea ? (
            <textarea
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              onBlur={() => handleBlur(name)}
              rows={4}
              className={`${STYLES.input} resize-none ${error ? 'border-red-400/50' : ''}`}
              placeholder={placeholder}
              required={required}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleInputChange}
              onBlur={() => handleBlur(name)}
              className={`${STYLES.input} ${error ? 'border-red-400/50' : ''}`}
              placeholder={placeholder}
              required={required}
            />
          )}
          {isSelect && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
              <ChevronRight className="w-5 h-5 rotate-90" />
            </div>
          )}
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={STYLES.errorText}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#000d24] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/caregiver/3.png"
            alt="NxRing for Organizations"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#000d24] via-[#000d24]/40 to-transparent" />
        </div>

        <div className="container mx-auto px-6 lg:px-16 relative z-10 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h4 className="text-sm font-regular uppercase tracking-[0.3em] text-[#97a8ff] mb-4">
              Organizations & Partners
            </h4>
            <h1 className="text-5xl md:text-7xl font-sans font-extralight tracking-tight text-white mb-6 leading-[1.1]">
              Scale Health <br />
              <span className="opacity-80">Across Your Organization</span>
            </h1>
            <p className="text-xl text-white/60 font-light max-w-2xl leading-relaxed">
              Empower your members, employees, or patients with the world&apos;s
              most advanced biometric intelligence protocol.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-24 container mx-auto px-6 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/3 border border-white/10 p-10 md:p-16 rounded-[2.5rem] backdrop-blur-3xl"
              >
                <div className="mb-12">
                  <h2 className="text-3xl font-light mb-4">How can we help?</h2>
                  <p className="text-white/40 font-light">
                    Select a solution area to begin your inquiry.
                  </p>
                </div>

                <div className="space-y-8">
                  <FormField
                    label="Select a solution area"
                    name="solutionArea"
                    type="select"
                    placeholder="Choose an option below"
                    options={SOLUTION_AREAS}
                    required
                  />

                  {error && (
                    <div className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="group px-10 py-5 bg-white text-black rounded-full font-medium flex items-center gap-3 hover:bg-[#0027ED] hover:text-white transition-all duration-300 transform active:scale-95 cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleSubmit} className="space-y-12">
                  {/* Basic Info */}
                  <div className="bg-white/3 border border-white/10 p-10 md:p-14 rounded-[2.5rem] backdrop-blur-3xl">
                    <div className={STYLES.sectionTitle}>
                      <User className={STYLES.sectionIcon} />
                      Basic Information
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FormField
                        label="First Name"
                        name="firstName"
                        placeholder="John"
                        required
                      />
                      <FormField
                        label="Last Name"
                        name="lastName"
                        placeholder="Doe"
                        required
                      />
                      <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="john@organization.com"
                        required
                      />
                      <FormField
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* Organization Details */}
                  <div className="bg-white/3 border border-white/10 p-10 md:p-14 rounded-[2.5rem] backdrop-blur-3xl">
                    <div className={STYLES.sectionTitle}>
                      <Building2 className={STYLES.sectionIcon} />
                      Organization Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <FormField
                          label="Organization Name"
                          name="organizationName"
                          placeholder="Acme Health Corp"
                          required
                        />
                      </div>
                      <FormField
                        label="Organization Type"
                        name="organizationType"
                        type="select"
                        placeholder="Select type"
                        options={ORG_TYPES}
                        required
                      />
                      <FormField
                        label="Job Title / Role"
                        name="jobTitle"
                        placeholder="HR Director"
                        required
                      />
                      <div className="md:col-span-2">
                        <FormField
                          label="Country"
                          name="country"
                          type="select"
                          placeholder="Select country"
                          options={COUNTRIES}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product & Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white/3 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-3xl">
                      <div className={STYLES.sectionTitle}>
                        <Target className={STYLES.sectionIcon} />
                        Product Interest
                      </div>
                      <label className={STYLES.label}>
                        Quantity of NxRings*
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {QUANTITIES.map((q) => (
                          <label
                            key={q}
                            className={`cursor-pointer p-4 rounded-xl border transition-all text-center text-sm ${formData.ringQuantity === q ? "bg-[#0027ED] border-[#0027ED] text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}`}
                          >
                            <input
                              type="radio"
                              name="ringQuantity"
                              value={q}
                              checked={formData.ringQuantity === q}
                              onChange={handleInputChange}
                              onBlur={() => handleBlur("ringQuantity")}
                              className="sr-only cursor-pointer"
                              required
                            />
                            {q}
                          </label>
                        ))}
                      </div>
                      {touched.ringQuantity && getFieldError("ringQuantity", formData.ringQuantity) && (
                        <p className={STYLES.errorText}>{getFieldError("ringQuantity", formData.ringQuantity)}</p>
                      )}
                    </div>

                    <div className="bg-white/3 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-3xl">
                      <div className={STYLES.sectionTitle}>
                        <Calendar className={STYLES.sectionIcon} />
                        Timeline
                      </div>
                      <label className={STYLES.label}>
                        Implementation Timeline*
                      </label>
                      <div className="space-y-3">
                        {TIMELINES.map((t) => (
                          <label
                            key={t}
                            className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all text-sm ${formData.timeline === t ? "bg-[#0027ED]/10 border-[#0027ED] text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.timeline === t ? "border-white" : "border-white/20"}`}
                            >
                              {formData.timeline === t && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <input
                              type="radio"
                              name="timeline"
                              value={t}
                              checked={formData.timeline === t}
                              onChange={handleInputChange}
                              onBlur={() => handleBlur("timeline")}
                              className="sr-only cursor-pointer"
                              required
                            />
                            {t}
                          </label>
                        ))}
                        {touched.timeline && getFieldError("timeline", formData.timeline) && (
                          <p className={STYLES.errorText}>{getFieldError("timeline", formData.timeline)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Goals & Referral */}
                  <div className="bg-white/3 border border-white/10 p-10 md:p-14 rounded-[2.5rem] backdrop-blur-3xl">
                    <div className={STYLES.sectionTitle}>
                      <MessageSquare className={STYLES.sectionIcon} />
                      Additional Details
                    </div>
                    <div className="space-y-8">
                      <FormField
                        label="Tell us more about your goals"
                        name="goals"
                        type="textarea"
                        placeholder="Please describe your specific needs or questions..."
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <FormField
                          label="How did you hear about us?"
                          name="referralSource"
                          type="select"
                          placeholder="Select source"
                          options={REFERRAL_SOURCES}
                          required
                        />
                        <FormField
                          label="Verification: What is 3 + 4?"
                          name="humanCheck"
                          type="number"
                          placeholder="Type answer here"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Honeypot (Hidden) */}
                  <div className="hidden">
                    <input
                      type="text"
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleInputChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Consent & Submit */}
                  <div className="pt-8">
                    <p className="text-xs text-white/30 font-light leading-relaxed mb-10 max-w-2xl">
                      NxRing needs your contact information to reach out
                      regarding your inquiry about our products and services.
                      You may unsubscribe at any time. By submitting this form,
                      you agree to NxRing storing and processing your data.
                    </p>

                    {error && (
                      <div className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-5 rounded-2xl border border-red-400/20 mb-8">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-12 py-6 bg-[#0027ED] hover:bg-[#001dc7] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-medium text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(0,39,237,0.3)] hover:shadow-[0_0_30px_rgba(0,39,237,0.5)] transform active:scale-95 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Transmitting Inquiry...
                          </>
                        ) : (
                          <>
                            Submit Inquiry
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-white/40 hover:text-white text-sm font-light tracking-widest uppercase transition-colors cursor-pointer"
                      >
                        Change Solution Area
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/3 border border-white/10 p-12 md:p-20 rounded-[3rem] text-center backdrop-blur-3xl"
              >
                <div className="w-24 h-24 bg-[#97a8ff]/20 rounded-full flex items-center justify-center mx-auto mb-10">
                  <CheckCircle2 className="w-12 h-12 text-[#97a8ff]" />
                </div>
                <h2 className="text-4xl md:text-5xl font-light mb-6">
                  Inquiry Transmitted
                </h2>
                <p className="text-xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed mb-12">
                  Thank you for your interest in NxRing. Our partnership
                  protocol has been activated, and a specialist will contact you
                  at{" "}
                  <span className="text-white font-medium">
                    {formData.email}
                  </span>{" "}
                  within 24-48 business hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      setFormData({
                        ...formData,
                        solutionArea: "",
                        goals: "",
                        humanCheck: "",
                      });
                    }}
                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Decorative background accent */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-1/4 w-[80%] h-[80%] bg-[#97a8ff]/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-[#5646a3]/20 blur-[100px] rounded-full" />
      </div>
    </main>
  );
}
