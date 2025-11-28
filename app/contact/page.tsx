'use client';

import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create mailto link with form data
    const subject = encodeURIComponent(formState.subject || 'Contact from ChronosAI Website');
    const body = encodeURIComponent(
      `Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`
    );
    window.location.href = `mailto:support@chronos-ai.app?subject=${subject}&body=${body}`;

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-1">
        <LandingNav />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center">
              <div className="bg-gray-2 border border-gray-6 rounded-2xl p-8">
                <div className="w-16 h-16 bg-green-9/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-9" />
                </div>
                <h1 className="text-2xl font-bold text-gray-12 mb-2">Email Client Opened</h1>
                <p className="text-gray-11 mb-6">
                  Your email client should have opened with your message. If it didn&apos;t, you can email us directly at{' '}
                  <a href="mailto:support@chronos-ai.app" className="text-purple-11 hover:underline">
                    support@chronos-ai.app
                  </a>
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-purple-11 hover:text-purple-10 font-semibold"
                >
                  Send another message
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Have a question or need help? We&apos;re here for you.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-gray-2 border border-gray-6 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-9/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-purple-11" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-12 mb-1">Email Support</h3>
                    <p className="text-gray-11 text-sm mb-2">
                      For general inquiries and support requests.
                    </p>
                    <a
                      href="mailto:support@chronos-ai.app"
                      className="text-purple-11 hover:underline"
                    >
                      support@chronos-ai.app
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gray-2 border border-gray-6 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-9/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-11" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-12 mb-1">Community</h3>
                    <p className="text-gray-11 text-sm mb-2">
                      Join the Whop community for discussions and tips.
                    </p>
                    <a
                      href="https://discord.gg/whop"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-11 hover:underline"
                    >
                      Join Whop Discord →
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-9/20 to-blue-9/20 border border-purple-9/50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-12 mb-2">Response Time</h3>
                <p className="text-gray-11 text-sm">
                  We typically respond to all inquiries within 24-48 hours during business days.
                  Ultimate plan members receive priority support with faster response times.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-2 border border-gray-6 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-12 mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-12 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full bg-gray-3 border border-gray-6 rounded-lg px-4 py-2 text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-9"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-12 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full bg-gray-3 border border-gray-6 rounded-lg px-4 py-2 text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-9"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-12 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full bg-gray-3 border border-gray-6 rounded-lg px-4 py-2 text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-9"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-12 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full bg-gray-3 border border-gray-6 rounded-lg px-4 py-2 text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-9 resize-none"
                    placeholder="Tell us more about your question or issue..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 px-6 py-3 font-semibold rounded-lg text-white transition-all"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
