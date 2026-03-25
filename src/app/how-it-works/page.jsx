import React from "react";
import HowItWorksTimeline from "@/components/HowItWorksTimeline";
import PricingSection from "@/components/sections/PricingSection";

function Page() {
  return (
    <main className="bg-[#000d24]">
      {/* Hero Section */}
      <section className="relative pt-40 lg:pb-20 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-16 relative z-10">
          <div className="relative">
            <h1 className="text-5xl md:text-7xl font-light text-center text-white">
              How it <span className="italic">Works</span>
            </h1>
          </div>
        </div>

        {/* Background Gradient for Hero */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#5646a3]/10 blur-[120px] z-0" />
      </section>

      {/* Timeline Component */}
      <HowItWorksTimeline />
      <PricingSection />
    </main>
  );
}

export default Page;
