"use client";

import { ChatInterface } from "@/components/chat";

export default function ChatTestPage() {
  return (
    <div className="h-screen w-full bg-gray-50 p-4">
      <div className="mx-auto h-full max-w-7xl">
        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Chat Interface Test
          </h1>
          <p className="text-sm text-gray-600">
            Testing the AI chat interface components
          </p>
        </div>

        <div className="h-[calc(100vh-8rem)]">
          <ChatInterface
            sessionId="test-session"
            onSessionChange={(id) => console.log("Session changed:", id)}
          />
        </div>
      </div>
    </div>
  );
}
