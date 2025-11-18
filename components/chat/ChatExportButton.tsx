"use client";

import { useState } from "react";
import { Download, FileText, FileJson, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatExportButtonProps {
  sessionId: string;
  sessionTitle: string;
}

/**
 * ChatExportButton
 *
 * Export chat conversation to PDF or Markdown format
 */
export function ChatExportButton({ sessionId, sessionTitle }: ChatExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: "json" | "markdown") => {
    if (isExporting) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(`/api/chat/export/${sessionId}?format=${format}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const sanitizedTitle = sessionTitle
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()
        .slice(0, 50);
      const extension = format === "json" ? "json" : "md";
      a.download = `chat-${sanitizedTitle}-${timestamp}.${extension}`;

      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success (you could use a toast notification here)
      console.log("Export successful");
      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      setExportError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      {/* Export button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:border-purple-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-purple-500 ring-2 ring-purple-500/20"
        )}
        aria-label="Export conversation"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <Download className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-gray-900">Export</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2">
              {/* Export as JSON */}
              <button
                onClick={() => handleExport("json")}
                disabled={isExporting}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileJson className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Export as JSON</div>
                  <div className="text-xs text-gray-500">
                    Structured data format
                  </div>
                </div>
              </button>

              {/* Export as Markdown */}
              <button
                onClick={() => handleExport("markdown")}
                disabled={isExporting}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Export as Markdown</div>
                  <div className="text-xs text-gray-500">
                    Human-readable format
                  </div>
                </div>
              </button>
            </div>

            {/* Error message */}
            {exportError && (
              <div className="border-t border-gray-200 p-2">
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {exportError}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
