/**
 * Seller Videos Page - Whop Embedded App
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Heading, Text, Button } from 'frosted-ui';
import { Video, Plus, Upload, Youtube, ExternalLink, Loader2 } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url?: string;
  duration?: number;
  status: string;
  source_type: string;
  created_at: string;
}

export default function SellerVideosPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get creator data from the hidden script tag
    const dataScript = document.getElementById('__SELLER_DATA__');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '{}');
        if (data.creatorId) {
          fetchVideos(data.creatorId);
        }
      } catch (e) {
        console.error('Failed to parse seller data:', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchVideos = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/video?creator_id=${creatorId}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading size="7" className="mb-2">Video Library</Heading>
          <Text size="3" className="text-gray-11">
            Manage and organize your video content
          </Text>
        </div>
        <Button variant="solid">
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-11" />
        </div>
      ) : videos.length === 0 ? (
        <Card size="3">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-purple-a3 rounded-full mb-4">
              <Video className="w-8 h-8 text-purple-11" />
            </div>
            <Heading size="5" className="mb-2">No videos yet</Heading>
            <Text size="3" className="text-gray-11 mb-6 max-w-md">
              Start building your video library by importing from YouTube, Loom, or uploading directly.
            </Text>
            <div className="flex gap-3">
              <Button variant="soft">
                <Youtube className="w-4 h-4 mr-2" />
                Import from YouTube
              </Button>
              <Button variant="soft">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} size="2" className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video bg-gray-a3 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Video className="w-12 h-12 text-gray-11" />
                )}
              </div>
              <Heading size="4" className="mb-1 line-clamp-2">{video.title}</Heading>
              <div className="flex items-center gap-2 text-gray-11">
                <Text size="2">{formatDuration(video.duration)}</Text>
                <span>•</span>
                <Text size="2" className="capitalize">{video.source_type}</Text>
                <span>•</span>
                <Text size="2" className="capitalize">{video.status}</Text>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
