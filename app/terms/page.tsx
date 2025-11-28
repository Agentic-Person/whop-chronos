import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-12 mb-4">Terms of Service</h1>
              <p className="text-gray-11">Last updated: November 28, 2024</p>
              <div className="mt-4 p-4 bg-yellow-9/20 border border-yellow-9/50 rounded-lg">
                <p className="text-sm text-yellow-11">
                  <strong>Note:</strong> This is a template terms of service. Please consult with a legal professional to ensure compliance with applicable laws and regulations.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-8 text-gray-11">
              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">1. Agreement to Terms</h2>
                <p>
                  By accessing or using ChronosAI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">2. Description of Service</h2>
                <p>
                  ChronosAI is an AI-powered video learning platform that helps creators transform their video content into interactive learning experiences. The Service includes video hosting, automatic transcription, AI-powered chat, analytics, and course management features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">3. User Accounts</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must have a Whop account to access ChronosAI</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You must be at least 13 years old to use the Service</li>
                  <li>One person or entity may not maintain multiple accounts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">4. Acceptable Use</h2>
                <p className="mb-4">You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload content that infringes intellectual property rights</li>
                  <li>Upload illegal, harmful, or offensive content</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Use the Service to distribute malware or spam</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Scrape or collect data from the Service without permission</li>
                  <li>Resell or redistribute access to the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">5. Content Ownership</h2>
                <h3 className="text-lg font-semibold text-gray-12 mt-4 mb-2">Your Content</h3>
                <p className="mb-4">
                  You retain ownership of all content you upload to the Service. By uploading content, you grant us a license to host, store, process, and display your content as necessary to provide the Service.
                </p>
                <h3 className="text-lg font-semibold text-gray-12 mt-4 mb-2">Our Content</h3>
                <p>
                  The Service and its original content (excluding user content), features, and functionality are owned by ChronosAI and are protected by intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">6. Subscription and Billing</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Subscriptions are billed through Whop on a recurring basis</li>
                  <li>All plans include a 3-day free trial</li>
                  <li>You may cancel your subscription at any time</li>
                  <li>Refunds are handled according to Whop&apos;s refund policy</li>
                  <li>We reserve the right to modify pricing with 30 days notice</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">7. Service Limitations</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Usage limits vary by subscription tier</li>
                  <li>AI features depend on third-party services and may have occasional downtime</li>
                  <li>We do not guarantee 100% accuracy of AI-generated content</li>
                  <li>We reserve the right to modify or discontinue features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">8. Termination</h2>
                <p className="mb-4">
                  We may terminate or suspend your account immediately, without prior notice, for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Non-payment of fees</li>
                  <li>Upon your request</li>
                </ul>
                <p className="mt-4">
                  Upon termination, your right to use the Service will immediately cease. You may download your content within 30 days of termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">9. Disclaimer of Warranties</h2>
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">10. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHRONOSAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">11. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless ChronosAI from any claims, damages, or expenses arising from your use of the Service, your content, or your violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">12. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">13. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-12 mb-4">14. Contact Us</h2>
                <p>
                  If you have questions about these Terms, please contact us at:
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
      </main>

      <Footer />
    </div>
  );
}
