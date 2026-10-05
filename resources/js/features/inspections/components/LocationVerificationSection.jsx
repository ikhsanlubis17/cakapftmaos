import React from 'react';
import {
    MapPinIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

export const LocationVerificationSection = ({
    locationLoading,
    currentLocation,
    apar,
    locationValid,
    locationDistance,
    locationValidRadius,
    locationSkipped,
    locationError,
    getCurrentLocation,
    skipLocation,
}) => {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-[6px] bg-blue-50 text-[#11468F] ring-1 ring-blue-200 flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center">
                            Validasi Geofence & Lokasi GPS
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Integritas anti-fraud koordinat lokasi inspeksi
                        </p>
                    </div>
                </div>
                {locationLoading ? (
                    <span className="inline-flex items-center text-xs text-[#11468F] font-bold">
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#11468F] border-t-transparent mr-1.5" />
                        Mencari GPS...
                    </span>
                ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
                        Anti-Fraud GPS
                    </span>
                )}
            </div>

            {currentLocation ? (
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[6px] border border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">Koordinat Terdeteksi:</span>
                        <span className="font-mono font-bold text-slate-800 break-all">
                            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </span>
                    </div>

                    {apar?.latitude && apar?.longitude && (
                        <div
                            data-testid="gps-status-badge"
                            className={`flex items-start p-3 rounded-[6px] border ${
                                locationValid
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                    : 'bg-rose-50 text-rose-900 border-rose-200'
                            }`}
                        >
                            {locationValid ? (
                                <CheckCircleIcon className="h-5 w-5 mr-2.5 flex-shrink-0 text-emerald-600 mt-0.5" />
                            ) : (
                                <ExclamationTriangleIcon className="h-5 w-5 mr-2.5 flex-shrink-0 text-[#DA1212] mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-bold">
                                    {locationValid ? 'Lokasi Valid' : 'Lokasi Tidak Valid'}
                                </p>
                                <p className="text-xs mt-0.5 leading-relaxed">
                                    Jarak ke APAR: <strong className="font-mono">{locationDistance}m</strong> (Toleransi Maks: <span className="font-mono">{locationValidRadius}m</span>)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : locationSkipped ? (
                <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 text-xs flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 text-slate-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-slate-800">Lokasi Dilewati</p>
                        <p className="text-slate-600 mt-0.5">Inspeksi akan disimpan tanpa verifikasi koordinat GPS.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-[6px] p-3 text-xs flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-amber-900">Lokasi GPS Belum Terdeteksi</p>
                        <p className="text-amber-800 mt-0.5">{locationError || 'Pastikan GPS perangkat aktif dan izin lokasi telah diberikan.'}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center justify-center flex-1 px-4 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                    <MapPinIcon className="w-4 h-4 mr-1.5 text-[#11468F]" />
                    {locationLoading ? 'Mencari Lokasi...' : 'Perbarui Lokasi GPS'}
                </button>

                {!currentLocation && !locationLoading && (
                    <button
                        type="button"
                        onClick={skipLocation}
                        className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] border border-slate-200 rounded-[6px] text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Lanjutkan Tanpa Lokasi
                    </button>
                )}
            </div>
        </div>
    );
};

export default LocationVerificationSection;
