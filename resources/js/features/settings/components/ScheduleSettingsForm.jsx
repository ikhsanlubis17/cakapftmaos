import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

const ScheduleSettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm">
            <div className="flex items-center mb-6 pb-3 border-b border-slate-100">
                <CogIcon className="h-5 w-5 text-[#041562] mr-2" />
                <h2 className="text-base font-bold text-[#041562]">Pengaturan Jadwal & Interval</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Interval Inspeksi Default (hari)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.default_inspection_interval || ''}
                        onChange={(e) => onChange('default_inspection_interval', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('default_inspection_interval') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('default_inspection_interval') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('default_inspection_interval')}
                        </p>
                    )}
                    {!hasError('default_inspection_interval') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Interval default untuk jadwal inspeksi APAR
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Hari Notifikasi Reminder
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.reminder_notification_days || ''}
                        onChange={(e) => onChange('reminder_notification_days', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('reminder_notification_days') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('reminder_notification_days') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('reminder_notification_days')}
                        </p>
                    )}
                    {!hasError('reminder_notification_days') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Berapa hari sebelum jadwal untuk kirim reminder
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Hari Notifikasi Eskalasi
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="90"
                        value={settings.escalation_notification_days || ''}
                        onChange={(e) => onChange('escalation_notification_days', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('escalation_notification_days') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('escalation_notification_days') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('escalation_notification_days')}
                        </p>
                    )}
                    {!hasError('escalation_notification_days') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Berapa hari setelah jadwal untuk notifikasi eskalasi
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-[6px]">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Generate Jadwal Otomatis</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Buat jadwal inspeksi secara otomatis sesuai interval</p>
                    </div>
                    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={settings.auto_schedule_generation || false}
                            onChange={(e) => onChange('auto_schedule_generation', e.target.checked)}
                            disabled={disabled}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#11468F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11468F]"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ScheduleSettingsForm;
