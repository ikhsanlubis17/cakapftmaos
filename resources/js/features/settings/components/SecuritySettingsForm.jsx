import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const SecuritySettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Pengaturan Keamanan & Sesi</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout Sesi (menit)
                    </label>
                    <input
                        type="number"
                        min="15"
                        max="480"
                        value={settings.session_timeout || ''}
                        onChange={(e) => onChange('session_timeout', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('session_timeout') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('session_timeout') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('session_timeout')}
                        </p>
                    )}
                    {!hasError('session_timeout') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Waktu timeout untuk sesi pengguna
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maksimal Percobaan Login
                    </label>
                    <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.max_login_attempts || ''}
                        onChange={(e) => onChange('max_login_attempts', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('max_login_attempts') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('max_login_attempts') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('max_login_attempts')}
                        </p>
                    )}
                    {!hasError('max_login_attempts') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Jumlah maksimal percobaan login sebelum blokir
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Durasi Blokir (menit)
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="60"
                        value={settings.lockout_duration || ''}
                        onChange={(e) => onChange('lockout_duration', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('lockout_duration') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('lockout_duration') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('lockout_duration')}
                        </p>
                    )}
                    {!hasError('lockout_duration') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Durasi blokir setelah melebihi maksimal percobaan
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecuritySettingsForm;
