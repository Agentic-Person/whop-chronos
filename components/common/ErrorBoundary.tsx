'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches React errors in child components and displays a fallback UI.
 * Prevents entire page crashes when a component fails.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<MyCustomFallback />} componentName="VideoPlayer">
 *   <VideoPlayer {...props} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  override static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error(
      `[ErrorBoundary${this.props.componentName ? ` - ${this.props.componentName}` : ''}]:`,
      error,
      errorInfo
    );

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler (e.g., for Sentry)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />

            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {this.props.componentName
                ? `${this.props.componentName} Error`
                : 'Something went wrong'}
            </h3>

            <p className="text-sm text-red-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-48 text-red-900">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <Button
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
              iconPosition="left"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized fallback for video player errors
 */
export function VideoPlayerFallback() {
  return (
    <div className="aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Video Player Error
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Unable to load the video player. Please refresh the page or try again later.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}

/**
 * Specialized fallback for chat interface errors
 */
export function ChatFallback() {
  return (
    <div className="h-full flex items-center justify-center p-8 bg-yellow-50">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          Chat Unavailable
        </h3>
        <p className="text-sm text-yellow-700 mb-4">
          The chat feature encountered an error. The video player should still work normally.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Reload Chat
        </Button>
      </div>
    </div>
  );
}
