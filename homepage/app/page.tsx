import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { LogosSection } from "@/components/landing/logos-section"
import { ProductShowcase } from "@/components/landing/product-showcase"
import { ScrollFrames } from "@/components/landing/scroll-frames"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { PricingSection } from "@/components/landing/pricing-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <HeroSection />
      <LogosSection />
      <ProductShowcase />
      <ScrollFrames />
      <FeaturesGrid />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
