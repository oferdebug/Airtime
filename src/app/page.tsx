
import Header from "@/components/Header";
import FeaturesSection from "@/components/Home/Features-Section-";
import { HeroSection } from "@/components/Home/Hero-Section";
import PricingSection from "@/components/Home/Pricing-Section";

export default function Home() {
  return (
    <div className="">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <PricingSection /> 
      {/* <CTASection /> */}
      {/* <Footer /> */}
    </div>
  );
}


