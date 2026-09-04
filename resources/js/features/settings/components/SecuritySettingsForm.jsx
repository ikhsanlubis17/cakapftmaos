import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const SecuritySettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm">
            <div className="flex items-center mb-6 pb-3 border-b border-slate-100">
                <ShieldCheckIcon className="h-5 w-5 text-[#041562] mr-2" />
                <h2 className="text-base font-bold text-[#041562]">Pengaturan Keamanan & Sesi</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Timeout Sesi (menit)
                    </label>
                    <input
                        type="number"
                        min="15"
                        max="480"
                        value={settings.session_timeout || ''}
                        onChange={(e) => onChange('session_timeout', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('session_timeout') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('session_timeout') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('session_timeout')}
                        </p>
                    )}
                    {!hasError('session_timeout') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Waktu timeout otomatis saat sesi tidak aktif
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Maksimal Percobaan Login
                    </label>
                    <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.max_login_attempts || ''}
                        onChange={(e) => onChange('max_login_attempts', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('max_login_attempts') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('max_login_attempts') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('max_login_attempts')}
                        </p>
                    )}
                    {!hasError('max_login_attempts') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Batas gagal autentikasi sebelum akun terkunci sementara
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Durasi Penguncian Akun (menit)
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="60"
                        value={settings.lockout_duration || ''}
                        onChange={(e) => onChange('lockout_duration', parseInt(e.target.value))}
                        disabled={disabled}
                        className={`w-full border ${hasError('lockout_duration') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('lockout_duration') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('lockout_duration')}
                        </p>
                    )}
                    {!hasError('lockout_duration') && (
                        <p className="text-xs text-slate-500 mt-1">
                            Masa tunggu reset login setelah melebihi batas percobaan
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecuritySettingsForm;
