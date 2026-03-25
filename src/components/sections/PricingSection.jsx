"use client";

import React from "react";
import { motion } from "framer-motion";
import { HiCheck, HiOutlineViewGrid } from "react-icons/hi";
import { FaArrowRight } from "react-icons/fa";

import Link from "next/link";

const pricingPlans = [
  {
    name: "Essential",
    description: "Lab testing covering the foundations.",
    price: "$199",
    priceDetails: "(NxRing + 1 year subscription then $49.99/yr)",
    buttonText: "Get Essential",
    href: "/contact",
    features: [
      "Nx180",
      "2 dependent profiles as a caregiver",
      "NexCura AI Health Insights",
      "Unlimited uploads of past medical reports",
      "Life care pathways",
    ],
  },
  {
    name: "Comprehensive",
    description: "Lab testing built for optimization.",
    price: "$125",
    priceSuffix: "/month",
    priceDetails: "($1,499 billed annually)",
    buttonText: "Get Comprehensive",
    href: "/contact",
    isPopular: true,
    features: [
      "Free NxRing",
      "Nx360",
      "Radiology testing (MRI, CT)",
      "Clinician review of health data",
      "4 dependent profiles as a caregiver",
      "NexCura AI Health Insights",
      "Unlimited uploads of past medical reports",
      "Life care pathways",
    ],
  },
  {
    name: "Corporate Wellness",
    description: "Reduce your claims costs",
    price: "Contact Us",
    priceSuffix: "",
    priceDetails: "For Pricing",
    buttonText: "Get Corporate Wellness",
    href: "/contact",
    features: [
      "Free NxRing",
      "Aggregate health insights and ROI reporting",
      "Benefits platform integration",
      "Employee Wellness Dashboard",
    ],
  },
];

const PricingSection = () => {
  return (
    <section className="bg-[#000d24] py-16 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5646a3]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#5646a3]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Choose your path to health
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto font-light">
            Select the plan that fits your health goals and oversight needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-[#5646a3] rounded-3xl p-8 flex flex-col relative group overflow-hidden border border-white/10"
            >
              {/* Card Header Status */}
              <div className="flex items-center gap-2 mb-8 opacity-80">
                <HiOutlineViewGrid className="text-white/70" />
                <span className="text-xs uppercase tracking-widest text-white/70 font-medium">
                  {plan.name}
                </span>
              </div>

              <div className="mb-10">
                <h3 className="text-3xl font-light text-white mb-4">
                  {plan.name}
                </h3>
                <p className="text-white/80 text-sm mb-8 leading-relaxed h-12">
                  {plan.description}
                </p>

                <div className="flex flex-col gap-1 min-h-[100px] justify-center">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`${plan.price.length > 8 ? "text-3xl" : "text-5xl"} font-light text-white leading-tight`}
                    >
                      {plan.price}
                    </span>
                    {plan.priceSuffix && (
                      <span className="text-xl text-white/80 font-light">
                        {plan.priceSuffix}
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm font-light mt-1">
                    {plan.priceDetails}
                  </p>
                </div>
              </div>

              <Link href={plan.href} className="cursor-pointer mb-12">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white text-[#5646a3] py-4 rounded-xl text-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {plan.buttonText}
                </motion.button>
              </Link>

              <div className="grow">
                <ul className="space-y-4">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <HiCheck className="text-white mt-1 shrink-0" />
                      <span className="text-white/90 text-sm font-light leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subtle Inner Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
