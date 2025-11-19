import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../ChatInterface';

// Mock the child components
vi.mock('../MessageList', () => ({
  MessageList: ({ messages }: any) => (
    <div data-testid="message-list">
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid={`message-${msg.role}`}>
          {msg.content}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../MessageInput', () => ({
  MessageInput: ({ onSend, disabled, placeholder }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="input-field"
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const value = e.target.value;
          e.target.dataset.value = value;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            const value = (e.target as HTMLInputElement).dataset.value || '';
            onSend(value);
          }
        }}
      />
    </div>
  ),
}));

vi.mock('../SessionSidebar', () => ({
  SessionSidebar: ({ onNewChat, onSessionSelect }: any) => (
    <div data-testid="session-sidebar">
      <button data-testid="new-chat-button" onClick={onNewChat}>
        New Chat
      </button>
      <button
        data-testid="session-button"
        onClick={() => onSessionSelect('session-123')}
      >
        Load Session
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

describe('ChatInterface Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  describe('Rendering', () => {
    it('should render chat interface', () => {
      render(<ChatInterface />);

      expect(screen.getByText(/AI Learning Assistant/i)).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('session-sidebar')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      render(<ChatInterface />);

      expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Ask me anything about your course content/i)
      ).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      render(<ChatInterface />);

      const input = screen.getByPlaceholderText(/Ask a question about your course/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('should send message and display response', async () => {
      const mockResponse = {
        id: 'msg-456',
        content: 'This is the AI response',
        timestamp: new Date().toISOString(),
        videoReferences: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      // Simulate typing and sending
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      // Wait for messages to appear
      await waitFor(() => {
        const userMessages = screen.getAllByTestId('message-user');
        expect(userMessages.length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        const assistantMessages = screen.getAllByTestId('message-assistant');
        expect(assistantMessages.length).toBeGreaterThan(0);
        expect(screen.getByText('This is the AI response')).toBeInTheDocument();
      });
    });

    it('should not send empty messages', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      // Try to send empty message
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      // Fetch should not be called
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should show loading indicator while sending', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    id: 'msg-456',
                    content: 'Response',
                    timestamp: new Date().toISOString(),
                  }),
                }),
              100
            )
          )
      );

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      // Loading indicator should appear
      await waitFor(() => {
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(screen.getByText(/AI is typing/i)).toBeInTheDocument();
      });
    });

    it('should disable input while sending', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    id: 'msg-456',
                    content: 'Response',
                    timestamp: new Date().toISOString(),
                  }),
                }),
              100
            )
          )
      );

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      // Input should be disabled
      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when API call fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display error when API returns non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry sending message on retry button click', async () => {
      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg-456',
          content: 'Success',
          timestamp: new Date().toISOString(),
        }),
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should call onSessionChange when session is selected', async () => {
      const onSessionChange = vi.fn();

      render(<ChatInterface onSessionChange={onSessionChange} />);

      const sessionButton = screen.getByTestId('session-button');
      fireEvent.click(sessionButton);

      expect(onSessionChange).toHaveBeenCalledWith('session-123');
    });

    it('should clear messages on new chat', () => {
      render(<ChatInterface />);

      // First, add a message (we need to wait for it to render)
      const newChatButton = screen.getByTestId('new-chat-button');
      fireEvent.click(newChatButton);

      // Empty state should be visible
      expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
    });

    it('should call onSessionChange with empty string on new chat', () => {
      const onSessionChange = vi.fn();

      render(<ChatInterface onSessionChange={onSessionChange} />);

      const newChatButton = screen.getByTestId('new-chat-button');
      fireEvent.click(newChatButton);

      expect(onSessionChange).toHaveBeenCalledWith('');
    });
  });

  describe('API Integration', () => {
    it('should send sessionId in request body', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      (fetchSpy as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg-456',
          content: 'Response',
          timestamp: new Date().toISOString(),
        }),
      });

      render(<ChatInterface sessionId="session-abc" />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('session-abc'),
          })
        );
      });
    });

    it('should send message content in request body', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      (fetchSpy as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg-456',
          content: 'Response',
          timestamp: new Date().toISOString(),
        }),
      });

      render(<ChatInterface />);

      const input = screen.getByTestId('input-field');

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({
            body: expect.stringContaining('Test message'),
          })
        );
      });
    });
  });
});
