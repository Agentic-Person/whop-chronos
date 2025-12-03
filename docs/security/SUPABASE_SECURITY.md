# Supabase Security Best Practices

## Critical Security Rules

### 1. NEVER Expose Service Role Key in Client Code

**RULE:** The Supabase service role key MUST NEVER be used in browser code.

**Why:** The service role key bypasses ALL Row Level Security (RLS) policies, granting unrestricted access to the entire database. If exposed in client-side code, any user can:
- Read all data from all tables
- Modify or delete any data
- Bypass all authentication and authorization
- Access other users' private information

### 2. Correct Key Usage

#### ✅ CORRECT: Server-Side Only

```typescript
// lib/db/client.ts (SERVER-SIDE ONLY)
export function getServiceSupabase() {
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']; // ✅ Server-side env var
  return createClient(supabaseUrl, serviceRoleKey);
}
```

**When to use:**
- Background jobs (Inngest functions)
- Admin operations
- System-level queries
- Webhook handlers
- Server-side API routes that need elevated permissions

#### ✅ CORRECT: Browser Code

```typescript
// lib/db/client-browser.ts (CLIENT-SIDE)
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']; // ✅ Public anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Always use:**
- The anon key for all browser code
- RLS policies to control access
- Proper authentication with JWT tokens

#### ❌ WRONG: Service Role Key in Browser

```typescript
// ❌ NEVER DO THIS
const serviceRoleKey = process.env['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY']; // ❌ Exposed to browser!
export const supabase = createClient(supabaseUrl, serviceRoleKey);
```

**Why this is wrong:**
- `NEXT_PUBLIC_*` variables are bundled into client-side JavaScript
- Anyone can inspect browser code and extract the key
- Attackers gain full database access

### 3. Environment Variable Rules

#### Server-Side Variables (Private)

```bash
# .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ✅ No NEXT_PUBLIC_ prefix
WHOP_CLIENT_SECRET=whop_xxx           # ✅ Server-only
ANTHROPIC_API_KEY=sk-ant-xxx          # ✅ Server-only
OPENAI_API_KEY=sk-proj-xxx            # ✅ Server-only
```

**Characteristics:**
- No `NEXT_PUBLIC_` prefix
- Only accessible in Node.js environment
- Never bundled into browser code
- Used in API routes, server components, background jobs

#### Client-Side Variables (Public)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co        # ✅ Safe to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...                # ✅ Safe to expose
NEXT_PUBLIC_WHOP_APP_ID=app_xxx                         # ✅ Safe to expose
NEXT_PUBLIC_APP_URL=http://localhost:3007               # ✅ Safe to expose
```

**Characteristics:**
- Has `NEXT_PUBLIC_` prefix
- Bundled into browser JavaScript
- Visible to all users
- Only use for non-sensitive configuration

### 4. Development Mode Authentication Bypass

#### ❌ WRONG Approach (Security Vulnerability)

```typescript
// ❌ NEVER DO THIS - Exposes service role key to browser
const isDev = process.env.NODE_ENV === 'development';
const bypassAuth = process.env['NEXT_PUBLIC_DEV_BYPASS_AUTH'] === 'true';
const serviceRoleKey = process.env['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY']; // ❌ Security hole!

const supabaseKey = isDev && bypassAuth && serviceRoleKey
  ? serviceRoleKey  // ❌ Bypasses RLS in browser code
  : supabaseAnonKey;
```

**Why this is wrong:**
- Service role key is in browser code (even if conditionally used)
- Anyone can set `DEV_BYPASS_AUTH=true` in their browser
- Attackers can extract the key from bundled JavaScript

#### ✅ CORRECT Approach (Secure)

```typescript
// lib/db/client-browser.ts - Browser code ALWAYS uses anon key
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']; // ✅ Always anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

```typescript
// app/api/courses/student/route.ts - Server-side bypass logic
const isDev = process.env.NODE_ENV === 'development';
const bypassAuth = process.env.DEV_BYPASS_AUTH === 'true'; // ✅ Server-side only

