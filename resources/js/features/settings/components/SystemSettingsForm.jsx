import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

const SystemSettingsForm = ({ settings, onChange, getFieldError, hasError }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
                <CogIcon className="h-6 w-6 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Pengaturan Sistem</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Mode Maintenance</h3>
                            <p className="text-sm text-gray-500">Aktifkan mode maintenance untuk perbaikan sistem</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode || false}
                                onChange={(e) => onChange('maintenance_mode', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Mode Debug</h3>
                            <p className="text-sm text-gray-500">Aktifkan mode debug untuk troubleshooting</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.debug_mode || false}
                                onChange={(e) => onChange('debug_mode', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Retensi Log (hari)
                        </label>
                        <input
                            type="number"
                            min="30"
                            max="365"
                            value={settings.log_retention_days || ''}
                            onChange={(e) => onChange('log_retention_days', parseInt(e.target.value))}
                            className={`w-full border ${hasError('log_retention_days') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                        />
                        {hasError('log_retention_days') && (
                            <p className="text-sm text-red-600 mt-1">
                                {getFieldError('log_retention_days')}
                            </p>
                        )}
                        {!hasError('log_retention_days') && (
                            <p className="text-sm text-gray-500 mt-1">
                                Berapa lama log sistem disimpan
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frekuensi Backup (hari)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={settings.backup_frequency || ''}
                            onChange={(e) => onChange('backup_frequency', parseInt(e.target.value))}
                            className={`w-full border ${hasError('backup_frequency') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                        />
                        {hasError('backup_frequency') && (
                            <p className="text-sm text-red-600 mt-1">
                                {getFieldError('backup_frequency')}
                            </p>
                        )}
                        {!hasError('backup_frequency') && (
                            <p className="text-sm text-gray-500 mt-1">
                                Interval backup otomatis database
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsForm;
