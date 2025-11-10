# Data Export & Reports System

Comprehensive data export and automated reporting features for Chronos Analytics.

## Overview

This module provides:
- CSV/PDF/JSON export of analytics data
- Scheduled report generation and delivery
- Report history and management
- Email delivery integration
- Customizable report templates

## File Structure

```
lib/reports/
├── types.ts              # TypeScript type definitions
├── exporters.ts          # CSV/JSON export utilities
├── templates.ts          # PDF report templates
└── README.md            # This file

lib/email/
└── report-mailer.ts     # Email delivery service

lib/inngest/
└── report-jobs.ts       # Background job definitions

components/analytics/
├── ExportDialog.tsx              # Export configuration modal
├── ReportTemplateSelector.tsx   # Template selection UI
├── ScheduledReportsManager.tsx  # Schedule management
└── ReportHistoryList.tsx        # Report history viewer

app/api/export/
├── csv/route.ts         # CSV export endpoint
├── pdf/route.ts         # PDF generation endpoint
└── schedule/route.ts    # Schedule CRUD endpoints

app/api/webhooks/reports/
└── route.ts             # Inngest webhook handler
```

## Components

### ExportDialog

Modal dialog for configuring and triggering data exports.

**Props:**
```typescript
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dataType?: DataType; // 'videos' | 'students' | 'chat' | 'all'
}
```

**Features:**
- Data type selection
- Format selection (CSV, PDF, JSON)
- Date range picker
- Column/field selector
- Download or email delivery
- Progress indicator

**Usage:**
```tsx
import { ExportDialog } from '@/components/analytics';

function MyComponent() {
  const [showExport, setShowExport] = useState(false);

  return (
    <>
      <button onClick={() => setShowExport(true)}>Export Data</button>
      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        dataType="videos"
      />
    </>
  );
}
```

### ReportTemplateSelector

Choose from pre-built report templates or create custom reports.

**Props:**
```typescript
interface ReportTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateType) => void;
}
```

**Templates:**
- **Executive Summary** - High-level overview (1 page)
- **Detailed Analytics** - Comprehensive report (10+ pages)
- **Student Progress** - Student-focused metrics
- **Content Performance** - Video/course analytics
- **Custom** - Select specific sections

**Usage:**
```tsx
import { ReportTemplateSelector } from '@/components/analytics';

function MyComponent() {
  const handleSelect = (template) => {
    console.log('Selected template:', template);
    // Generate report with template
  };

  return (
    <ReportTemplateSelector
      isOpen={true}
      onClose={() => {}}
      onSelect={handleSelect}
    />
  );
}
```

### ScheduledReportsManager

Manage automated report schedules with cron-based delivery.

**Features:**
- Create new schedules
- Edit existing schedules
- Pause/resume schedules
- Delete schedules
- View schedule status
- Recipient management

**Usage:**
```tsx
import { ScheduledReportsManager } from '@/components/analytics';

function SettingsPage() {
  return (
    <div>
      <h1>Report Automation</h1>
      <ScheduledReportsManager />
    </div>
  );
}
```

### ReportHistoryList

Browse, download, and manage generated reports.

**Features:**
- Filter by status (all, sent, failed)
- Filter by date range
- Download reports
- Resend failed reports
- Delete old reports
- View file sizes and metadata

**Usage:**
```tsx
import { ReportHistoryList } from '@/components/analytics';

function ReportsPage() {
  return (
    <div>
      <h1>Report History</h1>
      <ReportHistoryList />
    </div>
  );
}
```

## API Endpoints

### CSV Export

**Endpoint:** `POST /api/export/csv`

**Request Body:**
```json
{
  "dataType": "videos",
  "format": "csv",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "columns": ["id", "title", "views", "completion_rate"],
  "fileName": "video_analytics"
}
```

**Response:** CSV file download

### PDF Report

**Endpoint:** `POST /api/export/pdf`

