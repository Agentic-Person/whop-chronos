# MCP Configuration Guide for Chronos

Chronos uses multiple MCP (Model Context Protocol) configurations for different development contexts.

## Available Configurations

### 1. Main Configuration (`.mcp.json`)

**Purpose**: Production development with Whop and Supabase integration

**MCP Servers**:
- **Whop** - Custom MCP server for API operations (product management, memberships, OAuth, webhooks)
- **Whop Docs** - Official Whop documentation MCP server (search and read Whop docs)
- **Supabase** - Database operations, migrations, Edge Functions

**Usage**:
```bash
# Default (uses .mcp.json)
claude

# Or explicitly
claude --mcp-config .mcp.json
```

**When to use**:
- Building Whop integration features
- Database schema development
- API endpoint development
- Webhook handler implementation
- Membership and tier management
- Looking up Whop API documentation and examples

---

### 2. UI Configuration (`ui.mcp.json`)

**Purpose**: UI development, testing, and quality assurance

**MCP Servers**:
- **Puppeteer** - Browser automation and screenshots
- **Playwright** - Multi-browser testing
- **Sequential Thinking** - Complex UI architecture planning
- **Fetch** - External documentation retrieval
- **Memory** - UI pattern persistence

**Usage**:
```bash
claude --mcp-config ui.mcp.json
```

**When to use**:
- Component testing and visual QA
- Cross-browser compatibility checks
- Accessibility audits
- Responsive design verification
- UI performance testing
- Screenshot generation

---

## Quick Reference

| Task | Configuration | Command |
|------|---------------|---------|
| Build Whop features | `.mcp.json` | `claude` or `claude --mcp-config .mcp.json` |
| Database migrations | `.mcp.json` | `claude` |
| Test UI components | `ui.mcp.json` | `claude --mcp-config ui.mcp.json` |
| Generate screenshots | `ui.mcp.json` | `claude --mcp-config ui.mcp.json` |
| Run accessibility tests | `ui.mcp.json` | `claude --mcp-config ui.mcp.json` |
| Validate memberships | `.mcp.json` | `claude` |

---

## Switching Between Configurations

You can easily switch between configurations by closing and restarting Claude Code:

```bash
# Exit current Claude session
# Then start with different config

# For main development
claude --mcp-config .mcp.json

# For UI testing
claude --mcp-config ui.mcp.json
```

---

## Configuration Files

### `.mcp.json`
```json
{
  "mcpServers": {
    "whop": { 
      "command": "...",
      "args": ["..."],
      "env": { "WHOP_API_KEY": "...", "WHOP_APP_ID": "..." }
    },
    "whop-docs": {
      "url": "https://docs.whop.com/mcp"
    },
    "supabase": { ... }
  }
}
```

### `ui.mcp.json`
```json
{
  "mcpServers": {
    "puppeteer": { ... },
    "playwright": { ... },
    "sequential-thinking": { ... },
    "fetch": { ... },
    "memory": { ... }
  }
}
```

---

## Understanding Whop MCP Servers

Chronos uses **two different Whop MCP servers** for different purposes:

### 1. `whop` - Custom API Server
- **Type**: Local command-based server
- **Purpose**: Direct API operations (list products, get memberships, validate access, etc.)
- **Tools**: `mcp__whop__list_products`, `mcp__whop__get_membership`, `mcp__whop__validate_membership`
- **Setup**: Requires local installation (see [WHOP_MCP_SETUP.md](./WHOP_MCP_SETUP.md))
- **Use when**: You need to interact with Whop's API directly

### 2. `whop-docs` - Official Documentation Server
- **Type**: URL-based server (no installation needed)
- **Purpose**: Search and read Whop's official documentation
- **Tools**: Documentation search and retrieval tools
- **Setup**: Just add the URL to `.mcp.json` (already configured)
- **Use when**: You need to look up API documentation, examples, or best practices

**Best Practice**: Use `whop-docs` to understand how to use Whop APIs, then use the `whop` server to actually interact with them.

---

## Common Workflows

### Workflow 1: Build Feature with Whop

```bash
# Step 1: Use main config
claude --mcp-config .mcp.json

# Step 2: Look up Whop documentation (if needed)
"Use whop-docs MCP to find documentation on OAuth flow"
"Search whop-docs for webhook event types"

# Step 3: Build feature using Whop API MCP tools
"Use mcp__whop__list_products to see available products"
"Implement membership validation using mcp__whop__validate_membership"

# Step 4: Test in UI
# Exit and restart
claude --mcp-config ui.mcp.json

# Step 5: Test the feature
"Test the membership flow with Puppeteer at localhost:3000"
```

### Workflow 2: Database Schema Updates

```bash
# Use main config
claude --mcp-config .mcp.json

# Create migration
"Use mcp__supabase__apply_migration to add a new column to videos table"

# Verify schema
"Use mcp__supabase__list_tables to confirm the change"

# Generate types
"Use mcp__supabase__generate_typescript_types for updated types"
```

### Workflow 3: UI Component Development

```bash
# Start with main config for component code
claude --mcp-config .mcp.json

# Build the component
"Create a VideoCard component using Frosted UI"

# Switch to UI config for testing
claude --mcp-config ui.mcp.json

# Test the component
"Use Puppeteer to test VideoCard rendering at different viewport sizes"
"Generate screenshots for documentation"
```

---

## Environment Setup

### Prerequisites

**For Main Config (.mcp.json)**:
- Whop API credentials in `.env.local`
- Supabase project configured
- Environment variables set
- **Whop MCP Server installed** (see [Whop MCP Setup Guide](./WHOP_MCP_SETUP.md) for installation instructions)

**For UI Config (ui.mcp.json)**:
- Dev server running (`npm run dev`)
- Browsers installed:
  ```bash
  npx playwright install
  ```

---

## Troubleshooting

### MCP Server Not Starting

```bash
# Check if MCP server package exists
npx @modelcontextprotocol/server-puppeteer --help

# Install browsers for Playwright
npx playwright install
```

### Configuration Not Loading

```bash
# Verify JSON syntax
cat .mcp.json | jq .
cat ui.mcp.json | jq .

# Check file permissions
ls -l *.mcp.json
```

### Browser Automation Failing

```bash
# Make sure dev server is running
npm run dev

# Verify URL is accessible
curl http://localhost:3000
```

---

## Best Practices

1. **Use the right config for the task**
   - Whop/Supabase work → `.mcp.json`
   - UI testing → `ui.mcp.json`

2. **Keep configs separate**
   - Don't mix UI and backend MCP servers
   - Maintain focused, purpose-specific configs

3. **Document MCP usage**
   - Add comments to explain complex MCP tool usage
   - Reference MCP tools in code comments

4. **Test across configs**
   - Build with `.mcp.json`
   - Test with `ui.mcp.json`

---

## Resources

- **Main MCP Guide**: See `CLAUDE.md` for Whop/Supabase MCP usage
- **UI MCP Guide**: See `docs/mcp/UI_MCP_GUIDE.md` for UI testing details
- **Whop MCP Setup**: See `docs/mcp/WHOP_MCP_SETUP.md` for setting up Whop MCP server on a new computer
- **MCP Protocol**: https://modelcontextprotocol.io/

---

**Last Updated**: 2025-11-09
**Project**: Chronos
**Version**: 1.0
