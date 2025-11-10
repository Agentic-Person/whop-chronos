# UI MCP Configuration Guide

This guide explains how to use the UI-focused MCP servers configured in `ui.mcp.json` for the Chronos project.

## Overview

The `ui.mcp.json` configuration provides specialized MCP servers for UI development, testing, and quality assurance. These tools complement the main `.mcp.json` configuration (Whop + Supabase).

---

## Available MCP Servers

### 1. Puppeteer (`@modelcontextprotocol/server-puppeteer`)

**Purpose**: Browser automation for UI testing and screenshots

**Use Cases**:
- Test React components in real Chrome browser
- Generate screenshots for visual regression testing
- Automated UI testing for forms, navigation, interactions
- Verify responsive layouts at different viewport sizes

**Example Tasks**:
```bash
# Start Claude with UI MCP config
claude --mcp-config ui.mcp.json

# Then ask:
"Test the login flow at /api/whop/auth/login and take a screenshot"
"Verify the DashboardLayout renders correctly on mobile (375px width)"
"Check if the VideoUploader drag-drop zone is accessible"
```

---

### 2. Playwright (`@executeautomation/playwright-mcp-server`)

**Purpose**: Advanced multi-browser testing (Chromium, Firefox, WebKit)

**Use Cases**:
- Cross-browser compatibility testing
- Comprehensive E2E test scenarios
- Parallel testing across browsers
- Advanced accessibility audits

**Example Tasks**:
```bash
"Run the OAuth flow test in Firefox and Chrome"
"Test the chat interface for keyboard navigation accessibility"
"Verify video upload works in Safari (WebKit)"
```

---

### 3. Sequential Thinking (`@modelcontextprotocol/server-sequential-thinking`)

**Purpose**: Enhanced reasoning for complex UI architecture decisions

**Use Cases**:
- Component architecture planning
- State management design
- Performance optimization strategies
- Accessibility planning

**Example Tasks**:
```bash
"Design the optimal state management for the course builder drag-drop"
"Plan the video player component architecture with timestamp navigation"
"Optimize the analytics dashboard for 1000+ data points"
```

---

### 4. Fetch (`@modelcontextprotocol/server-fetch`)

**Purpose**: Retrieve external documentation and resources

**Use Cases**:
- Fetch Frosted UI component documentation
- Get Recharts examples and API docs
- Retrieve Tailwind CSS utility references
- Access Next.js best practices

**Example Tasks**:
```bash
"Fetch the latest Frosted UI Card component documentation"
"Get Recharts LineChart API documentation for the analytics dashboard"
"Retrieve Tailwind CSS responsive design examples"
```

**Key URLs**:
- Frosted UI: https://storybook.whop.dev
- Recharts: https://recharts.org/en-US/api
- Tailwind CSS: https://tailwindcss.com/docs
- Next.js: https://nextjs.org/docs

---

### 5. Memory (`@modelcontextprotocol/server-memory`)

**Purpose**: Persist UI patterns and design decisions across sessions

**Use Cases**:
- Remember component naming conventions
- Store design token values
- Track UI pattern decisions
- Maintain component architecture notes

**Example Tasks**:
```bash
"Remember: We use purple-blue gradient (from-purple-600 to-blue-500) for primary CTAs"
"Store: Video card hover effect uses scale-105 and shadow-xl"
"Recall: What's our standard spacing between dashboard widgets?"
```

---

## Usage Guide

### Starting Claude with UI MCP Config

```bash
# From project root
claude --mcp-config ui.mcp.json
```

### Switching Between Configurations

**Main development** (Whop + Supabase):
```bash
claude --mcp-config .mcp.json
```

**UI testing and development**:
```bash
claude --mcp-config ui.mcp.json
```

**Both configs** (if supported):
```bash
# Merge both configs or use main config with all servers
claude
```

---

## Common UI Testing Workflows

### 1. Component Visual QA

```bash
claude --mcp-config ui.mcp.json

"Use Puppeteer to:
1. Navigate to http://localhost:3000/dashboard/creator/overview
2. Take screenshots at 375px, 768px, and 1920px widths
3. Verify all charts render without errors
4. Check for any console errors"
```

### 2. Accessibility Testing

```bash
"Use Playwright to audit the chat interface for:
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility
- ARIA labels and roles
- Focus management
- Color contrast ratios"
```

### 3. Cross-Browser Testing

