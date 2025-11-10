/**
 * Server-Sent Events (SSE) Streaming Utilities
 *
 * Utilities for streaming AI responses to the client.
 * - SSE formatting
 * - Connection management
 * - Error handling during streaming
 * - Client reconnection support
 */

/**
 * Format SSE message
 */
export function formatSSEMessage(
  event: string,
  data: unknown
): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create SSE response headers
 */
export function createSSEHeaders(): Headers {
  return new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });
}

/**
 * SSE event types
 */
export const SSE_EVENTS = {
  CONTENT: 'content',
  DONE: 'done',
  ERROR: 'error',
  PING: 'ping',
  METADATA: 'metadata',
} as const;

/**
 * Create streaming response
 */
export function createStreamingResponse(
  stream: ReadableStream<Uint8Array>
): Response {
  return new Response(stream, {
    headers: createSSEHeaders(),
  });
}

/**
 * Stream encoder for SSE
 */
export class SSEEncoder {
  private encoder = new TextEncoder();

  encode(event: string, data: unknown): Uint8Array {
    return this.encoder.encode(formatSSEMessage(event, data));
  }

  encodeContent(content: string): Uint8Array {
    return this.encode(SSE_EVENTS.CONTENT, { content });
  }

  encodeDone(metadata?: Record<string, unknown>): Uint8Array {
    return this.encode(SSE_EVENTS.DONE, metadata || {});
  }

  encodeError(error: string): Uint8Array {
    return this.encode(SSE_EVENTS.ERROR, { error });
  }

  encodePing(): Uint8Array {
    return this.encode(SSE_EVENTS.PING, { timestamp: Date.now() });
  }

  encodeMetadata(metadata: Record<string, unknown>): Uint8Array {
    return this.encode(SSE_EVENTS.METADATA, metadata);
  }
}

/**
 * Create a readable stream for SSE
 */
export function createSSEStream(
  generator: AsyncGenerator<{
    type: 'content' | 'done' | 'error';
    content?: string;
    usage?: { inputTokens: number; outputTokens: number };
    error?: string;
  }>
): ReadableStream<Uint8Array> {
  const encoder = new SSEEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          switch (chunk.type) {
            case 'content':
              if (chunk.content) {
                controller.enqueue(encoder.encodeContent(chunk.content));
              }
              break;

            case 'done':
              controller.enqueue(
                encoder.encodeDone({
                  usage: chunk.usage,
                  timestamp: Date.now(),
                })
              );
              controller.close();
              break;

            case 'error':
              controller.enqueue(encoder.encodeError(chunk.error || 'Unknown error'));
              controller.close();
              break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        controller.enqueue(encoder.encodeError(errorMessage));
        controller.close();
      }
    },
  });
}

/**
 * Client-side SSE parser
 */
export class SSEParser {
  private buffer = '';

  parse(chunk: string): Array<{ event: string; data: unknown }> {
    this.buffer += chunk;
    const events: Array<{ event: string; data: unknown }> = [];

    // Split by double newline (SSE message separator)
    const messages = this.buffer.split('\n\n');

    // Keep the last incomplete message in buffer
    this.buffer = messages.pop() || '';

    for (const message of messages) {
      const lines = message.split('\n');
      let event = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          event = line.slice(7);
        } else if (line.startsWith('data: ')) {
          data = line.slice(6);
        }
      }

      if (data) {
        try {
          events.push({
            event,
            data: JSON.parse(data),
          });
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      }
    }

    return events;
  }

  reset(): void {
    this.buffer = '';
  }
}

/**
 * Create a heartbeat stream to keep connection alive
 */
export function createHeartbeatStream(
  intervalMs = 30000
): ReadableStream<Uint8Array> {
  const encoder = new SSEEncoder();

  return new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        controller.enqueue(encoder.encodePing());
      }, intervalMs);

      // Cleanup on cancel
      return () => clearInterval(interval);
    },
  });
}

/**
 * Merge multiple streams (e.g., content + heartbeat)
 */
export function mergeStreams(
  ...streams: ReadableStream<Uint8Array>[]
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const readers = streams.map(s => s.getReader());

      const readNext = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream read error:', error);
        }
      };

      await Promise.all(readers.map(readNext));
      controller.close();
    },
  });
}

/**
 * Add timeout to stream
 */
export function timeoutStream(
  stream: ReadableStream<Uint8Array>,
  timeoutMs: number
): ReadableStream<Uint8Array> {
  const encoder = new SSEEncoder();

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        controller.enqueue(encoder.encodeError('Stream timeout'));
        controller.close();
        reader.cancel();
      }, timeoutMs);

      try {
        while (true) {
          if (timedOut) break;

          const { done, value } = await reader.read();

          if (done) {
            clearTimeout(timeout);
            controller.close();
            break;
          }

          controller.enqueue(value);
        }
      } catch (error) {
        clearTimeout(timeout);
        if (!timedOut) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(encoder.encodeError(errorMessage));
          controller.close();
        }
      }
    },
  });
}

/**
 * Retry stream with exponential backoff
 */
export async function retryStream<T>(
  streamFactory: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await streamFactory();
    } catch (error) {
      console.error(`Stream attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Retry stream failed');
}

/**
 * Client-side reconnection helper
 */
export class SSEReconnector {
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectAttempts = 0;

  getReconnectDelay(): number {
    // Exponential backoff with max delay
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    return delay;
  }

  reset(): void {
    this.reconnectAttempts = 0;
  }

  shouldReconnect(error: Error): boolean {
    // Don't reconnect on auth errors or client errors
    if (
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('400')
    ) {
      return false;
    }

    return true;
  }
}

/**
 * Create client-side SSE connection with auto-reconnect
 */
export interface SSEClientOptions {
  onMessage: (event: string, data: unknown) => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
  maxReconnectAttempts?: number;
}

export function createSSEClient(
  url: string,
  options: SSEClientOptions
): () => void {
  const reconnector = new SSEReconnector();
  let abortController: AbortController | null = null;

  const connect = async () => {
    abortController = new AbortController();

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: {
          Accept: 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = new SSEParser();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = parser.parse(chunk);

        for (const { event, data } of events) {
          options.onMessage(event, data);

          // Reset reconnect counter on successful message
          if (event === SSE_EVENTS.CONTENT || event === SSE_EVENTS.DONE) {
            reconnector.reset();
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Connection was manually closed
        return;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);

      // Attempt reconnection
      if (reconnector.shouldReconnect(err)) {
        const delay = reconnector.getReconnectDelay();

        if (
          !options.maxReconnectAttempts ||
          reconnector['reconnectAttempts'] <= options.maxReconnectAttempts
        ) {
          options.onReconnect?.();
          setTimeout(connect, delay);
        }
      }
    }
  };

  // Start connection
  connect();

  // Return cleanup function
  return () => {
    abortController?.abort();
  };
}
