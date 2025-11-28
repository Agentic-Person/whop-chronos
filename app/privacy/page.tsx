import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-12 mb-4">Privacy Policy</h1>
              <p className="text-gray-11">Last updated: November 28, 2024</p>
              <div className="mt-4 p-4 bg-yellow-9/20 border border-yellow-9/50 rounded-lg">
                <p className="text-sm text-yellow-11">
                  <strong>Note:</strong> This is a template privacy policy. Please consult with a legal professional to ensure compliance with applicable laws and regulations.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-gray max-w-none">
              <div className="space-y-8 text-gray-11">
                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">1. Introduction</h2>
                  <p>
                    ChronosAI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered video learning platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">2. Information We Collect</h2>
                  <h3 className="text-lg font-semibold text-gray-12 mt-4 mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Name and email address (provided through Whop)</li>
                    <li>Account credentials and preferences</li>
                    <li>Payment information (processed by Whop)</li>
                    <li>Communication records when you contact support</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-12 mt-4 mb-2">Usage Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Video viewing history and progress</li>
                    <li>Chat interactions with AI</li>
                    <li>Course enrollment and completion data</li>
                    <li>Device and browser information</li>
                    <li>IP address and approximate location</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-12 mt-4 mb-2">Content Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Videos uploaded by creators</li>
                    <li>Transcripts generated from videos</li>
                    <li>Course materials and descriptions</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To provide and maintain our service</li>
                    <li>To process video content and generate transcriptions</li>
                    <li>To power AI chat features and provide personalized responses</li>
                    <li>To track learning progress and provide analytics to creators</li>
                    <li>To communicate with you about your account and our services</li>
                    <li>To improve our platform and develop new features</li>
                    <li>To prevent fraud and ensure security</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">4. Information Sharing</h2>
                  <p className="mb-4">We may share your information with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Whop:</strong> Our platform partner for authentication and payments</li>
                    <li><strong>AI Service Providers:</strong> To process video transcriptions and power chat features</li>
                    <li><strong>Course Creators:</strong> Aggregated analytics about student engagement</li>
                    <li><strong>Service Providers:</strong> For hosting, analytics, and customer support</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">5. Data Security</h2>
                  <p>
                    We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure data centers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">6. Your Rights</h2>
                  <p className="mb-4">Depending on your location, you may have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access the personal information we hold about you</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your personal information</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt out of certain data processing activities</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us at support@chronos-ai.app
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">7. Cookies and Tracking</h2>
                  <p>
                    We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">8. Children&apos;s Privacy</h2>
                  <p>
                    Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">9. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-12 mb-4">10. Contact Us</h2>
                  <p>
                    If you have questions about this Privacy Policy, please contact us at:
                  </p>
                  <p className="mt-2">
                    <a href="mailto:support@chronos-ai.app" className="text-purple-11 hover:underline">
                      support@chronos-ai.app
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