**Request Body:**
```json
{
  "template": "executive",
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "branding": {
    "logo": "https://example.com/logo.png",
    "primaryColor": "#6366f1"
  }
}
```

**Response:** PDF file download (currently HTML until Puppeteer integration)

### Schedule Management

**List Schedules:** `GET /api/export/schedule`

**Create Schedule:** `POST /api/export/schedule`
```json
{
  "name": "Weekly Performance Report",
  "template": "executive",
  "frequency": "weekly",
  "delivery_time": "09:00",
  "delivery_day": 1,
  "recipients": ["creator@example.com"]
}
```

**Update Schedule:** `PATCH /api/export/schedule`
```json
{
  "id": "schedule_123",
  "is_active": false
}
```

**Delete Schedule:** `DELETE /api/export/schedule`
```json
{
  "id": "schedule_123"
}
```

## Background Jobs

Reports are generated in the background using Inngest.

### Job Definitions

**Daily Reports:**
```typescript
Cron: '0 9 * * *' // 9 AM daily
Handler: generateScheduledReport()
```

**Weekly Reports:**
```typescript
Cron: '0 9 * * 1' // 9 AM every Monday
Handler: generateScheduledReport()
```

**Monthly Reports:**
```typescript
Cron: '0 9 1 * *' // 9 AM on 1st of month
Handler: generateScheduledReport()
```

### Job Flow

1. Inngest cron triggers job
2. Fetch active schedules from database
3. For each schedule:
   - Fetch analytics data
   - Generate report (HTML → PDF)
   - Upload to Supabase Storage
   - Create history record
   - Send email to recipients
   - Update delivery status

## Database Schema

### report_schedules

```sql
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template VARCHAR(50) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  delivery_time TIME DEFAULT '09:00:00',
  delivery_day INTEGER,
  recipients TEXT[],
  options JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### report_history

```sql
CREATE TABLE report_history (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL,
  schedule_id UUID,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_url TEXT,
  file_size_bytes INTEGER,
  generated_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_status VARCHAR(50)
);
```

## Email Delivery

Reports are delivered via email using the email service integration.

### Email Template

Professional HTML email with:
- Report attachment (PDF)
- Summary information
- Branded header
- CTA to view dashboard
- Delivery tracking

### Configuration

Set up email service credentials:

```env
# Using Resend (recommended)
RESEND_API_KEY=re_xxx

# Or SendGrid
SENDGRID_API_KEY=SG.xxx

# Or other email service
EMAIL_SERVICE_URL=
EMAIL_SERVICE_TOKEN=
```

## Export Formats

### CSV

**Use Cases:**
- Excel analysis
- Data processing
- Database imports
- Bulk operations

**Features:**
- Column selection
- Date filtering
- Escaped special characters
- UTF-8 encoding

### PDF

**Use Cases:**
- Executive reports
- Client presentations
- Archival
- Printing

**Features:**
- Professional layouts
- Branded design
- Charts as images
- Multi-page support

### JSON

**Use Cases:**
- API integrations
- Data pipelines
- Custom processing
- Webhooks

**Features:**
- Structured data
- Nested objects
- Full schema
- Programmatic access

## Report Templates

### Executive Summary

**Sections:**
- Key metrics cards
- Performance trend chart
- Top videos table

**Best For:** Quick overview, stakeholder updates

### Detailed Analytics

**Sections:**
- Executive summary
- Engagement trends
- All videos performance
- Student engagement
- Completion distribution

**Best For:** Deep analysis, comprehensive reviews

### Student Progress

**Sections:**
- Student statistics
- Engagement rankings
- Session activity chart

**Best For:** Student management, retention analysis

### Content Performance

**Sections:**
- Content overview
- Category breakdown (pie chart)
- Video metrics table
- Watch time trends

**Best For:** Content optimization, video strategy

### Custom

**Sections:** User-selected

**Best For:** Specific use cases, targeted analysis

## Customization

### Add New Template

1. Define template in `lib/reports/templates.ts`:
```typescript
export const TEMPLATES = {
  // ...existing templates
  myTemplate: {
    name: 'My Custom Template',
    description: 'Description here',
    sections: [
      { type: 'header', title: 'My Report' },
      { type: 'summary', title: 'Overview', data: 'quickStats' },
      // ...more sections
    ],
    layout: 'single-column',
    includeCharts: true,
  },
};
```

2. Update type definition in `lib/reports/types.ts`:
```typescript
export type TemplateType = 'executive' | 'detailed' | 'student' | 'content' | 'custom' | 'myTemplate';
```

### Add New Export Format

1. Create exporter function in `lib/reports/exporters.ts`:
```typescript
export async function exportToXML(data: any[]): Promise<string> {
  // XML conversion logic
}
```

2. Add API endpoint in `app/api/export/xml/route.ts`

3. Update UI in `ExportDialog.tsx`

## Integration Examples

### Trigger Export from Dashboard

```tsx
import { ExportDialog } from '@/components/analytics';

