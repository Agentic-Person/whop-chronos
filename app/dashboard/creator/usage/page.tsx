'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    ai_model: 'claude-3-5-haiku-20241022',
    auto_transcribe: true,
    default_chunk_size: 800,
    notifications_enabled: true,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-7 font-bold text-gray-12">Usage</h1>
        <p className="text-3 text-gray-11 mt-1">Monitor your API usage and billing</p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <div className="bg-gray-a2 rounded-lg p-6">
          <h2 className="text-5 font-semibold text-gray-12 mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-12 mb-2">Email</label>
              <input
                type="email"
                value="test.creator@example.com"
                disabled
                className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded-lg text-gray-12 opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-12 mb-2">Creator Name</label>
              <input
                type="text"
                defaultValue="Test Creator"
                className="w-full px-3 py-2 bg-gray-1 border border-gray-a6 rounded-lg text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
              />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-gray-a2 rounded-lg p-6">
          <h2 className="text-5 font-semibold text-gray-12 mb-4">AI Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-12 mb-2">AI Model</label>
              <select
                value={settings.ai_model}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                className="w-full px-3 py-2 bg-gray-1 border border-gray-a6 rounded-lg text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
              >
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Balanced)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-12">Auto-transcribe videos</label>
                <p className="text-xs text-gray-11 mt-1">Automatically transcribe new uploads</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_transcribe}
                  onChange={(e) => setSettings({ ...settings, auto_transcribe: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-a6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-a3 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-9"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-12 mb-2">
                Default Chunk Size (words)
              </label>
              <input
                type="number"
                value={settings.default_chunk_size}
                onChange={(e) => setSettings({ ...settings, default_chunk_size: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-1 border border-gray-a6 rounded-lg text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-9"
              />
              <p className="text-xs text-gray-11 mt-1">Optimal range: 500-1000 words</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-a2 rounded-lg p-6">
          <h2 className="text-5 font-semibold text-gray-12 mb-4">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-12">Email notifications</label>
              <p className="text-xs text-gray-11 mt-1">Receive updates about your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-a6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-a3 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-9"></div>
            </label>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-gray-a2 rounded-lg p-6">
          <h2 className="text-5 font-semibold text-gray-12 mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-12">Current Plan: Pro</p>
              <p className="text-xs text-gray-11 mt-1">Full access to all features</p>
            </div>
            <button className="px-4 py-2 border border-gray-a6 rounded-lg text-gray-12 hover:bg-gray-a3 transition-colors text-sm">
              Manage Plan
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
