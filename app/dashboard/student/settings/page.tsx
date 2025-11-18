'use client';

import { Heading, Text, Card } from 'frosted-ui';
import { Settings } from 'lucide-react';

/**
 * StudentSettingsPage - Placeholder settings page
 *
 * TODO: Implement student settings:
 * - Profile management
 * - Notification preferences
 * - Learning preferences
 * - Privacy settings
 */
export default function StudentSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Heading size="8" className="mb-2">
          Settings
        </Heading>
        <Text size="4" className="text-gray-11">
          Manage your account and preferences
        </Text>
      </div>

      {/* Placeholder Content */}
      <Card size="3">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-a3 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-gray-11" />
          </div>
          <Heading size="5" className="mb-2">
            Settings Coming Soon
          </Heading>
          <Text size="3" className="text-gray-11 text-center max-w-md">
            Student settings and preferences will be available here soon.
            You'll be able to customize your learning experience.
          </Text>
        </div>
      </Card>
    </div>
  );
}
