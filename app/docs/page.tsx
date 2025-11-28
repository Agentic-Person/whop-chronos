import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { BookOpen, Video, MessageSquare, BarChart3, Upload, Settings } from 'lucide-react';
import Link from 'next/link';

const guides = [
  {
    icon: Upload,
    title: 'Getting Started',
    description: 'Learn how to set up your ChronosAI account and import your first videos.',
    href: '/help',
  },
  {
    icon: Video,
    title: 'Video Management',
    description: 'Import videos from YouTube, Loom, or upload directly. Manage your content library.',
    href: '/help',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Setup',
    description: 'Configure AI chat for your students with custom responses and behavior.',
    href: '/help',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Understand your analytics dashboard and track student engagement.',
    href: '/help',
  },
  {
    icon: BookOpen,
    title: 'Course Builder',
    description: 'Organize your videos into courses and modules for structured learning.',
    href: '/help',
  },
  {
    icon: Settings,
    title: 'Account Settings',
    description: 'Manage your subscription, billing, and account preferences.',
    href: '/help',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              Documentation
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Everything you need to get the most out of ChronosAI.
            </p>
          </div>

          {/* Quick Start */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-purple-9/20 to-blue-9/20 border border-purple-9/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-12 mb-4">Quick Start Guide</h2>
              <ol className="space-y-4 text-gray-11">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-9 rounded-full flex items-center justify-center text-white font-bold">1</span>
                  <div>
                    <strong className="text-gray-12">Sign up on Whop</strong>
                    <p>Create your account and choose a plan. All plans include a 3-day free trial.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-9 rounded-full flex items-center justify-center text-white font-bold">2</span>
                  <div>
                    <strong className="text-gray-12">Import Your Videos</strong>
                    <p>Add videos from YouTube, Loom, or upload directly. ChronosAI will automatically transcribe them.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-9 rounded-full flex items-center justify-center text-white font-bold">3</span>
                  <div>
                    <strong className="text-gray-12">Organize into Courses</strong>
                    <p>Use the course builder to create structured learning paths for your students.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-9 rounded-full flex items-center justify-center text-white font-bold">4</span>
                  <div>
                    <strong className="text-gray-12">Invite Your Students</strong>
                    <p>Share your Whop link with students. They can start learning and asking questions immediately.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {guides.map((guide, index) => (
              <Link
                key={index}
                href={guide.href}
                className="bg-gray-2 border border-gray-6 rounded-2xl p-6 hover:border-purple-9 transition-all group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gray-3 group-hover:bg-purple-9/20 transition-colors">
                  <guide.icon className="w-6 h-6 text-gray-11 group-hover:text-purple-11 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-12 mb-2 group-hover:text-purple-11 transition-colors">
                  {guide.title}
                </h3>
                <p className="text-gray-11 text-sm">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Contact Support */}
          <div className="text-center mt-16">
            <p className="text-gray-11 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <Link
              href="/contact"
              className="text-purple-11 hover:text-purple-10 font-semibold"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
