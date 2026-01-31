"use client";

import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { OpenSourceSection } from "@/components/landing/open-source-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <LandingNavbar className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b" />
      <main className="flex-1 pt-14">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <OpenSourceSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
