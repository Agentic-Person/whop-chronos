import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { Shield, Lock, Server, Eye, Key, RefreshCw } from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encryption in Transit',
    description: 'All data transmitted between your browser and our servers is encrypted using TLS 1.3, the latest encryption standard.',
  },
  {
    icon: Server,
    title: 'Encryption at Rest',
    description: 'Your videos, transcripts, and personal data are encrypted when stored using AES-256 encryption.',
  },
  {
    icon: Key,
    title: 'Secure Authentication',
    description: 'We use Whop\'s secure authentication system with support for two-factor authentication.',
  },
  {
    icon: Eye,
    title: 'Access Controls',
    description: 'Role-based access controls ensure only authorized users can access your content.',
  },
  {
    icon: RefreshCw,
    title: 'Regular Backups',
    description: 'Your data is automatically backed up with point-in-time recovery capabilities.',
  },
  {
    icon: Shield,
    title: 'Security Monitoring',
    description: '24/7 monitoring for suspicious activity and automated threat detection.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-9/20 rounded-2xl mb-6">
              <Shield className="w-8 h-8 text-green-9" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              Security at ChronosAI
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Your content and data security is our top priority. Learn about the measures we take to keep your information safe.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-2 border border-gray-6 rounded-2xl p-6"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-9/20 rounded-xl mb-4">
                  <feature.icon className="w-6 h-6 text-green-9" />
                </div>
                <h3 className="text-lg font-bold text-gray-12 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-11 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Detailed Security Info */}
          <div className="max-w-3xl mx-auto space-y-8">
            <section className="bg-gray-2 border border-gray-6 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-12 mb-4">Infrastructure Security</h2>
              <div className="space-y-4 text-gray-11">
                <p>
                  ChronosAI is built on enterprise-grade infrastructure:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hosted on Vercel&apos;s secure global edge network</li>
                  <li>Database powered by Supabase with PostgreSQL and row-level security</li>
                  <li>Content delivery through secure CDN with DDoS protection</li>
                  <li>Automatic scaling to handle traffic spikes securely</li>
                </ul>
              </div>
            </section>

            <section className="bg-gray-2 border border-gray-6 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-12 mb-4">Data Protection</h2>
              <div className="space-y-4 text-gray-11">
                <p>
                  We implement comprehensive data protection measures:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>GDPR-compliant data handling practices</li>
                  <li>Data isolation between creator accounts</li>
                  <li>Secure deletion when you remove content</li>
                  <li>Limited data retention policies</li>
                  <li>Regular security audits and penetration testing</li>
                </ul>
              </div>
            </section>

            <section className="bg-gray-2 border border-gray-6 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-12 mb-4">AI & Content Security</h2>
              <div className="space-y-4 text-gray-11">
                <p>
                  Your content is handled securely throughout AI processing:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Video content is not used to train AI models</li>
                  <li>Transcripts are processed in isolated environments</li>
                  <li>AI responses are generated per-request without storing conversation context long-term</li>
                  <li>API calls to AI providers use encrypted connections</li>
                </ul>
              </div>
            </section>

            <section className="bg-gray-2 border border-gray-6 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-12 mb-4">Your Responsibilities</h2>
              <div className="space-y-4 text-gray-11">
                <p>
                  Help us keep your account secure:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use a strong, unique password for your Whop account</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Don&apos;t share your account credentials</li>
                  <li>Report suspicious activity immediately</li>
                  <li>Keep your devices and browsers updated</li>
                </ul>
              </div>
            </section>

            <section className="bg-gradient-to-r from-purple-9/20 to-blue-9/20 border border-purple-9/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-12 mb-4">Report a Security Issue</h2>
              <p className="text-gray-11 mb-4">
                We take security seriously. If you discover a vulnerability, please report it responsibly:
              </p>
              <a
                href="mailto:security@chronos-ai.app"
                className="inline-flex items-center gap-2 text-purple-11 hover:text-purple-10 font-semibold"
              >
                security@chronos-ai.app →
              </a>
              <p className="text-sm text-gray-11 mt-4">
                We appreciate responsible disclosure and will acknowledge your contribution.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