```bash
"Test the video upload flow in Chrome, Firefox, and Safari:
1. Drag-drop a video file
2. Verify progress bar updates
3. Check real-time status updates
4. Confirm successful upload message
Take screenshots of each step in each browser"
```

### 4. Responsive Design Verification

```bash
"Use Puppeteer to test the DashboardLayout at these breakpoints:
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1440px (MacBook Pro)
- Large: 1920px (Desktop)

Verify:
- Sidebar collapses on mobile
- Charts are readable at all sizes
- Navigation is accessible
- No horizontal scroll"
```

---

## Integration with Development Workflow

### Phase 2: Video Pipeline Testing

When building the video upload UI:

```bash
claude --mcp-config ui.mcp.json

"Test the VideoUploader component:
1. Verify drag-drop zone highlights on dragover
2. Test file type validation (accept only .mp4, .mov, .avi)
3. Verify progress bar animation
4. Check error states (file too large, wrong type)
5. Take screenshots of each state"
```

### Phase 3: Chat Interface Testing

When building the AI chat:

```bash
"Test the chat interface:
1. Send a message and verify response appears
2. Test markdown rendering in messages
3. Click video timestamp links (should jump to video)
4. Test message input auto-focus
5. Verify streaming response animation
6. Check mobile chat layout"
```

### Phase 4: Analytics Dashboard Testing

When building analytics:

```bash
"Test the analytics dashboard with Recharts:
1. Verify all 8 charts render correctly
2. Test time range filter (7d, 30d, 90d)
3. Hover over data points for tooltips
4. Check responsive chart behavior on mobile
5. Verify color consistency with design system
6. Take screenshots for documentation"
```

---

## Performance Testing

### Load Testing UI

```bash
"Use Puppeteer to measure performance:
1. Navigate to analytics dashboard
2. Measure First Contentful Paint (FCP)
3. Measure Largest Contentful Paint (LCP)
4. Check Time to Interactive (TTI)
5. Verify Lighthouse score > 90"
```

### Memory Leak Detection

```bash
"Use Playwright to test for memory leaks:
1. Navigate through all dashboard pages 10 times
2. Monitor memory usage
3. Check for growing heap size
4. Report any leaks in components"
```

---

## Best Practices

### 1. Start Dev Server First

Always run the Next.js dev server before testing:

```bash
npm run dev
# Then in another terminal:
claude --mcp-config ui.mcp.json
```

### 2. Use Specific Viewport Sizes

When testing responsive design, use exact pixel values:
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1440x900 (MacBook Pro)
- Large: 1920x1080 (Desktop)

### 3. Take Screenshots for Documentation

Save screenshots to `docs/screenshots/` for:
- Design reviews
- Documentation
- Visual regression testing
- Onboarding materials

### 4. Test Accessibility Early

Run accessibility audits after creating each major component:
- Color contrast
- Keyboard navigation
- ARIA labels
- Screen reader compatibility

### 5. Cross-Browser Testing Schedule

Test in multiple browsers at these milestones:
- End of Phase 2 (Video pipeline)
- End of Phase 3 (Chat interface)
- End of Phase 4 (Analytics dashboard)
- Before Phase 6 production launch

---

## Troubleshooting

### Puppeteer Fails to Launch

```bash
# Install Chromium manually
npx puppeteer browsers install chrome
```

### Playwright Browser Issues

```bash
# Install all browsers
npx playwright install
```

### MCP Server Connection Issues

```bash
# Verify MCP server is running
npx @modelcontextprotocol/server-puppeteer --help

# Check node version (requires Node 18+)
node --version
```

---

## Environment Variables for UI Testing

Add these to `.env.local` for UI testing:

```bash
# Base URL for testing (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Enable debug mode for browser automation
PUPPETEER_DEBUG=true
PLAYWRIGHT_DEBUG=true

# Screenshot directory
SCREENSHOTS_DIR=./docs/screenshots
```

---

## Next Steps

1. **Install browsers**: `npx playwright install`
2. **Start dev server**: `npm run dev`
3. **Run UI tests**: `claude --mcp-config ui.mcp.json`
4. **Create screenshot directory**: `mkdir -p docs/screenshots`

---

## Resources

- Puppeteer Docs: https://pptr.dev/
- Playwright Docs: https://playwright.dev/
- MCP Protocol: https://modelcontextprotocol.io/
- Frosted UI Storybook: https://storybook.whop.dev
- Accessibility Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated**: 2025-11-09
**Version**: 1.0
**For**: Chronos UI Development
