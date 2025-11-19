'use client';

import { Modal } from '@/components/ui/Modal';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  key: string;
  description: string;
  category?: 'playback' | 'navigation' | 'volume' | 'other';
}

/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays available keyboard shortcuts for video player.
 * Accessible and categorized for easy reference.
 *
 * WCAG 2.1 Compliance:
 * - Clear labels and descriptions
 * - High contrast text
 * - Semantic HTML structure
 * - Screen reader accessible
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts: Shortcut[] = [
    // Playback controls
    { key: 'Space', description: 'Play/Pause', category: 'playback' },
    { key: 'K', description: 'Play/Pause (alternative)', category: 'playback' },

    // Navigation
    { key: '←', description: 'Seek backward 5 seconds', category: 'navigation' },
    { key: '→', description: 'Seek forward 5 seconds', category: 'navigation' },
    { key: 'J', description: 'Seek backward 10 seconds', category: 'navigation' },
    { key: 'L', description: 'Seek forward 10 seconds', category: 'navigation' },
    { key: '0-9', description: 'Seek to 0-90% of video', category: 'navigation' },
    { key: 'Home', description: 'Jump to beginning', category: 'navigation' },
    { key: 'End', description: 'Jump to end', category: 'navigation' },

    // Volume
    { key: '↑', description: 'Increase volume', category: 'volume' },
    { key: '↓', description: 'Decrease volume', category: 'volume' },
    { key: 'M', description: 'Mute/Unmute', category: 'volume' },

    // Other
    { key: 'F', description: 'Toggle fullscreen', category: 'other' },
    { key: 'C', description: 'Toggle captions (if available)', category: 'other' },
    { key: '?', description: 'Show this help', category: 'other' },
    { key: 'Esc', description: 'Exit fullscreen', category: 'other' },
  ];

  const categories = {
    playback: 'Playback Controls',
    navigation: 'Navigation',
    volume: 'Volume',
    other: 'Other',
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
    >
      <div className="space-y-6">
        {/* Info message */}
        <div className="flex items-start gap-3 p-4 bg-blue-2 border border-blue-6 rounded-lg">
          <Keyboard className="w-5 h-5 text-blue-11 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-12">
            Use these keyboard shortcuts to control video playback without using your mouse.
            Perfect for efficient learning!
          </p>
        </div>

        {/* Shortcuts by category */}
        {Object.entries(groupedShortcuts).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-12 mb-3">
              {categories[category as keyof typeof categories]}
            </h3>
            <table className="w-full">
              <thead className="sr-only">
                <tr>
                  <th>Key</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-6">
                {items.map(({ key, description }) => (
                  <tr key={key} className="group">
                    <td className="py-3 pr-4">
                      <kbd
                        className={`
                          inline-flex items-center justify-center
                          min-w-[2.5rem] px-2 py-1.5
                          font-mono text-sm font-semibold
                          bg-gray-3 border border-gray-7 rounded
                          text-gray-12
                          shadow-sm
                          group-hover:bg-gray-4 group-hover:border-gray-8
                          transition-colors
                        `}
                      >
                        {key}
                      </kbd>
                    </td>
                    <td className="py-3 text-gray-11 group-hover:text-gray-12 transition-colors">
                      {description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Tips section */}
        <div className="p-4 bg-gray-3 border border-gray-6 rounded-lg">
          <h4 className="font-semibold text-gray-12 mb-2">Pro Tips</h4>
          <ul className="space-y-1.5 text-sm text-gray-11">
            <li>• Press <kbd className="px-1.5 py-0.5 bg-gray-4 border border-gray-7 rounded font-mono text-xs">?</kbd> anytime to show this help</li>
            <li>• Number keys let you jump to any part of the video instantly</li>
            <li>• Most shortcuts work even when the player is not focused</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
