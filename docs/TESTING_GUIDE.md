# Testing Guide

## Overview

Chronos uses Vitest as its test framework with React Testing Library for component tests. This guide covers how to run tests, write new tests, and maintain test coverage.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Organization

```
chronos/
├── lib/
│   ├── video/__tests__/
│   │   └── youtube-processor.test.ts    # YouTube processing tests
│   ├── storage/__tests__/
│   │   └── quota-manager.test.ts        # Storage quota tests
│   └── whop/__tests__/
│       └── auth-helpers.test.ts         # Authentication tests
├── components/
│   └── chat/__tests__/
│       └── ChatInterface.test.tsx       # Chat component tests
└── app/api/
    └── video/youtube/import/__tests__/
        └── route.test.ts                # API route tests
```

## Coverage Requirements

The project enforces **60% minimum coverage** across all metrics:

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

Coverage thresholds are configured in `vitest.config.ts` and enforced in CI/CD.

## Writing Tests

### Unit Tests

Test pure functions and utilities in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId } from '../youtube-processor';

describe('YouTube Processor', () => {
  it('should extract video ID from standard URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });
});
```

### Component Tests

Test React components with React Testing Library:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';

describe('ChatInterface Component', () => {
  it('should render chat interface', () => {
    render(<ChatInterface />);
    expect(screen.getByText(/AI Learning Assistant/i)).toBeInTheDocument();
  });
});
```

### API Route Tests

Test API route request/response validation:

```typescript
import { describe, it, expect } from 'vitest';

describe('YouTube Import API Route', () => {
  it('should require videoUrl in request body', () => {
    const validRequest = {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      creatorId: 'creator-123',
    };
    expect(validRequest.videoUrl).toBeDefined();
  });
});
```

## Testing Patterns

### Mocking

Mock external dependencies to isolate tests:

```typescript
// Mock Next.js navigation (already configured in vitest.setup.ts)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ success: true }),
  })
);
```

### Async Testing

Use `waitFor` for async operations:

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
  });
});
```

### User Interactions

Simulate user events with `fireEvent` or `userEvent`:

```typescript
import { fireEvent } from '@testing-library/react';

it('should handle button click', () => {
  render(<Button onClick={handleClick} />);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(handleClick).toHaveBeenCalled();
});
```

## Configuration

### vitest.config.ts

Key configuration options:

```typescript
export default defineConfig({
  test: {
    globals: true,                    // Use global test APIs
    environment: 'happy-dom',         // DOM environment for React
    setupFiles: './vitest.setup.ts',  // Setup file
    testTimeout: 10000,               // 10 second timeout
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
```

### vitest.setup.ts

Global test setup and mocks:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull request creation
- Pull request updates

### GitHub Actions Workflow

Located at `.github/workflows/test.yml`:

```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
```

Coverage reports are uploaded to Codecov and commented on PRs.

## Best Practices

### 1. Test File Naming

- Unit tests: `<filename>.test.ts`
- Component tests: `<ComponentName>.test.tsx`
- API tests: `route.test.ts`

### 2. Test Organization

- Group related tests with `describe` blocks
- Use descriptive test names with `it` or `test`
- Follow Arrange-Act-Assert pattern

### 3. Coverage Guidelines

Focus on testing:
- Critical business logic
- User-facing functionality
- Error handling paths
- Edge cases

Don't over-test:
- Third-party libraries
- Simple getters/setters
- Type definitions
- Configuration files

### 4. Keep Tests Fast

- Mock external dependencies
- Avoid unnecessary waiting
- Use small, focused test data
- Run tests in parallel (default with Vitest)

### 5. Test Independence

- Each test should be independent
- Don't rely on test execution order
- Clean up after tests (handled automatically)
- Use fresh test data for each test

## Debugging Tests

### Run specific test file

```bash
npm test -- youtube-processor.test.ts
```

### Run tests matching a pattern

```bash
npm test -- -t "should extract video ID"
```

### Use Vitest UI for debugging

```bash
npm run test:ui
```

The UI opens in your browser with:
- Visual test runner
- Source code viewer
- Console output
- Coverage visualization

### Use `console.log` for debugging

```typescript
it('should do something', () => {
  const result = someFunction();
  console.log('Result:', result);  // Outputs in test runner
  expect(result).toBe(expected);
});
```

## Common Issues

### Issue: Tests timeout

**Solution**: Increase timeout in test or config:

```typescript
it('slow test', async () => {
  // ...
}, 20000); // 20 second timeout
```

### Issue: Mocks not working

**Solution**: Ensure mocks are defined before imports:

```typescript
vi.mock('./some-module', () => ({
  someFunction: vi.fn(),
}));

import { componentUsingModule } from './component';
```

### Issue: Coverage not improving

**Solution**: Check what's uncovered:

```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Current Test Coverage

As of the latest test implementation:

- **Total Tests**: 123 passing
- **Test Files**: 5
- **Key Coverage Areas**:
  - YouTube video processing (31 tests)
  - Authentication helpers (25 tests)
  - Storage quota management (28 tests)
  - API route validation (23 tests)
  - Chat interface (16 tests)

To achieve 60% overall coverage, we need to:
1. Migrate existing Jest tests to Vitest
2. Add integration tests for video processing pipeline
3. Add tests for RAG search functionality
4. Add tests for analytics components

## Future Improvements

- [ ] Migrate Jest tests to Vitest
- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Set up mutation testing
- [ ] Add performance benchmarks
- [ ] Implement snapshot testing for UI components

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
