# Usage Meters & Tier Limits Components

Complete implementation of tier-based usage visualization for Chronos creators.

## Components Created

### 1. **UsageMeter** (`UsageMeter.tsx`)
Reusable usage meter with visual states

**Props:**
- `label`: Metric name
- `current`: Current usage value
- `limit`: Maximum allowed (-1 for unlimited)
- `unit`: Display unit (e.g., "GB", "videos")
- `warningThreshold`: Percentage for warning (default 80%)
- `onUpgradeClick`: Callback for upgrade action

**Features:**
- Color-coded progress bars (green → yellow → orange → red)
- Automatic warning icons
- Unlimited tier support
- Upgrade CTA when limit reached

---

### 2. **UsageMetersGrid** (`UsageMetersGrid.tsx`)
Grid layout displaying all usage meters

**Props:**
- `creatorId`: Creator identifier
- `tier`: Subscription tier
- `onUpgrade`: Callback with suggested tier

**Features:**
- Responsive grid (3 cols desktop, 1 col mobile)
- Auto-refresh every 60 seconds
- Loading skeletons
- Error handling

**Displays:**
- Videos usage
- Storage usage
- AI messages/month
- Students count
- Courses count

---

### 3. **StorageBreakdownChart** (`StorageBreakdownChart.tsx`)
Pie chart showing storage by video

**Props:**
- `creatorId`: Creator identifier
- `onVideoClick`: Callback when segment clicked

**Features:**
- Top 10 videos + "Other" grouping
- Clickable segments
- Size labels in GB
- Tooltips with exact sizes
- Color-coded segments

---

### 4. **AICreditsUsageChart** (`AICreditsUsageChart.tsx`)
Line chart for AI message usage over time

**Props:**
- `creatorId`: Creator identifier
- `monthlyLimit`: Monthly message limit
- `timeRange`: Days to display (default 30)

**Features:**
- Daily and cumulative usage lines
- Monthly limit reference line
- Trend-based overage warnings
- Date range filtering
- Unlimited tier support

---

### 5. **TierComparisonTable** (`TierComparisonTable.tsx`)
Comparison table for subscription tiers

**Props:**
- `currentTier`: Creator's current tier
- `onUpgrade`: Callback with selected tier

**Features:**
- Side-by-side tier comparison
- Highlights current tier
- Shows pricing
- Feature matrix (videos, storage, AI, students, courses)
- Upgrade buttons for higher tiers
- Additional features (support, analytics, branding)

---

### 6. **UsageAlerts** (`UsageAlerts.tsx`)
Alert banner for critical usage warnings

**Props:**
- `creatorId`: Creator identifier
- `tier`: Subscription tier
- `onUpgrade`: Callback for upgrade action

**Features:**
- Real-time threshold monitoring
- 3 alert levels: warning (90%), critical (95%), error (100%)
- Dismissible alerts
- Auto-refresh every 5 minutes
- Actionable upgrade CTAs

---

### 7. **UpgradeSuggestion** (`UpgradeSuggestion.tsx`)
Smart upgrade recommendation card

**Props:**
- `creatorId`: Creator identifier
- `tier`: Current subscription tier
- `onUpgrade`: Callback with suggested tier
- `onViewPlans`: Callback to view all plans

**Features:**
- Analyzes usage patterns
- Identifies bottleneck metrics
- Lists benefits of suggested tier
- ROI calculation
- Gradient card design

---

## Library Functions

### Usage Calculation (`lib/analytics/usage.ts`)

**Main Functions:**

#### `calculateCurrentUsage(creatorId, tier)`
Calculates all current usage metrics for a creator

**Returns:**
```typescript
{
  tier: SubscriptionTier,
  usage: {
    videos: UsageStat,
    storage_gb: UsageStat,
    ai_messages: UsageStat,
    students: UsageStat,
    courses: UsageStat
  },
  warnings: string[],
  suggestedTier: SubscriptionTier | null
}
```

#### `checkQuota(creatorId, tier, operation)`
Real-time quota validation before operations

**Returns:**
```typescript
{ allowed: boolean, reason?: string }
```

#### `getStorageBreakdown(creatorId)`
Returns per-video storage breakdown

#### `getAIMessageTrend(creatorId, days)`
Returns daily AI message usage trend

**Helper Functions:**
- `isNearingLimit(current, limit, threshold)` - Check if near quota
- `suggestTierUpgrade(usage, currentTier)` - Tier upgrade logic
- `formatStorage(bytes)` - Human-readable storage format

---

## API Endpoints

### 1. `GET /api/analytics/usage`
Get current usage stats

**Query Params:**
- `creatorId`: Creator ID (required)

**Response:**
```json
{
  "tier": "basic",
  "usage": {
    "videos": { "current": 12, "limit": 15, "percentage": 80 },
    "storage_gb": { "current": 7.5, "limit": 10, "percentage": 75 },
    "ai_messages": { "current": 856, "limit": 1000, "percentage": 85.6 },
    "students": { "current": 32, "limit": 50, "percentage": 64 },
    "courses": { "current": 2, "limit": 3, "percentage": 66.7 }
  },
  "warnings": ["ai_messages", "videos"],
  "suggestedTier": "pro"
}
```

---

### 2. `GET /api/analytics/usage/quota`
Real-time quota check

