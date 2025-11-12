import { redirect } from 'next/navigation';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { VideoDemo } from '@/components/landing/VideoDemo';
import { InteractiveFAQ } from '@/components/landing/InteractiveFAQ';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export default function Page() {
  // In development mode with auth bypass, redirect to dashboard
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devBypass = process.env.DEV_BYPASS_AUTH === 'true';

  if (isDevelopment && devBypass) {
    redirect('/dashboard/creator/overview');
  }

  return (
    <div className="min-h-screen bg-gray-1">
      {/* Navigation */}
      <LandingNav />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Grid */}
      <FeatureGrid />

      {/* Video Demo */}
      <VideoDemo />

      {/* Interactive FAQ */}
      <InteractiveFAQ />

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
