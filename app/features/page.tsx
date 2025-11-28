import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';
import { Clock, Zap, TrendingUp, Sparkles, MessageSquare, Video, BarChart3, Shield } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Save 10+ Hours Per Week',
    description: 'Stop answering the same questions over and over. ChronosAI handles student support automatically with AI-powered responses backed by your actual content.',
    gradient: 'from-purple-9 to-blue-9',
  },
  {
    icon: Zap,
    title: 'Automatic Transcription & Indexing',
    description: 'Upload your videos and ChronosAI automatically transcribes, indexes, and makes every word searchable. Students can find exactly what they need in seconds.',
    gradient: 'from-blue-9 to-cyan-9',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat with Timestamps',
    description: 'Students ask questions and get instant answers with clickable timestamps that jump directly to the relevant part of your videos.',
    gradient: 'from-cyan-9 to-teal-9',
  },
  {
    icon: Video,
    title: 'Multi-Source Video Import',
    description: 'Import videos from YouTube, Loom, or direct upload. ChronosAI works with your existing content library - no need to re-upload everything.',
    gradient: 'from-teal-9 to-green-9',
  },
  {
    icon: BarChart3,
    title: 'Student Analytics Dashboard',
    description: 'See which videos get watched, where students drop off, and what questions they ask most. Data-driven insights to improve your courses.',
    gradient: 'from-green-9 to-yellow-9',
  },
  {
    icon: TrendingUp,
    title: 'Increase Completion Rates',
    description: 'Interactive learning keeps students engaged. Creators using ChronosAI see course completion rates jump from 15% to 60%+.',
    gradient: 'from-yellow-9 to-orange-9',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'Your content is protected with end-to-end encryption. Student data is handled with care and full GDPR compliance.',
    gradient: 'from-orange-9 to-red-9',
  },
  {
    icon: Sparkles,
    title: 'Scale Without Burnout',
    description: 'Handle 10x the student load with 1/10th the stress. Your expertise multiplies without burning you out.',
    gradient: 'from-red-9 to-purple-9',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-1">
      <LandingNav />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-12 mb-4">
              Powerful Features for Modern Creators
            </h1>
            <p className="text-xl text-gray-11 max-w-2xl mx-auto">
              Transform your video courses into intelligent, self-teaching experiences that work while you sleep.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-2 border border-gray-6 rounded-2xl p-6 hover:border-gray-7 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-12 mb-2 group-hover:text-purple-11 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-11 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <a
              href="https://whop.com/agentic-personnel-llc/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-9 to-blue-9 hover:from-purple-10 hover:to-blue-10 px-8 py-3 text-lg font-semibold rounded-lg text-white transition-all"
            >
              Start Your Free Trial
            </a>
            <p className="text-gray-11 text-sm mt-3">
              3-day free trial • No credit card required
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
