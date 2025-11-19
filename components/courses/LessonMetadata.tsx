'use client';

import { Clock, FileText, Link as LinkIcon } from 'lucide-react';
import { Card } from 'frosted-ui';
import { cn } from '@/lib/utils';

interface LessonResource {
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'document' | 'other';
}

interface LessonMetadataProps {
  title: string;
  description: string | null;
  estimatedDuration?: number | null;
  resources?: LessonResource[];
  metadata?: any;
  className?: string;
}

/**
 * LessonMetadata - Displays lesson description, resources, and metadata
 *
 * Features:
 * - Shows lesson description
 * - Displays estimated duration
 * - Lists downloadable resources/attachments
 * - Shows lesson notes
 */
export function LessonMetadata({
  title,
  description,
  estimatedDuration,
  resources = [],
  metadata = {},
  className = '',
}: LessonMetadataProps) {
  // Extract resources from metadata if available
  const metadataResources = metadata?.resources || [];
  const allResources = [...resources, ...metadataResources];

  // Extract notes from metadata
  const notes = metadata?.notes || null;
  const learningObjectives = metadata?.learning_objectives || [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Lesson Title and Duration */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-12">{title}</h2>
        </div>
        {estimatedDuration && (
          <div className="flex items-center gap-1.5 text-sm text-gray-11 bg-gray-a3 px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4" />
            <span>{estimatedDuration} min</span>
          </div>
        )}
      </div>

      {/* Lesson Description */}
      {description && (
        <Card>
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-11" />
              <h3 className="text-sm font-semibold text-gray-12">About This Lesson</h3>
            </div>
            <p className="text-sm text-gray-11 whitespace-pre-line leading-relaxed">
              {description}
            </p>
          </div>
        </Card>
      )}

      {/* Learning Objectives */}
      {learningObjectives.length > 0 && (
        <Card>
          <div className="pt-4">
            <h3 className="text-sm font-semibold text-gray-12 mb-3">
              What You'll Learn
            </h3>
            <ul className="space-y-2">
              {learningObjectives.map((objective: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-11">
                  <span className="text-purple-9 mt-0.5">✓</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Lesson Notes */}
      {notes && (
        <Card className="bg-blue-a2 border-blue-a6">
          <div className="pt-4">
            <h3 className="text-sm font-semibold text-blue-11 mb-2">Instructor Notes</h3>
            <p className="text-sm text-blue-11 whitespace-pre-line">{notes}</p>
          </div>
        </Card>
      )}

      {/* Resources & Attachments */}
      {allResources.length > 0 && (
        <Card>
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-4 w-4 text-gray-11" />
              <h3 className="text-sm font-semibold text-gray-12">
                Resources & Downloads
              </h3>
            </div>
            <div className="space-y-2">
              {allResources.map((resource: LessonResource, index: number) => {
                const getResourceIcon = (type: string) => {
                  switch (type) {
                    case 'pdf':
                      return '📄';
                    case 'link':
                      return '🔗';
                    case 'document':
                      return '📝';
                    default:
                      return '📎';
                  }
                };

                return (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-a2 hover:bg-gray-a3 rounded-lg transition-colors group"
                  >
                    <span className="text-xl">{getResourceIcon(resource.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-12 group-hover:text-purple-9 transition-colors line-clamp-1">
                        {resource.title}
                      </p>
                      <p className="text-xs text-gray-11 capitalize">{resource.type}</p>
                    </div>
                    <svg
                      className="h-4 w-4 text-gray-a9 group-hover:text-purple-9 transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
