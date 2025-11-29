'use client';

import { motion } from '@/components/motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  productId: string;
}

const plans: Plan[] = [
  {
    name: 'Basic',
    price: 19,
    description: 'Perfect for creators just getting started',
    productId: 'prod_EBif3VfbcnuTW',
    features: [
      { text: '50 videos', included: true },
      { text: '10GB storage', included: true },
      { text: '1,000 AI credits/month', included: true },
      { text: '100 students', included: true },
      { text: 'Video upload & transcription', included: true },
      { text: 'AI chat with timestamps', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Course builder', included: true },
    ],
  },
  {
    name: 'Pro',
    price: 79,
    description: 'For growing education businesses',
    productId: 'prod_Pn7wrYz5IC2Ug',
    popular: true,
    features: [
      { text: '500 videos', included: true },
      { text: '100GB storage', included: true },
      { text: '10,000 AI credits/month', included: true },
      { text: '1,000 students', included: true },
      { text: 'Everything in Basic', included: true },
      { text: 'Bulk video upload', included: true },
      { text: 'Custom branding', included: true },
      { text: 'API access', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    name: 'Ultimate',
    price: 299,
    description: 'For established creators and teams',
    productId: 'prod_K6Tg1sKkv3h4b',
    features: [
      { text: 'Unlimited videos', included: true },
      { text: 'Unlimited storage', included: true },
      { text: 'Unlimited AI credits', included: true },
      { text: 'Unlimited students', included: true },
      { text: 'Everything in Pro', included: true },
      { text: 'White-label options', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
    ],
  },
];

const faqs = [
  {
    question: 'How does the free trial work?',
    answer: 'Every plan comes with a 3-day free trial. You can explore all features without entering any payment information. After the trial, you\'ll be prompted to choose a plan to continue.',
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes! You can change your plan at any time. If you upgrade, you\'ll get immediate access to the new features. If you downgrade, the change takes effect at the end of your billing cycle.',
  },
  {
    question: 'What are AI credits?',
    answer: 'AI credits are used for AI-powered features like chat responses, video transcription, and smart search. Credits reset monthly. Most creators find the Basic plan provides plenty of credits for moderate use.',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-12 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg md:text-xl text-gray-11 max-w-2xl mx-auto">
            Start with a 3-day free trial on any plan. No credit card required.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                'relative rounded-2xl p-6 border',
                plan.popular
                  ? 'bg-gradient-to-b from-purple-a2 to-gray-2 border-purple-a7 shadow-xl shadow-purple-a3'
                  : 'bg-gray-2 border-gray-6'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-9 to-blue-9 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-12 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-11 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-12">${plan.price}</span>
                  <span className="text-gray-11">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-11 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-11">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <a
                href={`https://whop.com/checkout/${plan.productId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'block w-full text-center py-3 px-4 rounded-xl font-semibold transition-all',
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 text-white'
                    : 'bg-gray-3 border border-gray-6 text-gray-12 hover:bg-gray-4'
                )}
              >
                Start Free Trial
              </a>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-12 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-2 border border-gray-6 rounded-xl p-5"
              >
                <h4 className="font-semibold text-gray-12 mb-2">{faq.question}</h4>
                <p className="text-sm text-gray-11">{faq.answer}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
