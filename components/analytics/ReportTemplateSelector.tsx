'use client';

import { useState } from 'react';
import type { TemplateType } from '@/lib/reports/types';
import { TEMPLATES } from '@/lib/reports/templates';

interface ReportTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateType) => void;
}

export function ReportTemplateSelector({
  isOpen,
  onClose,
  onSelect,
}: ReportTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('executive');
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const availableSections = [
    { id: 'summary', label: 'Executive Summary', icon: '📊' },
    { id: 'videos', label: 'Video Performance', icon: '🎥' },
    { id: 'students', label: 'Student Engagement', icon: '👥' },
    { id: 'charts', label: 'Trend Charts', icon: '📈' },
    { id: 'tables', label: 'Detailed Tables', icon: '📋' },
    { id: 'insights', label: 'AI Insights', icon: '🤖' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate generation
      onSelect(selectedTemplate);
      onClose();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Select Report Template</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Template Grid */}
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(TEMPLATES) as TemplateType[]).map((templateKey) => {
              const template = TEMPLATES[templateKey];
              if (!template) return null;

              return (
                <button
                  key={templateKey}
                  onClick={() => setSelectedTemplate(templateKey)}
                  className={`p-6 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === templateKey
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {selectedTemplate === templateKey && (
                      <svg
                        className="w-6 h-6 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {template.sections.length} sections
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {template.layout}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Section Selector */}
          {selectedTemplate === 'custom' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Report Sections
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {availableSections.map((section) => (
                  <label
                    key={section.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      customSections.includes(section.id)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={customSections.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCustomSections([...customSections, section.id]);
                        } else {
                          setCustomSections(customSections.filter((s) => s !== section.id));
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-2xl">{section.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{section.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Report Preview</h4>
            <div className="space-y-2">
              {selectedTemplate === 'custom' ? (
                customSections.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {customSections.map((sectionId) => {
                      const section = availableSections.find((s) => s.id === sectionId);
                      return (
                        <li key={sectionId} className="flex items-center">
                          <span className="mr-2">{section?.icon}</span>
                          {section?.label}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Select sections to include in your custom report
                  </p>
                )
              ) : (
                <ul className="text-sm text-gray-600 space-y-1">
                  {TEMPLATES[selectedTemplate]?.sections.map((section, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2">
                        {section.type === 'header' && '📄'}
                        {section.type === 'summary' && '📊'}
                        {section.type === 'chart' && '📈'}
                        {section.type === 'table' && '📋'}
                        {section.type === 'text' && '📝'}
                      </span>
                      {section.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedTemplate === 'custom' && customSections.length === 0
              ? 'Please select at least one section'
              : 'Ready to generate report'}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                (selectedTemplate === 'custom' && customSections.length === 0)
              }
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
