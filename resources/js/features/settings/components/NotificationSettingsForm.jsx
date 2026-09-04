import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationSettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm">
            <div className="flex items-center mb-6 pb-3 border-b border-slate-100">
                <BellIcon className="h-5 w-5 text-[#041562] mr-2" />
                <h2 className="text-base font-bold text-[#041562]">Pengaturan Notifikasi</h2>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-[6px]">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Notifikasi Email</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Kirim pengingat jadwal inspeksi dan status eskalasi via email</p>
                    </div>
                    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={settings.notification_email || false}
                            onChange={(e) => onChange('notification_email', e.target.checked)}
                            disabled={disabled}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#11468F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11468F]"></div>
                    </label>
                </div>

                <div className="max-w-md">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Interval Notifikasi (jam)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="168"
                        value={settings.notification_interval || ''}
                        onChange={(e) => onChange('notification_interval', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('notification_interval') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('notification_interval') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('notification_interval')}
                        </p>
                    )}
                    {!hasError('notification_interval') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Interval pengiriman notifikasi reminder berkala
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsForm;
