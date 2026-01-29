
import { Header } from "@/components/Header";
import CtaSection from "@/components/Home/CtaSection";
import { FAQSection } from "@/components/Home/FAQSection";
import FeaturesSection from "@/components/Home/FeaturesSection";
import Footer from "@/components/Home/Footer";
import { HeroSection } from "@/components/Home/HeroSection";
import PricingSection from "@/components/Home/PricingSection";
import { TestimonialsSection } from "@/components/Home/TestimonialsSection";

export default function Home() {
  return (
    <div className="">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CtaSection />
      <Footer />
    </div>
  );
}


