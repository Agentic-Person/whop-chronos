'use client';

import { useEffect } from 'react';
import { X, Download, Share2, ArrowRight, Trophy } from 'lucide-react';
import { Button, Card } from 'frosted-ui';
import confetti from 'canvas-confetti';

interface CompletionModalProps {
  courseTitle: string;
  courseThumbnail?: string;
  completionDate?: Date;
  onDownloadCertificate: () => void;
  onShareAchievement: () => void;
  onStartNextCourse?: () => void;
  onClose: () => void;
}

/**
 * CompletionModal - Celebration modal when student completes all course lessons
 *
 * Features:
 * - Confetti animation on mount
 * - Course completion details
 * - Download certificate action
 * - Share achievement action
 * - Next course recommendation
 */
export function CompletionModal({
  courseTitle,
  courseThumbnail,
  completionDate = new Date(),
  onDownloadCertificate,
  onShareAchievement,
  onStartNextCourse,
  onClose,
}: CompletionModalProps) {
  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const runConfetti = () => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from both sides
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
        colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff', '#fbbf24'],
      });
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff', '#fbbf24'],
      });

      requestAnimationFrame(runConfetti);
    };

    runConfetti();
  }, []);

  const handleShare = () => {
    onShareAchievement();
    // Copy link to clipboard
    const shareText = `I just completed "${courseTitle}" on Chronos! 🎉`;
    navigator.clipboard.writeText(shareText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-a3 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-11" />
        </button>

        {/* Content */}
        <div className="text-center p-8">
          {/* Trophy icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-9 to-purple-10 rounded-full mb-6">
            <Trophy className="h-10 w-10 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-gray-12 mb-2">
            Congratulations! 🎉
          </h2>
          <p className="text-lg text-gray-11 mb-8">
            You completed <span className="font-semibold text-purple-11">{courseTitle}</span>
          </p>

          {/* Course thumbnail (if available) */}
          {courseThumbnail && (
            <div className="mb-8">
              <img
                src={courseThumbnail}
                alt={courseTitle}
                className="w-full h-48 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Completion stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-a3 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-11">100%</div>
              <div className="text-sm text-gray-11">Completion</div>
            </div>
            <div className="bg-purple-a3 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-11">
                {completionDate.toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-11">Completed On</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onDownloadCertificate}
              variant="primary"
              size="lg"
              icon={<Download className="h-5 w-5" />}
              iconPosition="left"
              className="w-full"
            >
              Download Certificate
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              icon={<Share2 className="h-5 w-5" />}
              iconPosition="left"
              className="w-full"
            >
              Share Achievement
            </Button>

            {onStartNextCourse && (
              <Button
                onClick={onStartNextCourse}
                variant="ghost"
                size="lg"
                icon={<ArrowRight className="h-5 w-5" />}
                iconPosition="right"
                className="w-full"
              >
                Start Next Course
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
