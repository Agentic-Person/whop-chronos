# Whop MCP Server Setup Guide

This guide explains how to set up the Whop MCP server on a new computer. The Whop MCP server is a custom-built Model Context Protocol server that provides AI assistants with access to Whop's API for product management, memberships, OAuth, and webhooks.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Whop API credentials (`WHOP_API_KEY` and `WHOP_APP_ID`)
- Access to the Whop MCP server source code/repository

## Step 1: Locate or Clone the Whop MCP Server

The Whop MCP server is a custom TypeScript-based MCP server. You need to either:

### Option A: If you have the server repository
```bash
# Clone or copy the Whop MCP server repository
git clone <whop-mcp-server-repo-url>
cd whop-mcp-server
```

### Option B: If the server is in a shared location
```bash
# Copy from the original computer's location
# Original location: C:\Users\jimmy\.mcp\servers\whop\
# Copy to your new computer's MCP servers directory
```

### Option C: Create the directory structure
```bash
# Create the MCP servers directory (Windows)
mkdir %USERPROFILE%\.mcp\servers\whop

# Or on macOS/Linux
mkdir -p ~/.mcp/servers/whop
```

## Step 2: Install Dependencies

Navigate to the Whop MCP server directory and install dependencies:

```bash
cd ~/.mcp/servers/whop  # or C:\Users\<your-username>\.mcp\servers\whop on Windows

# Install dependencies
npm install
# or
pnpm install
```

**Required dependencies typically include:**
- `@modelcontextprotocol/sdk` - MCP SDK
- `tsx` - TypeScript execution
- `@whop-apps/sdk` or Whop API client library
- TypeScript and related type definitions

## Step 3: Verify Server Structure

Ensure your Whop MCP server has the following structure:

```
whop/
├── index.ts          # Main server entry point
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── node_modules/     # Installed dependencies
```

## Step 4: Set Up Environment Variables

Create a `.env` file in the Whop MCP server directory (if needed) or ensure these are set in your system:

```bash
# Windows (PowerShell)
$env:WHOP_API_KEY="your_whop_api_key"
$env:WHOP_APP_ID="your_whop_app_id"

# Windows (CMD)
set WHOP_API_KEY=your_whop_api_key
set WHOP_APP_ID=your_whop_app_id

# macOS/Linux
export WHOP_API_KEY="your_whop_api_key"
export WHOP_APP_ID="your_whop_app_id"
```

**Note:** These can also be set in your `.mcp.json` configuration file (see Step 5).

## Step 5: Configure `.mcp.json` in Your Project

Update the `.mcp.json` file in your Chronos project root with paths appropriate for your computer.

### Windows Configuration

```json
{
  "mcpServers": {
    "whop": {
      "command": "C:\\Users\\<YOUR_USERNAME>\\.mcp\\servers\\whop\\node_modules\\.bin\\tsx.cmd",
      "args": ["C:\\Users\\<YOUR_USERNAME>\\.mcp\\servers\\whop\\index.ts"],
      "env": {
        "WHOP_API_KEY": "${WHOP_API_KEY}",
        "WHOP_APP_ID": "${WHOP_APP_ID}"
      }
    }
  }
}
```

### macOS/Linux Configuration

```json
{
  "mcpServers": {
    "whop": {
      "command": "tsx",
      "args": ["~/.mcp/servers/whop/index.ts"],
      "env": {
        "WHOP_API_KEY": "${WHOP_API_KEY}",
        "WHOP_APP_ID": "${WHOP_APP_ID}"
      }
    }
  }
}
```

### Cross-Platform Configuration (Recommended)

For better portability, you can use environment variables or relative paths:

```json
{
  "mcpServers": {
    "whop": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "${HOME}/.mcp/servers/whop/index.ts"
      ],
      "env": {
        "WHOP_API_KEY": "${WHOP_API_KEY}",
        "WHOP_APP_ID": "${WHOP_APP_ID}"
      }
    }
  }
}
```

