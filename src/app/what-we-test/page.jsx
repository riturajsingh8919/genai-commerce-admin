import React from "react";
import WhatWeTestHero from "@/components/whatwetest/WhatWeTestHero";
import PricingSection from "@/components/sections/PricingSection";
import Biomarkers from "@/components/whatwetest/Biomarkers";

function WhatWeTest() {
  return (
    <main className="bg-[#000d24] min-h-screen">
      <WhatWeTestHero />
      <Biomarkers />
      <PricingSection />
    </main>
  );
}

export default WhatWeTest;
