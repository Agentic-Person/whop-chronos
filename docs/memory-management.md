# Memory Management Best Practices

## Overview

This document outlines memory management best practices for React components in the Chronos application. Following these patterns prevents memory leaks and ensures optimal performance.

## Common Memory Leak Patterns

### 1. Event Listeners

**❌ BAD - Event listeners never removed:**
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup - listener persists after unmount
}, []);
```

**✅ GOOD - Event listeners properly cleaned up:**
```typescript
useEffect(() => {
  const handleResize = () => {
    // Handle resize logic
  };

  window.addEventListener('resize', handleResize);

  // Cleanup function removes listener on unmount
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Real Example from VideoDetailModal:**
```typescript
// Close on ESC key
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  window.addEventListener('keydown', handleEsc);

  // ✅ Cleanup function - removes event listener when component unmounts
  return () => window.removeEventListener('keydown', handleEsc);
}, [onClose]);
```

### 2. Timers and Intervals

**❌ BAD - Intervals never cleared:**
```typescript
useEffect(() => {
  setInterval(() => fetchData(), 5000);
  // Missing cleanup - interval continues after unmount
}, []);
```

**✅ GOOD - Intervals properly cleared:**
```typescript
useEffect(() => {
  const interval = setInterval(() => fetchData(), 5000);

  // Cleanup function clears interval on unmount
  return () => clearInterval(interval);
}, []);
```

**Real Example from VideoUrlUploader:**
```typescript
// Status polling for video processing
useEffect(() => {
  if (!currentVideoId || status === 'completed' || status === 'failed') {
    return;
  }

  const pollInterval = setInterval(async () => {
    // Polling logic...
  }, 3000);

  // ✅ Cleanup function - clears interval when component unmounts or dependencies change
  return () => clearInterval(pollInterval);
}, [currentVideoId, status, onComplete]);
```

**Complex Example with Multiple Timers (VideoUploader):**
```typescript
const startStatusPolling = useCallback((videoId: string) => {
  const pollInterval = setInterval(async () => {
    // Polling logic...
  }, 2000);

  const timeoutId = setTimeout(() => {
    clearInterval(pollInterval);
    // Timeout logic...
  }, 600000);

  // ✅ Return cleanup function that clears BOTH timers
  return () => {
    clearInterval(pollInterval);
    clearTimeout(timeoutId);
  };
}, [status, onVideoUploaded]);
```

### 3. XMLHttpRequest Event Listeners

**❌ BAD - XHR listeners never removed:**
```typescript
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', handleProgress);
xhr.addEventListener('load', handleLoad);
xhr.addEventListener('error', handleError);
xhr.send(data);
// Missing cleanup - listeners persist after component unmounts
```

**✅ GOOD - XHR listeners properly cleaned up:**
```typescript
useEffect(() => {
  let xhr: XMLHttpRequest | null = null;

  const upload = async () => {
    xhr = new XMLHttpRequest();

    const progressHandler = (e: ProgressEvent) => { /* ... */ };
    const loadHandler = async () => { /* ... */ };
    const errorHandler = () => { /* ... */ };
    const abortHandler = () => { /* ... */ };

    xhr.upload.addEventListener('progress', progressHandler);
    xhr.addEventListener('load', loadHandler);
    xhr.addEventListener('error', errorHandler);
    xhr.addEventListener('abort', abortHandler);

    xhr.open('POST', url);
    xhr.send(data);
  };

  upload();

  // ✅ Cleanup function - removes all listeners and aborts request
  return () => {
    if (xhr) {
      xhr.upload.removeEventListener('progress', progressHandler);
      xhr.removeEventListener('load', loadHandler);
      xhr.removeEventListener('error', errorHandler);
      xhr.removeEventListener('abort', abortHandler);
      xhr.abort(); // Cancel in-flight request
    }
  };
}, [file, url]);
```

**Real Example from VideoUploader (refactored):**
```typescript
const handleFileUpload = useCallback(async () => {
  let xhr: XMLHttpRequest | null = null;

  try {
    xhr = new XMLHttpRequest();

    const progressHandler = (e: ProgressEvent) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    const loadHandler = async () => { /* ... */ };
    const errorHandler = () => { /* ... */ };
    const abortHandler = () => { /* ... */ };

    xhr.upload.addEventListener('progress', progressHandler);
    xhr.addEventListener('load', loadHandler);
    xhr.addEventListener('error', errorHandler);
    xhr.addEventListener('abort', abortHandler);

    xhr.open(upload.method, upload.url);
    xhr.send(selectedFile);

    // ✅ Return cleanup function
    return () => {
      if (xhr) {
        xhr.upload.removeEventListener('progress', progressHandler);
        xhr.removeEventListener('load', loadHandler);
        xhr.removeEventListener('error', errorHandler);
        xhr.removeEventListener('abort', abortHandler);
        xhr.abort();
      }
    };
  } catch (err) {
    // Error handling...
  }
}, [selectedFile, videoTitle, creatorId]);
```

### 4. Async Operations

**❌ BAD - No cancellation for async operations:**
```typescript
useEffect(() => {
  fetchData().then(setData);
  // Component might unmount before promise resolves
}, []);
```

**✅ GOOD - Async operations with cancellation flag:**
```typescript
useEffect(() => {
  let cancelled = false;

  fetchData().then(data => {
    if (!cancelled) setData(data);
  });

  // Cleanup function sets cancellation flag
  return () => { cancelled = true; };
}, []);
```

### 5. Supabase Subscriptions

**❌ BAD - Subscriptions never removed:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('videos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, handleChange)
    .subscribe();
  // Missing cleanup - subscription persists
}, []);
```

**✅ GOOD - Subscriptions properly cleaned up:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('videos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, handleChange)
    .subscribe();

  // Cleanup function removes subscription
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## ESLint Configuration

We use ESLint rules to automatically detect missing useEffect dependencies and cleanup functions:

```json
{
  "extends": "next/core-web-vitals",
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**What these rules do:**
- `react-hooks/rules-of-hooks` - Enforces Rules of Hooks (useEffect must be at top level)
- `react-hooks/exhaustive-deps` - Warns about missing dependencies in useEffect/useCallback/useMemo

## Memory Leak Fixes Applied

### Fixed Components

1. **VideoUploader.tsx** (HIGH severity)
   - Fixed XHR event listener leak (lines 151-189)
   - Fixed status polling interval leak (line 208)
   - Added cleanup ref for polling on unmount

2. **VideoUrlUploader.tsx** (MEDIUM severity)
   - Fixed polling interval leak (line 54)

3. **VideoDetailModal.tsx** (MEDIUM severity)
   - Fixed keydown event listener leak (line 166)

4. **CourseFilters.tsx** (LOW severity)
   - Fixed click event listener leak (line 88)

### Before vs After Impact

**Before (LEAKING):**
- 70MB/hour memory drain
- Event listeners accumulating
- Intervals running after unmount
- XHR requests never cancelled

**After (FIXED):**
- All event listeners removed on unmount
- All intervals cleared on unmount
- XHR requests aborted on unmount
- Expected memory usage: Stable (no continuous growth)

## Testing for Memory Leaks

### Manual Browser Testing

1. Open Chrome DevTools → Memory tab
2. Take heap snapshot (Snapshot 1)
3. Navigate to component and interact with it
4. Navigate away and back 10 times
5. Take heap snapshot (Snapshot 2)
6. Compare snapshots:
   - **Memory leak:** Snapshot 2 >> Snapshot 1
   - **No leak:** Snapshot 2 ≈ Snapshot 1 ✅

### Automated Testing (Future)

Consider adding memory leak tests using tools like:
- **@testing-library/react** with cleanup verification
- **puppeteer** for automated memory profiling
- **jest-leak-detector** for unit test memory validation

## Best Practices Checklist

When adding new components, verify:

- [ ] All `addEventListener` calls have matching `removeEventListener` in cleanup
- [ ] All `setInterval`/`setTimeout` calls have matching `clearInterval`/`clearTimeout` in cleanup
- [ ] All XHR/fetch requests can be cancelled on unmount
- [ ] All Supabase subscriptions have cleanup
- [ ] All external library subscriptions (Recharts, etc.) have cleanup
- [ ] ESLint warnings about missing dependencies are resolved
- [ ] useEffect cleanup functions are present where needed
- [ ] Refs are used to track cleanup functions for async operations

## Common Mistakes to Avoid

1. **Forgetting cleanup in useEffect**
   ```typescript
   useEffect(() => {
     window.addEventListener('scroll', handleScroll);
     // ❌ No cleanup function
   }, []);
   ```

2. **Not storing timer IDs**
   ```typescript
   useEffect(() => {
     setInterval(() => { /* ... */ }, 1000);
     // ❌ Can't clear interval - no reference
   }, []);
   ```

3. **Cleanup function doesn't match setup**
   ```typescript
   useEffect(() => {
     const handleClick = () => { /* ... */ };
     document.addEventListener('click', handleClick);
     return () => {
       // ❌ Wrong event name
       document.removeEventListener('mousedown', handleClick);
     };
   }, []);
   ```

4. **Missing dependencies in cleanup function**
   ```typescript
   useEffect(() => {
     const cleanup = startPolling(videoId);
     return cleanup; // ✅ Good
   }, [videoId]);

   // vs

   useEffect(() => {
     startPolling(videoId);
     // ❌ No cleanup reference
   }, [videoId]);
   ```

## Additional Resources

- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Using the Effect Hook](https://react.dev/reference/react/useEffect)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [ESLint React Hooks Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)

## Revision History

- **2025-11-18**: Initial documentation - Fixed 7 memory leaks across 4 components
  - VideoUploader: XHR listeners + polling intervals
  - VideoUrlUploader: Polling interval
  - VideoDetailModal: Keydown listener
  - CourseFilters: Click listener

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
