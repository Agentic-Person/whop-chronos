'use client';

import { useState } from 'react';
import { Upload, FileVideo, X, AlertCircle } from 'lucide-react';

interface UploadTabProps {
  creatorId: string;
  onImport: (data: { file: File }) => void;
}

export default function UploadTab({
  creatorId,
  onImport,
}: UploadTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const ALLOWED_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
  ];

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload MP4, WebM, MOV, or AVI files.');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 2GB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    onImport({ file: selectedFile });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-3 border border-red-6 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-11 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-11">{error}</p>
        </div>
      )}

      {/* File Drop Zone */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-purple-7 bg-purple-3'
              : 'border-gray-6 hover:border-gray-7'
          }`}
        >
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-4 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-11" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-12 mb-1">
                Drop video file here or click to browse
              </p>
              <p className="text-xs text-gray-11">
                MP4, WebM, MOV, or AVI up to 2GB
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Display */
        <div className="border border-gray-6 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-purple-4 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileVideo className="w-6 h-6 text-purple-11" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-12 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-11 mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            <button
              onClick={handleRemoveFile}
              className="text-gray-11 hover:text-gray-12 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleUpload}
            className="w-full mt-4 px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Video
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-3 border border-blue-6 rounded-lg space-y-2">
        <p className="text-xs text-blue-11">
          <strong>How it works:</strong>
        </p>
        <ul className="text-xs text-blue-11 space-y-1 list-disc list-inside">
          <li>Upload your video file (max 2GB)</li>
          <li>We'll store it securely in Supabase</li>
          <li>Transcription via OpenAI Whisper (2-10 minutes)</li>
          <li>Automatic chunking and embedding for AI chat</li>
        </ul>
      </div>

      {/* File Format Info */}
      <div className="p-4 bg-gray-3 border border-gray-6 rounded-lg">
        <p className="text-xs font-medium text-gray-12 mb-2">Supported formats:</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gray-4 text-gray-11 rounded text-xs">.mp4</span>
          <span className="px-2 py-1 bg-gray-4 text-gray-11 rounded text-xs">.webm</span>
          <span className="px-2 py-1 bg-gray-4 text-gray-11 rounded text-xs">.mov</span>
          <span className="px-2 py-1 bg-gray-4 text-gray-11 rounded text-xs">.avi</span>
        </div>
      </div>
    </div>
  );
}
