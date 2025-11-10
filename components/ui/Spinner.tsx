import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-purple-600",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Loading...",
  size = "md",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Spinner size={size} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
