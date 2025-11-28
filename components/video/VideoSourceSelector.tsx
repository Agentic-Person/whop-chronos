'use client';

import { X, Youtube, Link as LinkIcon, Upload, Zap } from 'lucide-react';
import YouTubeTab from './source-tabs/YouTubeTab';
import LoomTab from './source-tabs/LoomTab';
import WhopTab from './source-tabs/WhopTab';
import UploadTab from './source-tabs/UploadTab';
import ImportProgress from './ImportProgress';
import { useVideoImport } from '@/hooks/useVideoImport';

export type SourceType = 'youtube' | 'loom' | 'whop' | 'upload';

export interface Video {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  source_type?: string;
}

interface VideoSourceSelectorProps {
  creatorId: string;
  isOpen: boolean;
  onClose: () => void;
  onVideoImported?: (video: Video) => void;
  onError?: (error: Error) => void;
  defaultTab?: SourceType;
  showPreview?: boolean;
  className?: string;
}

export default function VideoSourceSelector({
  creatorId,
  isOpen,
  onClose,
  onVideoImported,
  onError,
  defaultTab = 'youtube',
  showPreview = true,
  className = '',
}: VideoSourceSelectorProps) {
  const {
    activeTab,
    setActiveTab,
    importing,
    progress,
    currentStep,
    error,
    importVideo,
    cancelImport,
    clearError,
  } = useVideoImport({
    creatorId,
    defaultTab,
    onSuccess: (video) => {
      if (onVideoImported) {
        onVideoImported(video);
      }
    },
    onError: (err) => {
      if (onError) {
        onError(err);
      }
    },
  });

  const handleTabChange = (tab: SourceType) => {
    if (!importing) {
      setActiveTab(tab);
    }
  };

  const handleImport = async (sourceType: SourceType, data: any) => {
    try {
      await importVideo(sourceType, data);
    } catch (err) {
      console.error('Import error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={importing ? undefined : onClose}
      />

      {/* Modal */}
      <div className={`relative bg-gray-2 border border-gray-6 rounded-lg shadow-xl w-full max-w-3xl ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-4 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-11" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-12">Import Video</h2>
              <p className="text-sm text-gray-11 mt-0.5">
                Choose your video source and start importing
              </p>
            </div>
          </div>
          {!importing && (
            <button
              onClick={onClose}
              className="text-gray-11 hover:text-gray-12 transition-colors"
              aria-label="Close video import dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-4 bg-gray-3 border-b border-gray-6" role="tablist">
          <button
            onClick={() => handleTabChange('youtube')}
            disabled={importing}
            role="tab"
            aria-selected={activeTab === 'youtube'}
            aria-controls="youtube-panel"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'youtube'
                ? 'bg-gray-12 text-gray-1'
                : 'text-gray-11 hover:text-gray-12 hover:bg-gray-4'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Youtube className="w-4 h-4" aria-hidden="true" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => handleTabChange('loom')}
            disabled={importing}
            role="tab"
            aria-selected={activeTab === 'loom'}
            aria-controls="loom-panel"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'loom'
                ? 'bg-gray-12 text-gray-1'
                : 'text-gray-11 hover:text-gray-12 hover:bg-gray-4'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <LinkIcon className="w-4 h-4" aria-hidden="true" />
            <span>Loom</span>
          </button>

          <button
            onClick={() => handleTabChange('whop')}
            disabled={importing}
            role="tab"
            aria-selected={activeTab === 'whop'}
            aria-controls="whop-panel"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'whop'
                ? 'bg-gray-12 text-gray-1'
                : 'text-gray-11 hover:text-gray-12 hover:bg-gray-4'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span>Whop</span>
          </button>

          <button
            onClick={() => handleTabChange('upload')}
            disabled={importing}
            role="tab"
            aria-selected={activeTab === 'upload'}
            aria-controls="upload-panel"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-gray-12 text-gray-1'
                : 'text-gray-11 hover:text-gray-12 hover:bg-gray-4'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-3 border border-red-6 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-11">Import Error</p>
                <p className="text-sm text-red-11 mt-1">{error.message}</p>
                <button
                  onClick={clearError}
                  className="text-sm text-red-11 underline mt-2 hover:text-red-12"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <ImportProgress
              progress={progress}
              currentStep={currentStep}
              onCancel={cancelImport}
            />
          )}

          {/* Tab Panels */}
          {!importing && (
            <>
              {activeTab === 'youtube' && (
                <div role="tabpanel" id="youtube-panel" aria-labelledby="youtube-tab">
                  <YouTubeTab
                    creatorId={creatorId}
                    onImport={(data) => handleImport('youtube', data)}
                    showPreview={showPreview}
                  />
                </div>
              )}

              {activeTab === 'loom' && (
                <div role="tabpanel" id="loom-panel" aria-labelledby="loom-tab">
                  <LoomTab
                    creatorId={creatorId}
                    onImport={(data) => handleImport('loom', data)}
                    showPreview={showPreview}
                  />
                </div>
              )}

              {activeTab === 'whop' && (
                <div role="tabpanel" id="whop-panel" aria-labelledby="whop-tab">
                  <WhopTab
                    creatorId={creatorId}
                    onImport={(data) => handleImport('whop', data)}
                    showPreview={showPreview}
                  />
                </div>
              )}

              {activeTab === 'upload' && (
                <div role="tabpanel" id="upload-panel" aria-labelledby="upload-tab">
                  <UploadTab
                    creatorId={creatorId}
                    onImport={(data) => handleImport('upload', data)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-6">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-gray-11 hover:text-gray-12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Processing...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
