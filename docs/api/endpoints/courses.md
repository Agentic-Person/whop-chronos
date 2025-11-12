# Courses API Documentation

Complete API reference for course and module management in Chronos.

---

## Table of Contents

1. [Courses](#courses)
2. [Modules](#modules)
3. [Error Codes](#error-codes)
4. [Examples](#examples)

---

## Courses

### Create Course

**POST** `/api/courses`

Create a new course.

**Request Body:**

```json
{
  "creator_id": "uuid",          // Required
  "title": "string",              // Required (3-200 chars)
  "description": "string",        // Optional
  "thumbnail_url": "string",      // Optional
  "is_published": boolean,        // Optional (default: false)
  "display_order": number         // Optional
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "Introduction to Trading",
    "description": "Learn the basics of...",
    "thumbnail_url": "https://...",
    "is_published": false,
    "display_order": 1,
    "metadata": {},
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z",
    "published_at": null,
    "is_deleted": false
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid title length
- `404 Not Found` - Creator not found
- `500 Internal Server Error` - Database error

---

### List Courses

**GET** `/api/courses?creator_id={uuid}&include_unpublished={boolean}&page={number}&limit={number}`

List all courses for a creator.

**Query Parameters:**

- `creator_id` (required): Creator UUID
- `include_unpublished` (optional): Include unpublished courses (default: false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "uuid",
        "creator_id": "uuid",
        "title": "Introduction to Trading",
        "description": "Learn the basics...",
        "thumbnail_url": "https://...",
        "is_published": true,
        "display_order": 1,
        "module_count": 5,
        "created_at": "2025-01-12T10:00:00Z",
        "updated_at": "2025-01-12T10:00:00Z",
        "published_at": "2025-01-15T10:00:00Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### Get Course

**GET** `/api/courses/{id}`

Get detailed course information including modules.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "Introduction to Trading",
    "description": "Learn the basics...",
    "thumbnail_url": "https://...",
    "is_published": true,
    "display_order": 1,
    "module_count": 3,
    "course_modules": [
      {
        "id": "uuid",
        "title": "Module 1: Getting Started",
        "description": "Learn the fundamentals",
        "video_ids": ["uuid1", "uuid2", "uuid3"],
        "display_order": 1,
        "created_at": "2025-01-12T10:00:00Z",
        "updated_at": "2025-01-12T10:00:00Z"
      }
    ],
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z",
    "published_at": "2025-01-15T10:00:00Z",
    "is_deleted": false,
    "metadata": {}
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing course ID
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Database error

---

### Update Course

**PUT** `/api/courses/{id}`

Update course details.

**Request Body:**

```json
{
  "creator_id": "uuid",          // Required (for authorization)
  "title": "string",              // Optional (3-200 chars)
  "description": "string",        // Optional
  "thumbnail_url": "string",      // Optional
  "is_published": boolean,        // Optional
  "display_order": number         // Optional
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "Updated Title",
    "description": "Updated description...",
    "is_published": true,
    "published_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T11:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid title length
- `403 Forbidden` - User does not own this course
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Database error

---

### Delete Course

**DELETE** `/api/courses/{id}`

Soft delete a course.

**Request Body:**

```json
{
  "creator_id": "uuid"  // Required (for authorization)
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields
- `403 Forbidden` - User does not own this course
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Database error

---

## Modules

### Create Module

**POST** `/api/courses/{id}/modules`

Create a new module in a course.

**Request Body:**

```json
{
  "creator_id": "uuid",          // Required (for authorization)
  "title": "string",              // Required (3-200 chars)
  "description": "string",        // Optional
  "display_order": number,        // Required
  "video_ids": ["uuid1", "uuid2"] // Optional (default: [])
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_id": "uuid",
    "title": "Module 1: Getting Started",
    "description": "Learn the fundamentals",
    "video_ids": ["uuid1", "uuid2"],
    "display_order": 1,
    "metadata": {},
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid title length
- `403 Forbidden` - User does not own this course
- `404 Not Found` - Course not found
- `500 Internal Server Error` - Database error

---

### List Modules

**GET** `/api/courses/{id}/modules`

List all modules for a course.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": "uuid",
        "course_id": "uuid",
        "title": "Module 1: Getting Started",
        "description": "Learn the fundamentals",
        "video_ids": ["uuid1", "uuid2", "uuid3"],
        "video_count": 3,
        "display_order": 1,
        "metadata": {},
        "created_at": "2025-01-12T10:00:00Z",
        "updated_at": "2025-01-12T10:00:00Z"
      }
    ]
  }
}
```

---

### Get Module

**GET** `/api/modules/{id}`

Get module details including video information.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_id": "uuid",
    "title": "Module 1: Getting Started",
    "description": "Learn the fundamentals",
    "video_ids": ["uuid1", "uuid2"],
    "video_count": 2,
    "videos": [
      {
        "id": "uuid1",
        "title": "Introduction Video",
        "description": "Welcome to the course",
        "thumbnail_url": "https://...",
        "duration_seconds": 600,
        "status": "completed",
        "source_type": "youtube",
        "youtube_video_id": "abc123"
      }
    ],
    "display_order": 1,
    "metadata": {},
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
}
```

---

### Update Module

**PUT** `/api/modules/{id}`

Update module details.

**Request Body:**

```json
{
  "creator_id": "uuid",          // Required (for authorization)
  "title": "string",              // Optional (3-200 chars)
  "description": "string",        // Optional
  "display_order": number,        // Optional
  "video_ids": ["uuid1", "uuid2"] // Optional
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "course_id": "uuid",
    "title": "Updated Module Title",
    "description": "Updated description",
    "video_ids": ["uuid1", "uuid2", "uuid3"],
    "display_order": 1,
    "updated_at": "2025-01-15T11:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields, invalid title, or video_ids not an array
- `403 Forbidden` - User does not own this module
- `404 Not Found` - Module not found
- `500 Internal Server Error` - Database error

---

### Delete Module

**DELETE** `/api/modules/{id}`

Delete a module.

**Request Body:**

```json
{
  "creator_id": "uuid"  // Required (for authorization)
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields
- `403 Forbidden` - User does not own this module
- `404 Not Found` - Module not found
- `500 Internal Server Error` - Database error

---

## Error Codes

All API endpoints use consistent error codes:

| Code | Description |
|------|-------------|
| `CREATOR_NOT_FOUND` | Creator does not exist |
| `COURSE_NOT_FOUND` | Course does not exist or is deleted |
| `MODULE_NOT_FOUND` | Module does not exist |
| `FORBIDDEN` | User does not own this resource |
| `CREATION_FAILED` | Failed to create resource in database |
| `UPDATE_FAILED` | Failed to update resource in database |
| `DELETE_FAILED` | Failed to delete resource in database |
| `FETCH_FAILED` | Failed to fetch data from database |

**Error Response Format:**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Examples

### Complete Course Creation Flow

```javascript
// 1. Create course
const courseResponse = await fetch('/api/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    title: 'Introduction to Trading',
    description: 'Learn the basics of trading',
    is_published: false
  })
});
const course = await courseResponse.json();
const courseId = course.data.id;

// 2. Create first module
const module1Response = await fetch(`/api/courses/${courseId}/modules`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    title: 'Module 1: Getting Started',
    description: 'Learn the fundamentals',
    display_order: 1,
    video_ids: []
  })
});
const module1 = await module1Response.json();
const moduleId = module1.data.id;

// 3. Add videos to module
await fetch(`/api/modules/${moduleId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    video_ids: ['video-uuid-1', 'video-uuid-2', 'video-uuid-3']
  })
});

