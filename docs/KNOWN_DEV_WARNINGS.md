# Known Development Warnings

This file documents warnings that appear in development but are **expected behavior** and safe to ignore.

## postMessage Warnings (DEV_BYPASS_AUTH)

**Warnings:**
```
Blocked a postMessage to 'http://localhost:3007' (DEV_BYPASS_AUTH)
Failed to execute 'postMessage' on 'Window': target origin provided does not match the recipient window's origin
```

**Cause:**
When `DEV_BYPASS_AUTH=true` is set in `.env.local`, the app bypasses Whop OAuth for easier local testing. This creates cross-origin messaging conflicts with Playwright tests.

**Impact:**
- ✅ No impact on functionality
- ✅ Only appears in development/testing
- ✅ Production uses real Whop OAuth (no warnings)

**Action Required:**
None - safe to ignore

---

## Recharts Dimension Warnings (FIXED in Phase 3)

**Warning:**
```
Warning: The width(0) and height(0) of chart should be greater than 0
```

**Status:**
✅ FIXED - Added `aspect={2}` prop to all ResponsiveContainer components

---

**Last Updated:** November 13, 2025
