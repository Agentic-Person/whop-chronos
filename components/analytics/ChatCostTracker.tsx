'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { CostBreakdown, TimeRange } from './chat-types';

interface ChatCostTrackerProps {
  creatorId: string;
  timeRange?: TimeRange;
  budgetThreshold?: number; // Monthly budget in USD
}

export function ChatCostTracker({
  creatorId,
  timeRange = '30d',
  budgetThreshold = 100,
}: ChatCostTrackerProps) {
  const [costData, setCostData] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat/cost?creatorId=${creatorId}&timeRange=${timeRange}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch cost data');
        }

        const result = await response.json();
        setCostData(result.data || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCostData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorId, timeRange]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading cost data...</div>
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

  if (!costData) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">No cost data available</div>
      </div>
    );
  }

  const modelColors: Record<string, string> = {
    'claude-3-5-haiku-20241022': '#3b82f6',
    'claude-3-5-sonnet-20241022': '#8b5cf6',
    haiku: '#3b82f6',
    sonnet: '#8b5cf6',
  };

  const pieData = Object.entries(costData.byModel).map(([model, cost]) => ({
    name: model.includes('haiku') ? 'Haiku' : 'Sonnet',
    value: cost,
    color: modelColors[model] || '#6b7280',
  }));

  const budgetUsagePercent = (costData.total / budgetThreshold) * 100;
  const isOverBudget = budgetUsagePercent > 100;
  const isNearBudget = budgetUsagePercent > 80 && !isOverBudget;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Cost Tracker
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track AI API usage and expenses
        </p>
      </div>

      {/* Budget Alert */}
      {(isOverBudget || isNearBudget) && (
        <div
          className={`p-4 rounded-lg border ${
            isOverBudget
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}
        >
          <div
            className={`font-semibold ${
              isOverBudget
                ? 'text-red-900 dark:text-red-100'
                : 'text-amber-900 dark:text-amber-100'
            }`}
          >
            {isOverBudget ? '⚠️ Budget Exceeded!' : '⚠️ Budget Alert'}
          </div>
          <div
            className={`text-sm ${
              isOverBudget
                ? 'text-red-700 dark:text-red-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {isOverBudget
              ? `You have exceeded your monthly budget by $${(costData.total - budgetThreshold).toFixed(2)} (${budgetUsagePercent.toFixed(1)}%)`
              : `You are at ${budgetUsagePercent.toFixed(1)}% of your monthly budget`}
          </div>
        </div>
      )}

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Cost</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${costData.total.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Per Message</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${costData.perMessage.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Average</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Per Student</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${costData.perStudent.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Average</div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Budget Used</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {budgetUsagePercent.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            ${budgetThreshold} limit
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cost Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Daily Cost Trend
          </h4>
          <ResponsiveContainer width="100%" height={250} aspect={2}>
            <LineChart data={costData.byDate}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Cost by Model
          </h4>
          <ResponsiveContainer width="100%" height={250} aspect={2}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${entry.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
