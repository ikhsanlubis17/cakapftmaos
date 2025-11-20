import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

const ScheduleSettingsForm = ({ settings, onChange, getFieldError, hasError }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
                <CogIcon className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Pengaturan Jadwal & Interval</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interval Inspeksi Default (hari)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.default_inspection_interval || ''}
                        onChange={(e) => onChange('default_inspection_interval', parseInt(e.target.value))}
                        className={`w-full border ${hasError('default_inspection_interval') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                    />
                    {hasError('default_inspection_interval') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('default_inspection_interval')}
                        </p>
                    )}
                    {!hasError('default_inspection_interval') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Interval default untuk jadwal inspeksi APAR
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hari Notifikasi Reminder
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.reminder_notification_days || ''}
                        onChange={(e) => onChange('reminder_notification_days', parseInt(e.target.value))}
                        className={`w-full border ${hasError('reminder_notification_days') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                    />
                    {hasError('reminder_notification_days') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('reminder_notification_days')}
                        </p>
                    )}
                    {!hasError('reminder_notification_days') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Berapa hari sebelum jadwal untuk kirim reminder
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hari Notifikasi Eskalasi
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="90"
                        value={settings.escalation_notification_days || ''}
                        onChange={(e) => onChange('escalation_notification_days', parseInt(e.target.value))}
                        className={`w-full border ${hasError('escalation_notification_days') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                    />
                    {hasError('escalation_notification_days') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('escalation_notification_days')}
                        </p>
                    )}
                    {!hasError('escalation_notification_days') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Berapa hari setelah jadwal untuk notifikasi eskalasi
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">Generate Jadwal Otomatis</h3>
                        <p className="text-sm text-gray-500">Buat jadwal inspeksi secara otomatis</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.auto_schedule_generation || false}
                            onChange={(e) => onChange('auto_schedule_generation', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ScheduleSettingsForm;
