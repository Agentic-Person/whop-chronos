'use client';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-7 font-bold text-gray-12">AI Chat Sessions</h1>
        <p className="text-3 text-gray-11 mt-1">View student chat history and AI interactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-a2 rounded-lg p-4">
            <h3 className="font-semibold text-gray-12 mb-4">Recent Sessions</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-a3 rounded-lg cursor-pointer hover:bg-gray-a4 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-12">Test Student</span>
                  <span className="text-xs text-gray-11">2h ago</span>
                </div>
                <p className="text-xs text-gray-11 truncate">Questions about Risk Management</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="border border-gray-a4 rounded-lg h-[600px] flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-11"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-4 text-4 font-semibold text-gray-12">Select a session</h3>
              <p className="mt-2 text-3 text-gray-11">Choose a chat session to view conversation history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
