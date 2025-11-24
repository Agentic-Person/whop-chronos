/**
 * Seller Product Page - Whop Embedded App
 *
 * Main dashboard page shown to sellers/creators.
 * Authentication is handled by the layout.
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Heading, Text, Button } from 'frosted-ui';
import { Video, BookOpen, BarChart3, ArrowRight } from 'lucide-react';

export default function SellerProductPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <Heading size="8" className="mb-2">Dashboard Overview</Heading>
        <Text size="4" className="text-gray-11">
          Welcome back! Here's how your content is performing.
        </Text>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-a3 rounded-lg">
                <Video className="w-6 h-6 text-purple-11" />
              </div>
              <div>
                <Heading size="5">Videos</Heading>
                <Text size="2" className="text-gray-11">Manage your content</Text>
              </div>
            </div>
            <Text size="2" className="text-gray-11">
              Upload, organize, and track your video content.
            </Text>
            <Link href={`/seller-product/${experienceId}/videos`} className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View Videos</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-a3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-11" />
              </div>
              <div>
                <Heading size="5">Courses</Heading>
                <Text size="2" className="text-gray-11">Build your curriculum</Text>
              </div>
            </div>
            <Text size="2" className="text-gray-11">
              Create and organize courses for your students.
            </Text>
            <Link href={`/seller-product/${experienceId}/courses`} className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View Courses</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        <Card size="3" className="hover:shadow-lg transition-shadow">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-a3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-11" />
              </div>
              <div>
                <Heading size="5">Analytics</Heading>
                <Text size="2" className="text-gray-11">Track performance</Text>
              </div>
            </div>
            <Text size="2" className="text-gray-11">
              View insights about your content and engagement.
            </Text>
            <Link href={`/seller-product/${experienceId}/analytics`} className="w-full">
              <Button variant="soft" className="w-full">
                <div className="flex items-center gap-2">
                  <span>View Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Getting Started */}
      <Card size="3">
        <div className="flex flex-col gap-4">
          <Heading size="5">Getting Started</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-a2 rounded-lg">
              <Text size="5" weight="bold" className="text-gray-12 mb-2">1. Upload Videos</Text>
              <Text size="2" className="text-gray-11">
                Import from YouTube, Loom, or upload directly.
              </Text>
            </div>
            <div className="p-4 bg-gray-a2 rounded-lg">
              <Text size="5" weight="bold" className="text-gray-12 mb-2">2. Create Courses</Text>
              <Text size="2" className="text-gray-11">
                Organize videos into structured courses.
              </Text>
            </div>
            <div className="p-4 bg-gray-a2 rounded-lg">
              <Text size="5" weight="bold" className="text-gray-12 mb-2">3. AI Chat</Text>
              <Text size="2" className="text-gray-11">
                Students can ask questions about your content.
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
