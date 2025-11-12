'use client';

import { X, Video, Upload, HelpCircle, Link } from 'lucide-react';

interface AddLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'url' | 'insert' | 'upload') => void;
}

export default function AddLessonDialog({ isOpen, onClose, onSelectType }: AddLessonDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-2 border border-gray-6 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-12">New Lesson</h2>
            <p className="text-sm text-gray-11 mt-1">Select how to add content to this lesson</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-11 hover:text-gray-12 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Upload from URL Option - NEW FIRST OPTION */}
          <button
            onClick={() => onSelectType('url')}
            className="w-full flex items-start gap-4 p-4 border border-gray-6 rounded-lg hover:border-purple-7 hover:bg-gray-3 transition-all text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-purple-4 rounded-lg flex items-center justify-center group-hover:bg-purple-5 transition-colors">
              <Link className="w-5 h-5 text-purple-11" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-12 mb-1">Upload from URL</h3>
              <p className="text-sm text-gray-11">Import video from YouTube or other platforms</p>
            </div>
          </button>

          {/* Insert Video Option */}
          <button
            onClick={() => onSelectType('insert')}
            className="w-full flex items-start gap-4 p-4 border border-gray-6 rounded-lg hover:border-blue-7 hover:bg-gray-3 transition-all text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-blue-4 rounded-lg flex items-center justify-center group-hover:bg-blue-5 transition-colors">
              <Video className="w-5 h-5 text-blue-11" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-12 mb-1">Insert Video</h3>
              <p className="text-sm text-gray-11">Choose from your existing video library</p>
            </div>
          </button>

          {/* Upload Video Option */}
          <button
            onClick={() => onSelectType('upload')}
            className="w-full flex items-start gap-4 p-4 border border-gray-6 rounded-lg hover:border-green-7 hover:bg-gray-3 transition-all text-left group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-green-4 rounded-lg flex items-center justify-center group-hover:bg-green-5 transition-colors">
              <Upload className="w-5 h-5 text-green-11" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-12 mb-1">Upload Video</h3>
              <p className="text-sm text-gray-11">Upload a new video file from your computer</p>
            </div>
          </button>

          {/* Quiz Option (Coming Soon) */}
          <div className="relative">
            <div className="w-full flex items-start gap-4 p-4 border border-gray-6 rounded-lg bg-gray-2 opacity-50 cursor-not-allowed">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-4 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-gray-9" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-11">Quiz</h3>
                  <span className="px-2 py-0.5 text-xs bg-yellow-4 text-yellow-11 rounded">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-gray-10 mt-1">Add interactive quiz questions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-11 hover:text-gray-12 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
