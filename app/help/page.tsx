'use client';

import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I get started with ChronosAI?',
        a: 'Simply sign up through Whop and choose your plan. All plans include a 3-day free trial. Once signed up, you can immediately start importing videos and building courses.',
      },
      {
        q: 'What video formats are supported?',
        a: 'ChronosAI supports YouTube videos, Loom recordings, and direct uploads (MP4, MOV, WebM). We automatically transcribe and index all video content.',
      },
      {
        q: 'How does the AI chat work?',
        a: 'Students can ask questions about your video content. Our AI searches through your transcripts and provides answers with clickable timestamps that jump to the exact moment in your videos.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    questions: [
      {
        q: 'How does the free trial work?',
        a: 'Every plan comes with a 3-day free trial. You can explore all features without entering payment information. After the trial, choose to continue or cancel at any time.',
      },
      {
        q: 'Can I change my plan later?',
        a: 'Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately, while downgrades apply at the end of your billing cycle.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, debit cards, and PayPal through our payment processor Whop.',
      },
      {
        q: 'What happens if I exceed my limits?',
        a: 'You\'ll receive a notification when approaching your limits. You can upgrade your plan to get more capacity, or wait until your monthly reset.',
      },
    ],
  },
  {
    category: 'Features & Usage',
    questions: [
      {
        q: 'What are AI credits?',
        a: 'AI credits are used for AI-powered features like chat responses, video transcription, and smart search. Credits reset monthly based on your plan.',
      },
      {
        q: 'Can I import my existing YouTube videos?',
        a: 'Yes! Simply paste the YouTube URL and ChronosAI will automatically import the video and generate a transcript. Your videos remain hosted on YouTube.',
      },
      {
        q: 'How do I organize my content into courses?',
        a: 'Use the Course Builder to create courses with modules. Drag and drop videos to organize them, add descriptions, and set the learning order.',
      },
      {
        q: 'Can my students download videos?',
        a: 'Videos are streamed securely and cannot be downloaded. This protects your content from unauthorized distribution.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'Is my content secure?',
        a: 'Yes. We use industry-standard encryption for all data. Your videos and student information are protected with enterprise-grade security.',
      },
      {
        q: 'What browsers are supported?',
        a: 'ChronosAI works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.',
      },
      {
        q: 'Do you have an API?',
        a: 'API access is available on Pro and Ultimate plans. Contact us for documentation and integration support.',
      },
    ],
  },
];

export default function HelpPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              Help Center
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Find answers to common questions about ChronosAI.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="max-w-3xl mx-auto space-y-12">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-bold text-gray-12 mb-6">{section.category}</h2>
                <div className="space-y-3">
                  {section.questions.map((faq, index) => {
                    const itemId = `${section.category}-${index}`;
                    const isOpen = openItems.includes(itemId);

                    return (
                      <div
                        key={index}
                        className="bg-gray-2 border border-gray-6 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-3 transition-colors"
                        >
                          <span className="font-semibold text-gray-12 pr-4">{faq.q}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-11 flex-shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-gray-11">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-16">
            <div className="bg-gray-2 border border-gray-6 rounded-2xl p-8 max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-gray-12 mb-2">Still have questions?</h3>
              <p className="text-gray-11 mb-4">
                Our support team is here to help you succeed.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 px-6 py-2 font-semibold rounded-lg text-white transition-all"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
