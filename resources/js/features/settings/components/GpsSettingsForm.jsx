import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const GpsSettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
                <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Pengaturan Lokasi & GPS</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Radius Validasi GPS (meter)
                    </label>
                    <input
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.gps_radius_validation || ''}
                        onChange={(e) => onChange('gps_radius_validation', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('gps_radius_validation') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('gps_radius_validation') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('gps_radius_validation')}
                        </p>
                    )}
                    {!hasError('gps_radius_validation') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Jarak maksimal dari lokasi APAR untuk validasi inspeksi
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jendela Waktu Inspeksi (menit)
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="120"
                        value={settings.inspection_time_window || ''}
                        onChange={(e) => onChange('inspection_time_window', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('inspection_time_window') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('inspection_time_window') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('inspection_time_window')}
                        </p>
                    )}
                    {!hasError('inspection_time_window') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Toleransi waktu sebelum/sesudah jadwal inspeksi
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jam Kerja Mulai
                    </label>
                    <input
                        type="time"
                        value={settings.working_hours_start || ''}
                        onChange={(e) => onChange('working_hours_start', e.target.value)}
                        disabled={disabled}
                        className={`w-full border ${hasError('working_hours_start') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('working_hours_start') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('working_hours_start')}
                        </p>
                    )}
                    {!hasError('working_hours_start') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Jam mulai periode kerja untuk validasi inspeksi
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jam Kerja Selesai
                    </label>
                    <input
                        type="time"
                        value={settings.working_hours_end || ''}
                        onChange={(e) => onChange('working_hours_end', e.target.value)}
                        disabled={disabled}
                        className={`w-full border ${hasError('working_hours_end') ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {hasError('working_hours_end') && (
                        <p className="text-sm text-red-600 mt-1">
                            {getFieldError('working_hours_end')}
                        </p>
                    )}
                    {!hasError('working_hours_end') && (
                        <p className="text-sm text-gray-500 mt-1">
                            Jam selesai periode kerja untuk validasi inspeksi
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GpsSettingsForm;
