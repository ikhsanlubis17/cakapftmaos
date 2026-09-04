import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const GpsSettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm">
            <div className="flex items-center mb-6 pb-3 border-b border-slate-100">
                <MapPinIcon className="h-5 w-5 text-[#041562] mr-2" />
                <h2 className="text-base font-bold text-[#041562]">Pengaturan Lokasi & GPS</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Radius Validasi GPS (meter)
                    </label>
                    <input
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.gps_radius_validation || ''}
                        onChange={(e) => onChange('gps_radius_validation', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('gps_radius_validation') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('gps_radius_validation') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('gps_radius_validation')}
                        </p>
                    )}
                    {!hasError('gps_radius_validation') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Jarak maksimal dari lokasi APAR untuk validasi inspeksi
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Jendela Waktu Inspeksi (menit)
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="120"
                        value={settings.inspection_time_window || ''}
                        onChange={(e) => onChange('inspection_time_window', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('inspection_time_window') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('inspection_time_window') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('inspection_time_window')}
                        </p>
                    )}
                    {!hasError('inspection_time_window') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Toleransi waktu sebelum/sesudah jadwal inspeksi
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Jam Kerja Mulai
                    </label>
                    <input
                        type="time"
                        value={settings.working_hours_start || ''}
                        onChange={(e) => onChange('working_hours_start', e.target.value)}
                        disabled={disabled}
                        className={`w-full border ${hasError('working_hours_start') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('working_hours_start') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('working_hours_start')}
                        </p>
                    )}
                    {!hasError('working_hours_start') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Jam mulai periode kerja untuk validasi inspeksi
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Jam Kerja Selesai
                    </label>
                    <input
                        type="time"
                        value={settings.working_hours_end || ''}
                        onChange={(e) => onChange('working_hours_end', e.target.value)}
                        disabled={disabled}
                        className={`w-full border ${hasError('working_hours_end') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('working_hours_end') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('working_hours_end')}
                        </p>
                    )}
                    {!hasError('working_hours_end') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Jam selesai periode kerja untuk validasi inspeksi
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GpsSettingsForm;
