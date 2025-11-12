'use client';

import { Loader, CheckCircle, Clock, Zap, X } from 'lucide-react';

interface ImportProgressProps {
  progress: number; // 0-100
  currentStep: string;
  onCancel?: () => void;
}

interface ProcessingStep {
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
  icon: React.ComponentType<{ className?: string }>;
}

export default function ImportProgress({
  progress,
  currentStep,
  onCancel,
}: ImportProgressProps) {
  // Determine processing steps based on current step
  const steps: ProcessingStep[] = [
    {
      label: 'Fetching metadata',
      status: progress > 0 ? 'completed' : progress === 0 ? 'in_progress' : 'pending',
      icon: Clock,
    },
    {
      label: 'Extracting transcript',
      status: progress > 25 ? 'completed' : currentStep.includes('transcript') ? 'in_progress' : 'pending',
      icon: Zap,
    },
    {
      label: 'Chunking content',
      status: progress > 50 ? 'completed' : currentStep.includes('chunk') ? 'in_progress' : 'pending',
      icon: Zap,
    },
    {
      label: 'Generating embeddings',
      status: progress > 75 ? 'completed' : currentStep.includes('embedding') ? 'in_progress' : 'pending',
      icon: Zap,
    },
    {
      label: 'Finalizing',
      status: progress === 100 ? 'completed' : progress > 90 ? 'in_progress' : 'pending',
      icon: CheckCircle,
    },
  ];

  const getEstimatedTime = (): string => {
    if (progress < 25) return '3-5 minutes remaining';
    if (progress < 50) return '2-3 minutes remaining';
    if (progress < 75) return '1-2 minutes remaining';
    if (progress < 100) return 'Less than 1 minute';
    return 'Complete!';
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-12">Importing video...</p>
          <p className="text-xs text-gray-11 mt-1">{currentStep}</p>
        </div>
        {onCancel && progress < 100 && (
          <button
            onClick={onCancel}
            className="text-gray-11 hover:text-gray-12 transition-colors"
            title="Cancel import"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-12">{Math.round(progress)}%</span>
          <span className="text-gray-11">{getEstimatedTime()}</span>
        </div>
        <div className="h-2 bg-gray-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-9 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              step.status === 'completed'
                ? 'bg-green-3'
                : step.status === 'in_progress'
                ? 'bg-blue-3'
                : 'bg-gray-3'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {step.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-11" />
              ) : step.status === 'in_progress' ? (
                <Loader className="w-5 h-5 text-blue-11 animate-spin" />
              ) : (
                <step.icon className="w-5 h-5 text-gray-9" />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm ${
                step.status === 'completed'
                  ? 'text-green-11 font-medium'
                  : step.status === 'in_progress'
                  ? 'text-blue-11 font-medium'
                  : 'text-gray-11'
              }`}
            >
              {step.label}
            </span>

            {/* Status Badge */}
            {step.status === 'in_progress' && (
              <span className="ml-auto text-xs text-blue-11">In progress...</span>
            )}
            {step.status === 'completed' && (
              <span className="ml-auto text-xs text-green-11">Done</span>
            )}
          </div>
        ))}
      </div>

      {/* Info Message */}
      <div className="p-3 bg-blue-3 border border-blue-6 rounded-lg">
        <p className="text-xs text-blue-11">
          Please keep this window open. The import will complete in the background,
          and you'll be notified when it's ready.
        </p>
      </div>
    </div>
  );
}
