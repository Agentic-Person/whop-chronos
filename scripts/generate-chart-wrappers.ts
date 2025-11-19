#!/usr/bin/env tsx
/**
 * Generate dynamic import wrappers for all chart components
 * This reduces initial bundle size by lazy-loading recharts
 */

import { writeFileSync } from 'fs';
import path from 'path';

const ANALYTICS_DIR = path.join(process.cwd(), 'components', 'analytics');
const VIDEOS_DIR = path.join(ANALYTICS_DIR, 'videos');

const analyticsCharts = [
  'ActiveUsersChart',
  'AICreditsUsageChart',
  'ChatVolumeChart',
  'CompletionRateChart',
  'ResponseQualityChart',
  'SessionDurationChart',
  'StudentRetentionChart',
  'VideoComparisonChart',
  'VideoPerformanceChart',
  'WatchTimeChart'
];

const videoCharts = [
  'CompletionRatesChart',
  'StorageUsageChart',
  'ViewsOverTimeChart'
];

function generateWrapper(componentName: string, isDefaultExport: boolean = false): string {
  const exportType = isDefaultExport ? 'default' : `{ ${componentName} }`;
  const componentToRender = isDefaultExport ? `${componentName}Impl` : componentName;

  return `'use client';

import dynamic from 'next/dynamic';

// Lazy load recharts-based chart (150KB saved on initial bundle)
// Only loaded when analytics page is visited
const ${componentName}Impl = dynamic(() => import('./${componentName}Impl').then(mod => ({ default: mod.${componentName} })), {
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="animate-pulse text-gray-11">Loading chart...</div>
    </div>
  ),
  ssr: false // Charts don't need SSR
});

export ${isDefaultExport ? 'default' : ''} function ${componentName}(props: any) {
  return <${componentName}Impl {...props} />;
}
`;
}

// Generate analytics chart wrappers
for (const chart of analyticsCharts) {
  const filePath = path.join(ANALYTICS_DIR, `${chart}.tsx`);
  writeFileSync(filePath, generateWrapper(chart, false));
  console.log(`✅ Generated ${chart}.tsx`);
}

// Generate video chart wrappers
for (const chart of videoCharts) {
  const filePath = path.join(VIDEOS_DIR, `${chart}.tsx`);
  writeFileSync(filePath, generateWrapper(chart, false));
  console.log(`✅ Generated videos/${chart}.tsx`);
}

console.log('\n✨ All chart wrappers generated successfully!');
