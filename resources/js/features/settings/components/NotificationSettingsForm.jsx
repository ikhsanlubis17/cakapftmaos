import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationSettingsForm = ({ settings, onChange, getFieldError, hasError }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
                <BellIcon className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Pengaturan Notifikasi</h2>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">Notifikasi Email</h3>
                        <p className="text-sm text-gray-500">Kirim reminder inspeksi via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.notification_email || false}
                            onChange={(e) => onChange('notification_email', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interval Notifikasi (jam)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="168"
                        value={settings.notification_interval || ''}
                        onChange={(e) => onChange('notification_interval', parseInt(e.target.value))}
                        className={`w-full border ${hasError('notification_interval') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                    />
                    {hasError('notification_interval') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('notification_interval')}
                        </p>
                    )}
                    {!hasError('notification_interval') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Interval pengiriman notifikasi reminder
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsForm;
