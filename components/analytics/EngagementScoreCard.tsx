'use client';

/**
 * Engagement Score Card Component
 * Displays composite engagement score (0-100) with breakdown
 * Weighted average of video completion, chat interaction, login frequency, and course progress
 */

import { useEffect, useState } from 'react';
import type { EngagementScore } from './engagement-types';

interface EngagementScoreCardProps {
  creatorId: string;
  studentId?: string;
  score?: EngagementScore;
  isLoading?: boolean;
}

export default function EngagementScoreCard({
  creatorId: _creatorId,
  studentId,
  score,
  isLoading = false,
}: EngagementScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on load
  useEffect(() => {
    if (!score) return;

    const duration = 1000; // 1 second
    const steps = 50;
    const increment = score.total / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score.total) {
        setAnimatedScore(score.total);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Get score color and label
  const getScoreInfo = (totalScore: number) => {
    if (totalScore >= 80)
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-500',
        label: 'Excellent',
        ringColor: 'stroke-green-500',
      };
    if (totalScore >= 60)
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500',
        label: 'Good',
        ringColor: 'stroke-blue-500',
      };
    if (totalScore >= 40)
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-500',
        label: 'Fair',
        ringColor: 'stroke-yellow-500',
      };
    if (totalScore >= 20)
      return {
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-500',
        label: 'Low',
        ringColor: 'stroke-orange-500',
      };
    return {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500',
      label: 'Very Low',
      ringColor: 'stroke-red-500',
    };
  };

  const scoreInfo = score ? getScoreInfo(score.total) : getScoreInfo(0);

  // Calculate circumference for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Engagement Score
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {studentId ? 'Individual student score' : 'Average score across all students'}
        </p>
      </div>

      {/* Circular Score Display */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
              className="dark:stroke-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${scoreInfo.ringColor} transition-all duration-1000`}
            />
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold ${scoreInfo.color}`}>
              {animatedScore}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              out of 100
            </div>
            <div
              className={`text-sm font-semibold mt-2 px-3 py-1 rounded-full ${scoreInfo.color}`}
            >
              {scoreInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {score && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Score Breakdown
          </h4>

          {/* Video Completion (30%) */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">
                Video Completion
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">30%</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {score.breakdown.videoCompletion}/30
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(score.breakdown.videoCompletion / 30) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Chat Interaction (25%) */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">
                Chat Interaction
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">25%</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {score.breakdown.chatInteraction}/25
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(score.breakdown.chatInteraction / 25) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Course Progress (25%) */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">
                Course Progress
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">25%</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {score.breakdown.courseProgress}/25
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(score.breakdown.courseProgress / 25) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Login Frequency (20%) */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">
                Login Frequency
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">20%</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {score.breakdown.loginFrequency}/20
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(score.breakdown.loginFrequency / 20) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {score && score.total < 80 && (
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Improvement Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            {score.breakdown.videoCompletion < 24 && (
              <li>• Encourage students to complete more videos</li>
            )}
            {score.breakdown.chatInteraction < 20 && (
              <li>• Promote AI chat usage for better learning outcomes</li>
            )}
            {score.breakdown.courseProgress < 20 && (
              <li>• Add more engaging course milestones</li>
            )}
            {score.breakdown.loginFrequency < 16 && (
              <li>• Send reminders to keep students returning regularly</li>
            )}
          </ul>
        </div>
      )}

      {/* Empty State */}
      {!score && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No engagement data available
          </p>
        </div>
      )}
    </div>
  );
}
