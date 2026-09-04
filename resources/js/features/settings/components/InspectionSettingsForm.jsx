import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const InspectionSettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm">
            <div className="flex items-center mb-6 pb-3 border-b border-slate-100">
                <ShieldCheckIcon className="h-5 w-5 text-[#041562] mr-2" />
                <h2 className="text-base font-bold text-[#041562]">Pengaturan Validasi Inspeksi</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-[6px]">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Blokir Inspeksi Otomatis</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Blokir input inspeksi yang dilakukan di luar jadwal resmi</p>
                        </div>
                        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={settings.auto_block_inspection || false}
                                onChange={(e) => onChange('auto_block_inspection', e.target.checked)}
                                disabled={disabled}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#11468F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11468F]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-[6px]">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Wajib Lampiran Foto APAR</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Teknisi wajib mengambil foto fisik saat inspeksi</p>
                        </div>
                        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={settings.require_photo || false}
                                onChange={(e) => onChange('require_photo', e.target.checked)}
                                disabled={disabled}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#11468F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11468F]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-[6px]">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Validasi Geotagging GPS</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Wajib mencocokkan radius GPS saat scan QR APAR</p>
                        </div>
                        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={settings.require_location_validation || false}
                                onChange={(e) => onChange('require_location_validation', e.target.checked)}
                                disabled={disabled}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#11468F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11468F]"></div>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Ukuran Maksimal Foto (MB)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={settings.max_photo_size || ''}
                            onChange={(e) => onChange('max_photo_size', parseInt(e.target.value))}
                            disabled={disabled}
                            className={`w-full border ${hasError('max_photo_size') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                        />
                        {hasError('max_photo_size') && (
                            <p className="text-xs text-[#DA1212] font-semibold mt-1">
                                {getFieldError('max_photo_size')}
                            </p>
                        )}
                        {!hasError('max_photo_size') && (
                            <p className="text-xs text-slate-500 mt-1">
                                Ukuran maksimal file foto inspeksi yang diupload teknisi
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InspectionSettingsForm;