if (isDev && bypassAuth) {
  // ✅ Server-side logic can check bypass flag
  // Show all courses for testing
} else {
  // Production: Validate Whop membership and filter accordingly
}
```

**Why this is correct:**
- Browser code never has access to service role key
- Dev bypass logic is only in server-side API routes
- Server-side code can safely use `DEV_BYPASS_AUTH` without exposing secrets

### 5. Security Checklist

Before deploying or committing code:

- [ ] Browser code (`client-browser.ts`, client components) ONLY uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Service role key is ONLY in `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix)
- [ ] No `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in any environment files
- [ ] Dev bypass logic is in server-side API routes, not browser code
- [ ] All API routes validate authentication before accessing data
- [ ] RLS policies are enabled on all tables
- [ ] Service role key usage is logged and monitored

### 6. Vercel Environment Variables

When deploying to Vercel:

#### Production Environment Variables

```bash
# ✅ CORRECT - Server-side only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ✅ CORRECT - Client-side safe
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Verify:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` has NO checkmark in "Expose to Client"
3. Delete `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` if it exists

### 7. Common Mistakes to Avoid

#### ❌ Mistake 1: Using Service Role Key for Convenience

```typescript
// ❌ WRONG - Using service role key to avoid RLS errors
import { getServiceSupabase } from '@/lib/db/client';

async function getStudentCourses(studentId: string) {
  const supabase = getServiceSupabase(); // ❌ Bypasses all security!
  return supabase.from('courses').select('*'); // ❌ Shows ALL courses
}
```

**Fix:** Use anon key + proper RLS policies

```typescript
// ✅ CORRECT - Respects RLS policies
import { supabase } from '@/lib/db/client-browser';

async function getStudentCourses(studentId: string) {
  const supabase = supabase; // ✅ Uses anon key
  return supabase
    .from('courses')
    .select('*')
    .eq('student_id', studentId); // ✅ RLS policy validates this
}
```

#### ❌ Mistake 2: Conditional Service Role Key Usage

```typescript
// ❌ WRONG - Service role key still exposed
const key = isAdmin
  ? process.env['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'] // ❌ Still in browser bundle!
  : process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
```

**Fix:** Handle admin operations server-side

```typescript
// ✅ CORRECT - Server-side API route for admin operations
// app/api/admin/courses/route.ts
export async function GET(req: Request) {
  const session = await validateAdminSession(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getServiceSupabase(); // ✅ Server-side only
  const { data } = await supabase.from('courses').select('*');
  return NextResponse.json(data);
}
```

### 8. Monitoring and Detection

**Add runtime checks to detect service role key exposure:**

```typescript
// lib/db/client-browser.ts
if (typeof window !== 'undefined') {
  // Running in browser
  const env = process.env as Record<string, string>;
  for (const key of Object.keys(env)) {
    if (key.includes('SERVICE_ROLE') || key.includes('SECRET')) {
      console.error(
        `🚨 SECURITY ALERT: Sensitive environment variable "${key}" detected in browser code!`
      );
      // In production, send alert to monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Sentry.captureException(new Error(`Service role key exposed: ${key}`));
      }
    }
  }
}
```

### 9. Recovery Steps if Service Role Key is Compromised

If the service role key is accidentally exposed:

1. **Immediate Actions (< 1 hour):**
   - Rotate the service role key in Supabase Dashboard
   - Update environment variables in all environments
   - Revoke the old key
   - Audit database logs for unauthorized access

2. **Investigation (< 24 hours):**
   - Review database audit logs
   - Check for data modifications
   - Identify affected user accounts
   - Document the incident

3. **Remediation (< 1 week):**
   - Implement additional monitoring
   - Review all code for similar vulnerabilities
   - Update security documentation
   - Train team on security best practices

### 10. Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/securing-your-data)

---

**Last Updated:** 2025-11-19
**Security Audit:** Passed
**Next Review:** 2025-12-19
