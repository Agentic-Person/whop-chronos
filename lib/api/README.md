# API Error Handling

Standardized error handling utilities for Chronos API routes.

## Quick Start

```typescript
import { handleApiError, ErrorTypes, apiSuccess } from '@/lib/api/error-handler';

export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error, {
      component: 'VideoAPI',
      userId: user.id,
    }, ErrorTypes.DATABASE_ERROR);
  }
}
```

## Available Error Types

### Client Errors (4xx)
- `ErrorTypes.BAD_REQUEST` - Invalid request parameters (400)
- `ErrorTypes.UNAUTHORIZED` - Authentication required (401)
- `ErrorTypes.FORBIDDEN` - Access denied (403)
- `ErrorTypes.NOT_FOUND` - Resource not found (404)
- `ErrorTypes.VALIDATION_ERROR` - Validation failed (422)
- `ErrorTypes.RATE_LIMIT` - Too many requests (429)

### Server Errors (5xx)
- `ErrorTypes.INTERNAL_ERROR` - Internal server error (500)
- `ErrorTypes.DATABASE_ERROR` - Database operation failed (500)
- `ErrorTypes.AI_SERVICE_ERROR` - AI service unavailable (503)
- `ErrorTypes.EXTERNAL_API_ERROR` - External service error (502)

## Functions

### `handleApiError(error, context, errorType)`

Main error handler for all API routes.

**Parameters:**
- `error` - The error object (Error, string, or unknown)
- `context` - Additional logging context (component, userId, etc.)
- `errorType` - Predefined error type from `ErrorTypes`

**Example:**
```typescript
return handleApiError(error, {
  component: 'ChatAPI',
  videoId: video.id,
}, ErrorTypes.AI_SERVICE_ERROR);
```

### `handleValidationError(errors, context)`

Specialized handler for validation errors with field-level details.

**Example:**
```typescript
if (!email || !password) {
  return handleValidationError({
    email: !email ? 'Email is required' : undefined,
    password: !password ? 'Password is required' : undefined,
  }, { component: 'AuthAPI' });
}
```

### `apiSuccess(data, status)`

Creates standardized success responses.

**Example:**
```typescript
return apiSuccess({ video: processedVideo }, 201);
```

### `handleRateLimitError(retryAfter, context)`

Specialized handler for rate limit errors.

**Example:**
```typescript
if (isRateLimited) {
  return handleRateLimitError(60, {
    component: 'VideoUploadAPI',
    userId: user.id,
  });
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-28T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Database operation failed",
    "code": "DATABASE_ERROR",
    "timestamp": "2025-11-28T12:00:00.000Z",
    "details": "Connection timeout" // Development only
  }
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "timestamp": "2025-11-28T12:00:00.000Z",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

## Integration with Logger

All errors are automatically logged using the structured logger:

```typescript
// Automatically logs to console (dev) or Sentry (prod)
logger.error('API error', error, {
  component: 'VideoAPI',
  errorCode: 'DATABASE_ERROR',
  statusCode: 500,
  userId: user.id,
});
```

## Best Practices

1. **Always use specific error types**
   ```typescript
   // Good
   return handleApiError(error, context, ErrorTypes.DATABASE_ERROR);

   // Avoid
   return handleApiError(error, context);
   ```

2. **Provide context for debugging**
   ```typescript
   return handleApiError(error, {
     component: 'VideoAPI',
     videoId: video.id,
     userId: user.id,
     operation: 'transcription',
   }, ErrorTypes.AI_SERVICE_ERROR);
   ```

3. **Use validation handler for input errors**
   ```typescript
   const errors: Record<string, string | undefined> = {
     title: !title ? 'Title is required' : undefined,
     url: !isValidUrl(url) ? 'Invalid URL format' : undefined,
   };

   if (Object.values(errors).some(e => e)) {
     return handleValidationError(errors, { component: 'VideoAPI' });
   }
   ```

4. **Wrap all API routes in try-catch**
   ```typescript
   export async function POST(request: Request) {
     try {
       // Your logic here
       return apiSuccess(data);
     } catch (error) {
       return handleApiError(error, { component: 'YourAPI' });
     }
   }
   ```

## TypeScript Support

All functions are fully typed:

```typescript
// Success response is typed
const response = await fetch('/api/videos');
const data: ApiSuccessResponse<Video> = await response.json();

if (data.success) {
  console.log(data.data.title); // Typed as Video
} else {
  console.log(data.error.message); // Typed as string
}
```
