/**
 * Test Analytics Dashboard - No Auth Required
 * View Phase 4 analytics with seed data
 */

import { createClient } from '@supabase/supabase-js'
import { Card, Heading, Text } from 'frosted-ui'

const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

async function getAnalyticsData() {
  // Get videos with analytics
  const { data: videos } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      duration_seconds,
      status,
      created_at,
      video_analytics (
        views,
        unique_viewers,
        completion_rate,
        total_watch_time_seconds,
        ai_interactions,
        date
      )
    `)
    .eq('creator_id', TEST_CREATOR_ID)
    .order('created_at', { ascending: false })

  // Get usage metrics
  const { data: usageMetrics } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', TEST_CREATOR_ID)
    .order('date', { ascending: false })
    .limit(7)

  // Get chat analytics
  const { data: chatAnalytics } = await supabase
    .from('chat_cost_analytics')
    .select('*')
    .eq('creator_id', TEST_CREATOR_ID)
    .order('date', { ascending: false })
    .limit(7)

  // Get courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('creator_id', TEST_CREATOR_ID)

  return {
    videos: videos || [],
    usageMetrics: usageMetrics || [],
    chatAnalytics: chatAnalytics || [],
    courses: courses || [],
  }
}

export default async function TestAnalyticsPage() {
  const data = await getAnalyticsData()

  // Calculate totals
  const totalVideos = data.videos.length
  const totalViews = data.videos.reduce((sum, video) => {
    return sum + (video.video_analytics?.reduce((s: number, a: any) => s + (a.views || 0), 0) || 0)
  }, 0)

  const totalAIInteractions = data.videos.reduce((sum, video) => {
    return sum + (video.video_analytics?.reduce((s: number, a: any) => s + (a.ai_interactions || 0), 0) || 0)
  }, 0)

  const weeklyUsage = data.usageMetrics.reduce((acc, day) => ({
    storage: acc.storage + (day.storage_used_bytes || 0),
    aiCredits: acc.aiCredits + (day.ai_credits_used || 0),
    transcription: acc.transcription + (day.transcription_minutes || 0),
    chatMessages: acc.chatMessages + (day.chat_messages_sent || 0),
  }), { storage: 0, aiCredits: 0, transcription: 0, chatMessages: 0 })

  const totalChatCost = data.chatAnalytics.reduce((sum, day) => sum + (day.total_cost || 0), 0)

  return (
    <div className="min-h-screen bg-gray-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Heading size="8" className="mb-2">
            🧪 Test Analytics Dashboard
          </Heading>
          <Text size="4" className="text-gray-11">
            Phase 4 Analytics with Seed Data • Creator: test.creator@example.com
          </Text>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex flex-col gap-2">
              <Text size="2" className="text-gray-11">Total Videos</Text>
              <Heading size="7">{totalVideos}</Heading>
              <Text size="1" className="text-gray-10">
                {data.courses.length} courses
              </Text>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-2">
              <Text size="2" className="text-gray-11">Total Views</Text>
              <Heading size="7">{totalViews}</Heading>
              <Text size="1" className="text-gray-10">
                Last 7 days
              </Text>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-2">
              <Text size="2" className="text-gray-11">AI Interactions</Text>
              <Heading size="7">{totalAIInteractions}</Heading>
              <Text size="1" className="text-gray-10">
                Video chat queries
              </Text>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-2">
              <Text size="2" className="text-gray-11">Chat Cost</Text>
              <Heading size="7">${totalChatCost.toFixed(2)}</Heading>
              <Text size="1" className="text-gray-10">
                AI API usage
              </Text>
            </div>
          </Card>
        </div>

        {/* Video Performance */}
        <Card>
          <Heading size="5" className="mb-4">📹 Video Performance</Heading>
          <div className="space-y-4">
            {data.videos.map((video) => {
              const videoViews = video.video_analytics?.reduce((s: number, a: any) => s + (a.views || 0), 0) || 0
              const avgCompletion = video.video_analytics?.length
                ? video.video_analytics.reduce((s: number, a: any) => s + (a.completion_rate || 0), 0) / video.video_analytics.length
                : 0

              return (
                <div key={video.id} className="p-4 bg-gray-2 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Text size="3" weight="bold" className="text-gray-12">{video.title}</Text>
                      <Text size="1" className="text-gray-10">
                        {Math.floor((video.duration_seconds || 0) / 60)} min • {video.status}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text size="2" className="text-gray-11">{videoViews} views</Text>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <Text size="1" className="text-gray-10">Completion Rate</Text>
                      <Text size="2" weight="bold">{avgCompletion.toFixed(1)}%</Text>
                    </div>
                    <div>
                      <Text size="1" className="text-gray-10">Analytics Days</Text>
                      <Text size="2" weight="bold">{video.video_analytics?.length || 0}</Text>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Usage Metrics */}
        <Card>
          <Heading size="5" className="mb-4">💾 Weekly Usage</Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Text size="1" className="text-gray-10">Storage</Text>
              <Text size="3" weight="bold">{(weeklyUsage.storage / (1024 * 1024)).toFixed(2)} MB</Text>
            </div>
            <div>
              <Text size="1" className="text-gray-10">AI Credits</Text>
              <Text size="3" weight="bold">{weeklyUsage.aiCredits}</Text>
            </div>
            <div>
              <Text size="1" className="text-gray-10">Transcription</Text>
              <Text size="3" weight="bold">{weeklyUsage.transcription.toFixed(1)} min</Text>
            </div>
            <div>
              <Text size="1" className="text-gray-10">Chat Messages</Text>
              <Text size="3" weight="bold">{weeklyUsage.chatMessages}</Text>
            </div>
          </div>
        </Card>

        {/* Chat Analytics */}
        {data.chatAnalytics.length > 0 && (
          <Card>
            <Heading size="5" className="mb-4">💬 Chat Cost Analytics</Heading>
            <div className="space-y-2">
              {data.chatAnalytics.map((day: any, i: number) => (
                <div key={i} className="flex justify-between p-3 bg-gray-2 rounded">
                  <div>
                    <Text size="2" weight="bold">{day.date}</Text>
                    <Text size="1" className="text-gray-10">
                      {day.message_count} messages • {day.model}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text size="2" weight="bold">${day.total_cost?.toFixed(4)}</Text>
                    <Text size="1" className="text-gray-10">
                      {day.total_input_tokens + day.total_output_tokens} tokens
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Raw Data (for debugging) */}
        <details className="bg-gray-2 rounded-lg p-4">
          <summary className="cursor-pointer text-gray-11 hover:text-gray-12">
            🔍 View Raw Data (Debug)
          </summary>
          <pre className="mt-4 p-4 bg-gray-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
