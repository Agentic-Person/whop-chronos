'use client';

import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (course: any) => void;
}

export default function CreateCourseModal({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a course name');
      return;
    }

    const newCourse = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      coverImage: coverImage || '',
      aspectRatio,
      chapters: 1, // Start with 1 chapter
      lessons: 0,
      lastEdited: new Date().toISOString(),
    };

    onCourseCreated(newCourse);

    // Reset form
    setName('');
    setDescription('');
    setAspectRatio('16:9');
    setCoverImage(null);
    setCoverImageFile(null);
    onClose();
  };

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
          <h2 className="text-xl font-semibold text-gray-12">Create course module</h2>
          <button
            onClick={onClose}
            className="text-gray-11 hover:text-gray-12 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              maxLength={100}
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8 resize-none"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-3">
              Cover Image Aspect Ratio
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="16:9"
                  checked={aspectRatio === '16:9'}
                  onChange={() => setAspectRatio('16:9')}
                  className="w-4 h-4 text-blue-9 border-gray-6 focus:ring-blue-8"
                />
                <span className="text-sm text-gray-12">16:9 (Landscape)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="9:16"
                  checked={aspectRatio === '9:16'}
                  onChange={() => setAspectRatio('9:16')}
                  className="w-4 h-4 text-blue-9 border-gray-6 focus:ring-blue-8"
                />
                <span className="text-sm text-gray-12">9:16 (Portrait)</span>
              </label>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">
              Cover
            </label>

            {coverImage ? (
              <div className="space-y-2">
                <div
                  className={`relative rounded-lg overflow-hidden bg-gray-3 ${
                    aspectRatio === '16:9' ? 'aspect-video' : 'aspect-video flex items-center justify-center'
                  }`}
                >
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className={`${
                      aspectRatio === '9:16'
                        ? 'h-full w-auto object-contain'
                        : 'w-full h-full object-cover'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-11">1500 x 840 px</p>
                <button
                  onClick={() => {
                    setCoverImage(null);
                    setCoverImageFile(null);
                  }}
                  className="text-sm text-blue-11 hover:text-blue-12"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-gray-6 rounded-lg p-8 text-center cursor-pointer hover:border-blue-7 transition-colors">
                  <ImageIcon className="w-8 h-8 text-gray-9 mx-auto mb-2" />
                  <p className="text-sm text-gray-11 mb-1">Click to upload cover image</p>
                  <p className="text-xs text-gray-10">JPG, PNG, WebP (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
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
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-lg transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
