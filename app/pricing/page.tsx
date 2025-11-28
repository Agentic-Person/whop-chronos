import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Basic',
    price: '$19',
    period: '/month',
    description: 'Perfect for creators just getting started',
    features: [
      '50 videos',
      '10GB storage',
      '1,000 AI credits/month',
      '100 students',
      'Video upload & transcription',
      'AI chat with timestamps',
      'Basic analytics',
      'Course builder',
    ],
    cta: 'Start Free Trial',
    href: 'https://whop.com/agentic-personnel-llc/chronos-basic/',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/month',
    description: 'For growing education businesses',
    features: [
      '500 videos',
      '100GB storage',
      '10,000 AI credits/month',
      '1,000 students',
      'Everything in Basic',
      'Bulk video upload',
      'Custom branding',
      'API access',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: 'https://whop.com/agentic-personnel-llc/chronos-pro/',
    highlighted: true,
  },
  {
    name: 'Ultimate',
    price: '$299',
    period: '/month',
    description: 'For established creators and teams',
    features: [
      'Unlimited videos',
      'Unlimited storage',
      'Unlimited AI credits',
      'Unlimited students',
      'Everything in Pro',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Start Free Trial',
    href: 'https://whop.com/agentic-personnel-llc/chronos-ultimate/',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Start with a 3-day free trial on any plan. No credit card required.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-purple-9/20 to-blue-9/20 border-2 border-purple-9'
                    : 'bg-gray-2 border border-gray-6'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-9 to-blue-9 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-12 mb-2">{tier.name}</h3>
                  <p className="text-gray-11 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-12">{tier.price}</span>
                    <span className="text-gray-11">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-9 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-11">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-purple-9 to-blue-9 text-white hover:from-purple-10 hover:to-blue-10'
                      : 'bg-gray-3 text-gray-12 hover:bg-gray-4 border border-gray-6'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-12 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-2 border border-gray-6 rounded-xl p-6">
                <h3 className="font-semibold text-gray-12 mb-2">How does the free trial work?</h3>
                <p className="text-gray-11">
                  Every plan comes with a 3-day free trial. You can explore all features without entering any payment information.
                  After the trial, you&apos;ll be prompted to choose a plan to continue.
                </p>
              </div>
              <div className="bg-gray-2 border border-gray-6 rounded-xl p-6">
                <h3 className="font-semibold text-gray-12 mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-gray-11">
                  Yes! You can change your plan at any time. If you upgrade, you&apos;ll get immediate access to the new features.
                  If you downgrade, the change takes effect at the end of your billing cycle.
                </p>
              </div>
              <div className="bg-gray-2 border border-gray-6 rounded-xl p-6">
                <h3 className="font-semibold text-gray-12 mb-2">What are AI credits?</h3>
                <p className="text-gray-11">
                  AI credits are used for AI-powered features like chat responses, video transcription, and smart search.
                  Credits reset monthly. Most creators find the Basic plan provides plenty of credits for moderate use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
