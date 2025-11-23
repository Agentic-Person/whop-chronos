/**
 * Seller Videos Page - Whop Embedded App
 */

'use client';

import { useParams } from 'next/navigation';
import { VideoManager } from '@/components/video/VideoManager';

export default function SellerVideosPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-12 mb-2">Video Library</h1>
        <p className="text-gray-11">Manage and organize your video content</p>
      </div>
      <VideoManager />
    </div>
  );
}