**Important:** Replace `<YOUR_USERNAME>` with your actual username on Windows, or use `${HOME}` on macOS/Linux.

## Step 6: Test the MCP Server

### Manual Test

Test if the server can be executed directly:

```bash
# Windows
C:\Users\<YOUR_USERNAME>\.mcp\servers\whop\node_modules\.bin\tsx.cmd C:\Users\<YOUR_USERNAME>\.mcp\servers\whop\index.ts

# macOS/Linux
tsx ~/.mcp/servers/whop/index.ts
```

If the server starts without errors, you should see MCP protocol initialization messages.

### Test via Claude Code

1. Ensure your `.mcp.json` is configured correctly
2. Restart Claude Code
3. Check if Whop MCP tools are available:
   - `mcp__whop__list_products`
   - `mcp__whop__get_membership`
   - `mcp__whop__validate_membership`
   - etc.

## Step 7: Set Environment Variables in Your Project

Make sure your Chronos project has the required environment variables set in `.env.local`:

```env
WHOP_API_KEY=your_whop_api_key
WHOP_APP_ID=your_whop_app_id
```

These will be used by the MCP server when referenced as `${WHOP_API_KEY}` and `${WHOP_APP_ID}` in the configuration.

## Troubleshooting

### Issue: "Command not found" or "tsx.cmd not found"

**Solution:**
- Ensure `tsx` is installed in the Whop MCP server's `node_modules`
- Run `npm install` or `pnpm install` in the server directory
- Verify the path to `tsx.cmd` (Windows) or `tsx` (macOS/Linux) is correct

### Issue: "Cannot find module" errors

**Solution:**
- Check that all dependencies are installed: `npm install` in the server directory
- Verify `package.json` exists and has correct dependencies
- Ensure Node.js version is 18+

### Issue: Environment variables not loading

**Solution:**
- Verify environment variables are set in your system or `.env.local`
- Check that variable names match exactly (case-sensitive)
- On Windows, use PowerShell or CMD to set variables before starting Claude Code

### Issue: MCP server not appearing in Claude Code

**Solution:**
- Verify `.mcp.json` syntax is valid JSON
- Restart Claude Code completely
- Check Claude Code logs for MCP server connection errors
- Verify the command path exists and is executable

### Issue: Permission errors (macOS/Linux)

**Solution:**
```bash
# Make tsx executable
chmod +x ~/.mcp/servers/whop/node_modules/.bin/tsx

# Or use npx instead
```

## Alternative: Using npx (No Local Installation)

If you prefer not to install the server locally, you can configure it to use npx:

```json
{
  "mcpServers": {
    "whop": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "path/to/whop/index.ts"
      ],
      "env": {
        "WHOP_API_KEY": "${WHOP_API_KEY}",
        "WHOP_APP_ID": "${WHOP_APP_ID}"
      }
    }
  }
}
```

## Verifying Setup

Once configured, you should be able to:

1. **List Whop products:**
   ```
   Use mcp__whop__list_products to see available products
   ```

2. **Get membership info:**
   ```
   Use mcp__whop__get_membership to check a membership
   ```

3. **Validate memberships:**
   ```
   Use mcp__whop__validate_membership to validate access
   ```

## Next Steps

After setting up the Whop MCP server:

1. Update your project's `.mcp.json` with the correct paths
2. Set environment variables (`WHOP_API_KEY`, `WHOP_APP_ID`)
3. Restart Claude Code
4. Test MCP tools are available
5. Continue development with Whop MCP integration

## Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Whop Developer Documentation](https://docs.whop.com)
- [Chronos MCP Configuration Guide](./MCP_CONFIGURATIONS.md)
- [Claude Code MCP Setup](https://claude.ai/code)

---

**Last Updated:** 2025-01-10  
**Project:** Chronos  
**Version:** 1.0