function AnalyticsDashboard() {
  const [showExport, setShowExport] = useState(false);

  return (
    <div>
      <button onClick={() => setShowExport(true)}>
        Export Analytics
      </button>

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        dataType="all"
      />
    </div>
  );
}
```

### Schedule Weekly Reports

```tsx
import { ScheduledReportsManager } from '@/components/analytics';

function SettingsPage() {
  return (
    <div>
      <h1>Automation Settings</h1>
      <ScheduledReportsManager />
    </div>
  );
}
```

### View Report History

```tsx
import { ReportHistoryList } from '@/components/analytics';

function ReportsArchive() {
  return (
    <div>
      <h1>Generated Reports</h1>
      <ReportHistoryList />
    </div>
  );
}
```

## TODO: Production Integration

Before production deployment:

1. **PDF Generation**
   - [ ] Install Puppeteer: `npm install puppeteer`
   - [ ] Implement HTML to PDF conversion in `lib/inngest/report-jobs.ts`
   - [ ] Update PDF endpoint to return actual PDFs

2. **Email Service**
   - [ ] Choose email provider (Resend, SendGrid, etc.)
   - [ ] Add credentials to environment variables
   - [ ] Implement actual sending in `lib/email/report-mailer.ts`

3. **Database Integration**
   - [ ] Run migration: `supabase/migrations/20250110000002_create_report_schedules.sql`
   - [ ] Connect schedule CRUD to Supabase
   - [ ] Connect history tracking to Supabase

4. **Inngest Setup**
   - [ ] Install Inngest: `npm install inngest`
   - [ ] Create Inngest client
   - [ ] Register job functions
   - [ ] Set up webhook endpoint

5. **Storage Integration**
   - [ ] Configure Supabase Storage bucket for reports
   - [ ] Implement file upload in job handler
   - [ ] Add file URL to history records

6. **Authentication**
   - [ ] Add Whop auth validation to all endpoints
   - [ ] Implement creator_id filtering
   - [ ] Add RLS policies to database tables

## Performance Considerations

- CSV exports are memory-efficient for large datasets
- PDF generation may require increased timeout for large reports
- Use pagination for report history (100 items per page)
- Cache report templates in memory
- Batch email sending for multiple recipients
- Monitor Inngest job execution time

## Security

- Validate all user inputs
- Sanitize file names
- Verify email addresses
- Check file size limits
- Implement rate limiting on exports
- Secure webhook endpoints
- Use RLS in database
- Encrypt sensitive data in transit

## Troubleshooting

**Export fails:**
- Check date range validity
- Verify data availability
- Check file permissions

**Schedule not triggering:**
- Verify Inngest webhook configuration
- Check schedule is_active status
- Validate cron expression

**Email not delivered:**
- Check email service credentials
- Verify recipient addresses
- Check spam folders
- Review delivery logs

**PDF rendering issues:**
- Ensure Puppeteer installed
- Check system dependencies
- Verify HTML template validity
