'use client';

import { useState, useEffect } from 'react';
import type { ReportSchedule, TemplateType, ReportFrequency } from '@/lib/reports/types';

export function ScheduledReportsManager() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/export/schedule');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/export/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheduleId, is_active: !isActive }),
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch('/api/export/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheduleId }),
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduled Reports</h2>
          <p className="text-gray-600 mt-1">
            Automate report generation and delivery
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Schedule</span>
        </button>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled reports</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first automated report schedule.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {schedule.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {schedule.is_active ? 'Active' : 'Paused'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                      {schedule.frequency}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Template:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {schedule.template.charAt(0).toUpperCase() + schedule.template.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivery Time:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {schedule.delivery_time}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Recipients:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {schedule.recipients.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {schedule.recipients.slice(0, 3).map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {email}
                      </span>
                    ))}
                    {schedule.recipients.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{schedule.recipients.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={schedule.is_active ? 'Pause' : 'Resume'}
                  >
                    {schedule.is_active ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingSchedule(schedule)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingSchedule) && (
        <ScheduleFormDialog
          schedule={editingSchedule}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingSchedule(null);
          }}
          onSave={async () => {
            await loadSchedules();
            setShowCreateDialog(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}

// Schedule Form Dialog Component
function ScheduleFormDialog({
  schedule,
  onClose,
  onSave,
}: {
  schedule: ReportSchedule | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    template: (schedule?.template || 'executive') as TemplateType,
    frequency: (schedule?.frequency || 'weekly') as ReportFrequency,
    delivery_time: schedule?.delivery_time || '09:00',
    delivery_day: schedule?.delivery_day || 1,
    recipients: schedule?.recipients.join(', ') || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/export/schedule', {
        method: schedule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(schedule && { id: schedule.id }),
          ...formData,
          recipients: formData.recipients
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Failed to save schedule');
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {schedule ? 'Edit Schedule' : 'Create Schedule'}
            </h2>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={formData.template}
                  onChange={(e) =>
                    setFormData({ ...formData, template: e.target.value as TemplateType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="executive">Executive Summary</option>
                  <option value="detailed">Detailed Analytics</option>
                  <option value="student">Student Progress</option>
                  <option value="content">Content Performance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as ReportFrequency,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time
              </label>
              <input
                type="time"
                value={formData.delivery_time}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_time: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Recipients (comma-separated)
              </label>
              <textarea
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="email1@example.com, email2@example.com"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
