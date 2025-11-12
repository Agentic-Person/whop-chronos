'use client';

import { useState, useEffect } from 'react';
import { Loader, Zap, CheckCircle, Search } from 'lucide-react';
import VideoPreviewCard from '../VideoPreviewCard';

interface WhopTabProps {
  creatorId: string;
  onImport: (data: { lessonId: string } | { lessonIds: string[] }) => void;
  showPreview?: boolean;
}

type ImportMode = 'url' | 'browse';

interface WhopProduct {
  id: string;
  name: string;
  visibility?: string;
}

interface WhopLesson {
  id: string;
  title: string;
  content?: string;
  muxAssetId?: string;
  embedType?: string;
  embedId?: string;
}

export default function WhopTab({
  creatorId,
  onImport,
  showPreview = true,
}: WhopTabProps) {
  const [mode, setMode] = useState<ImportMode>('url');
  const [lessonId, setLessonId] = useState('');
  const [products, setProducts] = useState<WhopProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [lessons, setLessons] = useState<WhopLesson[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products when switching to browse mode
  useEffect(() => {
    if (mode === 'browse' && products.length === 0) {
      loadProducts();
    }
  }, [mode]);

  // Load lessons when product is selected
  useEffect(() => {
    if (selectedProductId) {
      loadLessons(selectedProductId);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError(null);

    try {
      // Use Whop MCP server to list products
      const response = await fetch('/api/whop/products', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadLessons = async (productId: string) => {
    setLoadingLessons(true);
    setError(null);
    setLessons([]);
    setSelectedLessonIds(new Set());

    try {
      const response = await fetch(`/api/whop/products/${productId}/lessons`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to load lessons');
      }

      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (err) {
      console.error('Failed to load lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lessons');
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleImportByUrl = () => {
    if (!lessonId.trim()) {
      setError('Please enter a Whop lesson ID');
      return;
    }

    onImport({ lessonId: lessonId.trim() });
  };

  const handleImportSelected = () => {
    if (selectedLessonIds.size === 0) {
      setError('Please select at least one lesson');
      return;
    }

    onImport({ lessonIds: Array.from(selectedLessonIds) });
  };

  const toggleLessonSelection = (id: string) => {
    const newSelection = new Set(selectedLessonIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLessonIds(newSelection);
  };

  const selectAll = () => {
    setSelectedLessonIds(new Set(lessons.map(l => l.id)));
  };

  const deselectAll = () => {
    setSelectedLessonIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-3 rounded-lg">
        <button
          onClick={() => setMode('url')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'url'
              ? 'bg-gray-12 text-gray-1'
              : 'text-gray-11 hover:text-gray-12'
          }`}
        >
          Import by URL
        </button>
        <button
          onClick={() => setMode('browse')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'browse'
              ? 'bg-gray-12 text-gray-1'
              : 'text-gray-11 hover:text-gray-12'
          }`}
        >
          Browse Products
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-3 border border-red-6 rounded-lg">
          <p className="text-sm text-red-11">{error}</p>
        </div>
      )}

      {/* URL Import Mode */}
      {mode === 'url' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-12">
              Whop Lesson ID <span className="text-red-11">*</span>
            </label>
            <input
              type="text"
              value={lessonId}
              onChange={(e) => {
                setLessonId(e.target.value);
                setError(null);
              }}
              placeholder="les_xxxxxxxxxx"
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-7 focus:border-transparent"
            />
            <p className="text-xs text-gray-11">
              Enter the Whop lesson ID to import its video content
            </p>
          </div>

          <button
            onClick={handleImportByUrl}
            disabled={!lessonId.trim()}
            className="w-full px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Import Whop Lesson
          </button>

          <div className="p-4 bg-blue-3 border border-blue-6 rounded-lg">
            <p className="text-xs text-blue-11">
              <strong>Supported:</strong> Mux videos (immediate), YouTube embeds (2-5 min processing),
              and Loom embeds (2-5 min processing).
            </p>
          </div>
        </div>
      )}

      {/* Browse Mode */}
      {mode === 'browse' && (
        <div className="space-y-4">
          {/* Product Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-12">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={loadingProducts}
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 focus:outline-none focus:ring-2 focus:ring-purple-7 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lessons List */}
          {selectedProductId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-12">
                  Videos ({lessons.length})
                </p>
                {lessons.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-blue-11 hover:text-blue-12"
                    >
                      Select All
                    </button>
                    <span className="text-gray-10">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-xs text-blue-11 hover:text-blue-12"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>

              {loadingLessons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-gray-11 animate-spin" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-11">
                  <p className="text-sm">No lessons found in this product</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-6 rounded-lg p-2">
                  {lessons.map((lesson) => (
                    <label
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-3 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLessonIds.has(lesson.id)}
                        onChange={() => toggleLessonSelection(lesson.id)}
                        className="w-4 h-4 text-purple-9 border-gray-6 rounded focus:ring-purple-7"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-12">
                          {lesson.title}
                        </p>
                        {lesson.embedType && (
                          <p className="text-xs text-gray-11">
                            Type: {lesson.embedType}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedLessonIds.size > 0 && (
                <button
                  onClick={handleImportSelected}
                  className="w-full px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Import {selectedLessonIds.size} Selected Video{selectedLessonIds.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
