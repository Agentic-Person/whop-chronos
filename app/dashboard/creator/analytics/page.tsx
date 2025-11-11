'use client';

import { BarChart, TrendingUp, Users, Video } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-7 font-bold text-gray-12">Analytics Dashboard</h1>
        <p className="text-3 text-gray-11 mt-1">
          Comprehensive insights into your video performance and student engagement
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="rounded-lg border border-gray-a4 bg-gray-a2 p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-9 opacity-20 blur-3xl rounded-full"></div>
            <div className="relative flex items-center justify-center gap-4">
              <BarChart className="w-12 h-12 text-blue-9" />
              <TrendingUp className="w-10 h-10 text-purple-9" />
              <Users className="w-10 h-10 text-green-9" />
              <Video className="w-10 h-10 text-orange-9" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-6 font-semibold text-gray-12">
              Advanced Analytics Coming Soon
            </h2>
            <p className="text-4 text-gray-11 max-w-2xl">
              We're building comprehensive analytics to help you understand your content performance,
              student engagement, and growth trends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mt-8">
            <FeatureCard
              icon={<BarChart className="w-6 h-6 text-blue-9" />}
              title="Video Performance"
              description="Track views, watch time, and completion rates across all your videos"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-purple-9" />}
              title="Growth Metrics"
              description="Monitor student enrollment, engagement trends, and retention over time"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-green-9" />}
              title="Student Insights"
              description="Understand how students interact with your content and where they need help"
            />
            <FeatureCard
              icon={<Video className="w-6 h-6 text-orange-9" />}
              title="Content Analysis"
              description="Identify your top-performing videos and optimize your content strategy"
            />
          </div>

          <div className="mt-8 p-4 bg-blue-a3 border border-blue-a6 rounded-lg max-w-2xl">
            <p className="text-3 text-blue-11">
              <strong>Note:</strong> In the meantime, you can view basic analytics on the{' '}
              <a href="/dashboard/creator/overview" className="underline hover:text-blue-12">
                Overview page
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-gray-a4 bg-gray-a2 hover:bg-gray-a3 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="space-y-1">
          <h3 className="text-4 font-semibold text-gray-12">{title}</h3>
          <p className="text-2 text-gray-11">{description}</p>
        </div>
      </div>
    </div>
  );
}
