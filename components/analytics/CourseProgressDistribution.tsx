'use client';

/**
 * Course Progress Distribution Component
 * Displays student progress across courses in stacked bar chart
 * Shows distribution across progress buckets
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ProgressBucket } from './engagement-types';

interface CourseProgressDistributionProps {
  creatorId: string;
  courseIds?: string[];
  data?: ProgressBucket[];
  isLoading?: boolean;
}

const COLORS = {
  notStarted: '#9CA3AF', // Gray
  low: '#EF4444', // Red
  medium: '#F59E0B', // Orange
  high: '#FBBF24', // Yellow
  veryHigh: '#10B981', // Green
  completed: '#3B82F6', // Blue
};

const LABELS = {
  notStarted: 'Not Started',
  low: '0-25%',
  medium: '26-50%',
  high: '51-75%',
  veryHigh: '76-99%',
  completed: 'Completed',
};

export default function CourseProgressDistribution({
  creatorId,
  courseIds = [],
  data = [],
  isLoading = false,
}: CourseProgressDistributionProps) {
  // Transform data for stacked bar chart
  const chartData = data.map((course) => {
    const total =
      course.notStarted +
      course.low +
      course.medium +
      course.high +
      course.veryHigh +
      course.completed;

    return {
      name: course.course,
      notStarted: Math.round((course.notStarted / total) * 100) || 0,
      low: Math.round((course.low / total) * 100) || 0,
      medium: Math.round((course.medium / total) * 100) || 0,
      high: Math.round((course.high / total) * 100) || 0,
      veryHigh: Math.round((course.veryHigh / total) * 100) || 0,
      completed: Math.round((course.completed / total) * 100) || 0,
      // Keep raw counts for tooltip
      counts: {
        notStarted: course.notStarted,
        low: course.low,
        medium: course.medium,
        high: course.high,
        veryHigh: course.veryHigh,
        completed: course.completed,
        total,
      },
    };
  });

  // Calculate overall completion rate
  const totalStudents = data.reduce((sum, course) => {
    return (
      sum +
      course.notStarted +
      course.low +
      course.medium +
      course.high +
      course.veryHigh +
      course.completed
    );
  }, 0);

  const totalCompleted = data.reduce((sum, course) => sum + course.completed, 0);
  const completionRate =
    totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Course Progress Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Student progress across all courses
          </p>
        </div>

        {/* Overall Completion Rate */}
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Overall Completion
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            opacity={0.1}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9CA3AF"
            fontSize={12}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number, name: string, props: any) => {
              const counts = props.payload.counts;
              const key = name as keyof typeof counts;
              const count = counts[key];
              return [`${count} students (${value}%)`, LABELS[key as keyof typeof LABELS]];
            }}
          />
          <Legend
            formatter={(value) => LABELS[value as keyof typeof LABELS]}
            wrapperStyle={{ fontSize: '12px' }}
          />

          <Bar dataKey="completed" stackId="a" fill={COLORS.completed} />
          <Bar dataKey="veryHigh" stackId="a" fill={COLORS.veryHigh} />
          <Bar dataKey="high" stackId="a" fill={COLORS.high} />
          <Bar dataKey="medium" stackId="a" fill={COLORS.medium} />
          <Bar dataKey="low" stackId="a" fill={COLORS.low} />
          <Bar dataKey="notStarted" stackId="a" fill={COLORS.notStarted} />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                Course
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                Not Started
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                0-25%
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                26-50%
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                51-75%
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                76-99%
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                Completed
              </th>
              <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((course, index) => {
              const total =
                course.notStarted +
                course.low +
                course.medium +
                course.high +
                course.veryHigh +
                course.completed;

              return (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 px-3 text-gray-900 dark:text-white font-medium">
                    {course.course}
                  </td>
                  <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                    {course.notStarted}
                  </td>
                  <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                    {course.low}
                  </td>
                  <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                    {course.medium}
                  </td>
                  <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                    {course.high}
                  </td>
                  <td className="text-center py-2 px-3 text-gray-600 dark:text-gray-400">
                    {course.veryHigh}
                  </td>
                  <td className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">
                    {course.completed}
                  </td>
                  <td className="text-center py-2 px-3 text-gray-900 dark:text-white font-semibold">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No course progress data available
          </p>
        </div>
      )}
    </div>
  );
}
