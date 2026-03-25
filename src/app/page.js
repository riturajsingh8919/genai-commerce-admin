import HeroVideo from "@/components/HeroVideo";
import HowItWorks from "@/components/HowItWorks";
import CaregiverSection from "@/components/sections/CaregiverSection";
import CaregiverFeatures from "@/components/sections/CaregiverFeatures";
import NxRingFeatures from "@/components/sections/NxRingFeatures";
import CTAFinal from "@/components/sections/CTAFinal";
import PricingSection from "@/components/sections/PricingSection";

export default function Home() {
  return (
    <main>
      <HeroVideo />
      <HowItWorks />
      <CaregiverSection />
      <CaregiverFeatures />
      <NxRingFeatures />
      <CTAFinal />
      <PricingSection />
    </main>
  );
}
