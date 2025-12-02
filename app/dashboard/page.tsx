/**
 * Dashboard Entry Point
 *
 * Whop loads /dashboard and expects us to use the iframe SDK to get context.
 * This uses the raw @whop/iframe SDK with detailed debugging and referrer fallback.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardEntryPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Initializing...');
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getContextAndRedirect() {
      try {
        // Step 1: Check iframe
        const inIframe = window.self !== window.top;
        setDebugInfo(prev => ({ ...prev, inIframe, step: 1 }));
        setStatus('Step 1: Checking iframe...');

        if (!inIframe) {
          setError('Not running inside Whop. Please access this app from your Whop dashboard.');
          return;
        }

        // Step 2: Get referrer and URL info
        setStatus('Step 2: Checking URL context...');
        const currentUrl = window.location.href;
        const referrer = document.referrer;
        setDebugInfo(prev => ({ ...prev, currentUrl, referrer, step: 2 }));

        // Step 3: Try to extract IDs from the referrer
        // Admin URL: whop.com/dashboard/biz_xxx/apps/app_xxx/
        // Joined URL: whop.com/joined/xxx/exp_xxx/app/
        setStatus('Step 3: Extracting from referrer...');

        const bizMatch = referrer.match(/biz_[a-zA-Z0-9]+/);
        const expMatch = referrer.match(/exp_[a-zA-Z0-9]+/);

        setDebugInfo(prev => ({
          ...prev,
          bizMatch: bizMatch ? bizMatch[0] : null,
          expMatch: expMatch ? expMatch[0] : null,
          step: 3
        }));

        // Step 4: Try SDK import
        setStatus('Step 4: Loading Whop SDK...');
        const { createSdk } = await import('@whop/iframe');
        const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
        setDebugInfo(prev => ({ ...prev, appId, step: 4 }));

        if (!appId) {
          setError('NEXT_PUBLIC_WHOP_APP_ID not configured');
          return;
        }

        // Step 5: Create SDK
        setStatus('Step 5: Creating SDK instance...');
        const sdk = createSdk({ appId });
        setDebugInfo(prev => ({ ...prev, sdkCreated: true, step: 5 }));

        // Step 6: Try SDK call with timeout
        setStatus('Step 6: Calling getTopLevelUrlData (15s timeout)...');

        const urlData = await Promise.race([
          sdk.getTopLevelUrlData({}),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SDK timeout after 15 seconds')), 15000)
          )
        ]);

        setDebugInfo(prev => ({ ...prev, urlData, step: 6 }));
        setStatus('Step 6: Got URL data!');

        // Step 7: Redirect based on SDK response
        const data = urlData as { experienceId?: string; companyRoute?: string };
        const companyMatch = data.companyRoute?.match(/biz_[a-zA-Z0-9]+/);

        if (companyMatch) {
          router.replace(`/dashboard/${companyMatch[0]}/overview`);
        } else if (data.experienceId) {
          router.replace(`/experiences/${data.experienceId}/courses`);
        } else if (bizMatch) {
          // Fallback: Use company ID from referrer
          setStatus('Using companyId from referrer...');
          router.replace(`/dashboard/${bizMatch[0]}/overview`);
        } else if (expMatch) {
          // Fallback: Use experience ID from referrer
          setStatus('Using experienceId from referrer...');
          router.replace(`/experiences/${expMatch[0]}/courses`);
        } else {
          setError('Could not determine company or experience from Whop context.');
        }
      } catch (err) {
        console.error('[Dashboard] Failed to get Whop context:', err);

        // Fallback: Try to use referrer
        const referrer = document.referrer;
        const bizMatch = referrer.match(/biz_[a-zA-Z0-9]+/);
        const expMatch = referrer.match(/exp_[a-zA-Z0-9]+/);

        if (bizMatch) {
          setStatus(`SDK failed, using referrer fallback: ${bizMatch[0]}`);
          setDebugInfo(prev => ({ ...prev, fallbackUsed: true, fallbackBizId: bizMatch[0] }));
          router.replace(`/dashboard/${bizMatch[0]}/overview`);
          return;
        }

        if (expMatch) {
          setStatus(`SDK failed, using referrer fallback: ${expMatch[0]}`);
          setDebugInfo(prev => ({ ...prev, fallbackUsed: true, fallbackExpId: expMatch[0] }));
          router.replace(`/experiences/${expMatch[0]}/courses`);
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to connect to Whop');
        setDebugInfo(prev => ({ ...prev, error: String(err) }));
      }
    }

    getContextAndRedirect();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-1 p-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-12">Connection Error</h1>
          <p className="text-gray-11">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-a4 text-gray-12 rounded-lg hover:bg-gray-a5 transition-colors"
            >
              Try Again
            </button>
            <a
              href="https://whop.com/hub"
              className="px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors"
            >
              Go to Whop Hub
            </a>
          </div>
          <div className="mt-8 p-4 bg-gray-2 border border-gray-a4 rounded-lg text-left">
            <p className="text-sm font-mono text-gray-11 mb-2">Debug Info:</p>
            <pre className="text-xs text-gray-10 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-1">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-9 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-11">{status}</p>
        <div className="mt-8 p-4 bg-gray-2 border border-gray-a4 rounded-lg text-left max-w-md">
          <p className="text-sm font-mono text-gray-11 mb-2">Debug:</p>
          <pre className="text-xs text-gray-10 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
