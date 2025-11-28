'use client';

import { useState, useEffect } from 'react';
import type { QuestionCluster } from './chat-types';

interface PopularQuestionsTableProps {
  creatorId: string;
  topN?: number;
}

export function PopularQuestionsTable({
  creatorId,
  topN = 20,
}: PopularQuestionsTableProps) {
  const [questions, setQuestions] = useState<QuestionCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat/popular-questions?creatorId=${creatorId}&limit=${topN}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch popular questions');
        }

        const result = await response.json();
        setQuestions(result.questions || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorId, topN]);

  const handleExportCSV = () => {
    const headers = ['Question', 'Count', 'Avg Response Time', 'Videos Referenced'];
    const rows = filteredQuestions.map((q) => [
      q.representative,
      q.count.toString(),
      `${q.avgResponseTime.toFixed(2)}s`,
      q.referencedVideos.join('; '),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `popular-questions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredQuestions = questions.filter((q) =>
    q.representative.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading popular questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Most Popular Questions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Questions grouped by similarity to identify content gaps
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={questions.length === 0}
          aria-label="Export popular questions to CSV file"
        >
          Export CSV
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search questions by keyword"
        />
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? 'No matching questions found' : 'No questions data available'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left"
            role="table"
            aria-label="Most popular questions from students"
          >
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr role="row">
                <th className="px-6 py-3" role="columnheader" scope="col">Question</th>
                <th className="px-6 py-3 text-center" role="columnheader" scope="col">Count</th>
                <th className="px-6 py-3 text-center" role="columnheader" scope="col">Avg Response Time</th>
                <th className="px-6 py-3 text-center" role="columnheader" scope="col">Videos</th>
                <th className="px-6 py-3 text-center" role="columnheader" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question, index) => (
                <tr
                  key={index}
                  role="row"
                  className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4" role="cell">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {question.representative}
                    </div>
                    {expandedIndex === index && question.variations.length > 1 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Variations:
                        </div>
                        {question.variations.slice(1).map((variation, i) => (
                          <div
                            key={i}
                            className="text-sm text-gray-600 dark:text-gray-400 pl-4"
                          >
                            • {variation}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center" role="cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {question.count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white" role="cell">
                    {question.avgResponseTime.toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white" role="cell">
                    {question.referencedVideos.length}
                  </td>
                  <td className="px-6 py-4 text-center" role="cell">
                    {question.variations.length > 1 && (
                      <button
                        onClick={() =>
                          setExpandedIndex(expandedIndex === index ? null : index)
                        }
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        aria-label={`${expandedIndex === index ? 'Hide' : 'Show'} variations for question: ${question.representative}`}
                        aria-expanded={expandedIndex === index}
                      >
                        {expandedIndex === index ? 'Hide' : 'Show'} variations
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Showing {filteredQuestions.length} of {questions.length} question clusters
      </div>
    </div>
  );
}
