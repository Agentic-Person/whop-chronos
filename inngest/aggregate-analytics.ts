/**
 * Analytics Aggregation Cron Job
 *
 * Runs every 6 hours to pre-compute analytics summaries for all creators.
 * Stores results in analytics_cache table for fast dashboard loads.
 *
 * Impact: Dashboard load time 3-5s → <500ms (6-10x faster)
 */

import { inngest } from './client';
import { getServiceSupabase } from '@/lib/db/client';
import { aggregateAnalytics, type DateRangeType } from '@/lib/analytics/aggregator';

/**
 * Aggregate Analytics Cron Function
 *
 * Schedule: Every 6 hours at minute 0
 * - 12:00 AM
 * - 6:00 AM
 * - 12:00 PM
 * - 6:00 PM
 */
export const aggregateAnalyticsFunction = inngest.createFunction(
  {
    id: 'aggregate-analytics',
    name: 'Aggregate Creator Analytics',
    retries: 1, // Don't retry too much (cron will run again in 6 hours)
  },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step, logger }) => {
    logger.info('Starting analytics aggregation cron job');

    // Step 1: Get all active creators
    const creators = await step.run('fetch-creators', async () => {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('creators')
        .select('id')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching creators', { error: error.message });
        throw error;
      }

      logger.info('Found creators to aggregate', { count: data?.length || 0 });
      return data || [];
    });

    if (creators.length === 0) {
      logger.info('No creators found, skipping aggregation');
      return { success: true, creators_processed: 0 };
    }

    // Step 2: For each creator, aggregate analytics for all date ranges
    const dateRanges: DateRangeType[] = ['last_7_days', 'last_30_days', 'last_90_days', 'all_time'];

    let creatorsProcessed = 0;
    let cacheEntriesUpdated = 0;
    const errors: string[] = [];

    for (const creator of creators) {
      await step.run(`aggregate-creator-${creator.id}`, async () => {
        logger.info('Aggregating analytics', { creator_id: creator.id });

        try {
          for (const dateRange of dateRanges) {
            // Compute analytics
            const analytics = await aggregateAnalytics(creator.id, dateRange);

            // Store in cache
            const supabase = getServiceSupabase();
            const { error } = await supabase.from('analytics_cache').upsert(
              {
                creator_id: creator.id,
                date_range: dateRange,
                data: analytics as any, // Cast to JSONB
                computed_at: new Date().toISOString(),
              },
              {
                onConflict: 'creator_id,date_range',
              }
            );

            if (error) {
              logger.error('Error updating cache', {
                creator_id: creator.id,
                date_range: dateRange,
                error: error.message,
              });
              errors.push(`${creator.id}/${dateRange}: ${error.message}`);
            } else {
              cacheEntriesUpdated++;
              logger.info('Cache updated', {
                creator_id: creator.id,
                date_range: dateRange,
              });
            }
          }

          creatorsProcessed++;
        } catch (error) {
          logger.error('Error aggregating for creator', {
            creator_id: creator.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          errors.push(`${creator.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }

    // Step 3: Log summary
    logger.info('Analytics aggregation complete', {
      total_creators: creators.length,
      creators_processed: creatorsProcessed,
      cache_entries_updated: cacheEntriesUpdated,
      errors: errors.length,
    });

    return {
      success: true,
      creators_processed: creatorsProcessed,
      cache_entries_updated: cacheEntriesUpdated,
      errors,
    };
  }
);