**Query Params:**
- `creatorId`: Creator ID (required)
- `operation`: videos | storage_gb | ai_messages_per_month | students | courses

**Response:**
```json
{
  "allowed": false,
  "reason": "You've reached your videos limit (15). Upgrade to add more.",
  "upgradeUrl": "/dashboard/:id/settings/billing",
  "currentUsage": 15,
  "limit": 15
}
```

---

### 3. `GET /api/analytics/usage/storage-breakdown`
Storage breakdown by video

**Query Params:**
- `creatorId`: Creator ID (required)

**Response:**
```json
[
  {
    "videoId": "vid_123",
    "videoTitle": "Introduction to Trading",
    "sizeBytes": 524288000,
    "sizeGB": 0.49,
    "percentage": 35.2
  }
]
```

---

### 4. `GET /api/analytics/usage/ai-trend`
AI message usage trend

**Query Params:**
- `creatorId`: Creator ID (required)
- `days`: Number of days (default 30, max 365)

**Response:**
```json
[
  {
    "date": "2025-11-01",
    "count": 45,
    "cumulative": 45
  },
  {
    "date": "2025-11-02",
    "count": 62,
    "cumulative": 107
  }
]
```

---

## Tier Limits Configuration

### Tier Structure (`usage-types.ts`)

```typescript
const TIER_LIMITS = {
  free: {
    videos: 3,
    storage_gb: 1,
    ai_messages_per_month: 100,
    students: 10,
    courses: 1
  },
  basic: {
    videos: 15,
    storage_gb: 10,
    ai_messages_per_month: 1000,
    students: 50,
    courses: 3
  },
  pro: {
    videos: 100,
    storage_gb: 100,
    ai_messages_per_month: 10000,
    students: 500,
    courses: 10
  },
  enterprise: {
    videos: -1,        // Unlimited
    storage_gb: 500,
    ai_messages_per_month: -1,  // Unlimited
    students: -1,      // Unlimited
    courses: -1        // Unlimited
  }
};
```

---

## Usage Examples

### Basic Dashboard Integration

```tsx
import {
  UsageMetersGrid,
  UsageAlerts,
  UpgradeSuggestion
} from '@/components/analytics';

export default function SettingsPage({ creatorId, tier }) {
  const handleUpgrade = (suggestedTier) => {
    // Redirect to Whop checkout
    window.location.href = `/upgrade/${suggestedTier}`;
  };

  return (
    <div className="space-y-6">
      <UsageAlerts
        creatorId={creatorId}
        tier={tier}
        onUpgrade={handleUpgrade}
      />

      <UpgradeSuggestion
        creatorId={creatorId}
        tier={tier}
        onUpgrade={handleUpgrade}
      />

      <UsageMetersGrid
        creatorId={creatorId}
        tier={tier}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
```

### Pre-Operation Quota Check

```tsx
import { checkQuota } from '@/lib/analytics/usage';

async function handleVideoUpload(creatorId, tier) {
  const quota = await checkQuota(creatorId, tier, 'videos');

  if (!quota.allowed) {
    toast.error(quota.reason);
    return;
  }

  // Proceed with upload
  uploadVideo(...);
}
```

---

## Database Queries

Added to `lib/db/queries.ts`:

### `getCreatorUsageStats(creatorId)`
Returns raw usage counts:
- `videoCount`
- `totalStorageBytes`
- `aiMessageCount`
- `studentCount`
- `courseCount`

---

## Integration Points

### With Whop
- Tier synced from `creators.subscription_tier`
- Upgrade links point to Whop checkout
- Webhook updates tier when subscription changes

### With Video Upload
1. Check quota before upload: `GET /api/analytics/usage/quota?operation=videos`
2. Reject if limit reached
3. Show upgrade modal

### With AI Chat
1. Check quota before chat: `GET /api/analytics/usage/quota?operation=ai_messages_per_month`
2. Soft limit warning at 90%
3. Hard limit rejection at 100%

---

## Performance Considerations

- **Caching**: Usage stats cached for 60 seconds
- **Auto-refresh**: Components refresh every 60 seconds
- **Quota checks**: Sub-100ms response time
- **Database queries**: Optimized with indexes on creator_id

---

## Future Enhancements

1. **Usage History**: Line charts showing usage trends over time
2. **Predictive Analytics**: Forecast when limits will be hit
3. **Email Alerts**: Notify creators at 80%, 90%, 100%
4. **Custom Limits**: Enterprise tier custom quotas
5. **Multi-tier Bundling**: Family/team subscriptions

---

## Files Created

```
components/analytics/
├── UsageMeter.tsx
├── UsageMetersGrid.tsx
├── StorageBreakdownChart.tsx
├── AICreditsUsageChart.tsx
├── TierComparisonTable.tsx
├── UsageAlerts.tsx
├── UpgradeSuggestion.tsx
└── usage-types.ts

lib/analytics/
└── usage.ts

app/api/analytics/usage/
├── route.ts
├── quota/route.ts
├── storage-breakdown/route.ts
└── ai-trend/route.ts
```

---

## Success Criteria

- ✅ All 7 usage components created
- ✅ Usage calculation library implemented
- ✅ 4 API endpoints functional
- ✅ Real-time quota validation
- ✅ Upgrade CTAs linked to Whop
- ✅ TypeScript strict mode compliant
- ✅ Responsive design (mobile + desktop)
- ✅ Auto-refresh for real-time updates