// 4. Publish course
await fetch(`/api/courses/${courseId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creator_id: 'creator-uuid',
    is_published: true
  })
});
```

### Reorder Modules

```javascript
// Update display_order for each module
const modules = [
  { id: 'module-1-uuid', display_order: 3 },
  { id: 'module-2-uuid', display_order: 1 },
  { id: 'module-3-uuid', display_order: 2 }
];

for (const module of modules) {
  await fetch(`/api/modules/${module.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator_id: 'creator-uuid',
      display_order: module.display_order
    })
  });
}
```

### Add Video to Multiple Modules

```javascript
const videoId = 'video-uuid';
const moduleIds = ['module-1-uuid', 'module-2-uuid'];

for (const moduleId of moduleIds) {
  // Fetch current video_ids
  const moduleResponse = await fetch(`/api/modules/${moduleId}`);
  const module = await moduleResponse.json();

  // Add new video if not already present
  const videoIds = module.data.video_ids;
  if (!videoIds.includes(videoId)) {
    videoIds.push(videoId);

    await fetch(`/api/modules/${moduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_id: 'creator-uuid',
        video_ids: videoIds
      })
    });
  }
}
```

---

## Best Practices

### Authorization

Always include `creator_id` in mutation requests (POST, PUT, DELETE) to ensure proper authorization:

```javascript
{
  "creator_id": "authenticated-user-uuid",
  // ... other fields
}
```

### Error Handling

Always check for errors before using response data:

```javascript
const response = await fetch('/api/courses', { /* ... */ });
const result = await response.json();

if (!response.ok || !result.success) {
  console.error(`Error: ${result.error} (${result.code})`);
  return;
}

// Use result.data safely
const course = result.data;
```

### Display Order

When creating modules, use sequential `display_order` values:

```javascript
const modules = [
  { title: 'Module 1', display_order: 1 },
  { title: 'Module 2', display_order: 2 },
  { title: 'Module 3', display_order: 3 }
];
```

### Video IDs Array

When updating `video_ids`, always replace the entire array (not append):

```javascript
// ✅ Correct - Replace entire array
{
  "video_ids": ["uuid1", "uuid2", "uuid3"]
}

// ❌ Wrong - Cannot append
{
  "video_ids": { "append": "uuid4" }  // Not supported
}
```

---

**Last Updated:** January 12, 2025
**Version:** 1.0
**Maintained By:** Chronos Development Team
