'use client';

import { X, Keyboard } from 'lucide-react';
import { Card } from 'frosted-ui';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  {
    keys: ['←'],
    description: 'Previous lesson',
    category: 'Navigation',
  },
  {
    keys: ['→'],
    description: 'Next lesson',
    category: 'Navigation',
  },
  {
    keys: ['Esc'],
    description: 'Close modals/dialogs',
    category: 'Navigation',
  },

  // Video Controls
  {
    keys: ['Space'],
    description: 'Play/pause video',
    category: 'Video Controls',
  },
  {
    keys: ['F'],
    description: 'Fullscreen mode',
    category: 'Video Controls',
  },
  {
    keys: ['M'],
    description: 'Mute/unmute',
    category: 'Video Controls',
  },

  // Interface
  {
    keys: ['C'],
    description: 'Toggle chat panel',
    category: 'Interface',
  },
  {
    keys: ['?'],
    description: 'Show keyboard shortcuts',
    category: 'Interface',
  },
];

/**
 * KeyboardShortcutsHelp - Modal displaying available keyboard shortcuts
 */
export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce<Record<string, Shortcut[]>>(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category]?.push(shortcut);
      return acc;
    },
    {}
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-a4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-a3 rounded-lg">
              <Keyboard className="h-5 w-5 text-purple-11" />
            </div>
            <h2 className="text-xl font-semibold text-gray-12">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-a3 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-11" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-11 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-a2 transition-colors"
                  >
                    <span className="text-sm text-gray-12">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2.5 py-1 text-sm font-semibold text-gray-12 bg-gray-a3 border border-gray-a6 rounded-lg shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-a4 bg-gray-a2">
          <p className="text-sm text-gray-11 text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-12 bg-gray-a3 border border-gray-a6 rounded">?</kbd> anytime to view shortcuts
          </p>
        </div>
      </Card>
    </div>
  );
}
