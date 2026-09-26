import React from 'react';
import {
    FireIcon,
    XMarkIcon,
    WrenchScrewdriverIcon,
    ShieldCheckIcon,
    CameraIcon,
} from '@heroicons/react/24/outline';
import { formatStorageUrl } from '@/utils/imageUrl';
import { formatDateTime as formatDate } from '@/utils/dateUtils';

const InspectionDetailModal = ({
    inspection,
    onClose,
    getStatusBadge,
    getConditionBadge,
    onPhotoClick,
}) => {
    if (!inspection) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#041562] text-white rounded-lg">
                            <FireIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 font-mono tracking-wider">
                                    {inspection.apar?.serial_number || 'APAR'}
                                </h3>
                                {getStatusBadge && getStatusBadge(inspection.status)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {inspection.apar?.location_name || 'Lokasi N/A'} • Diperiksa pada {formatDate(inspection.created_at)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-200 rounded-[6px] text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-5">
                    {/* Kondisi Utama */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                                Kondisi Fisik Dilaporkan
                            </span>
                            <span className="text-sm font-bold text-slate-900 capitalize">
                                {inspection.condition === 'good' ? 'Normal / Siap Operasi' : inspection.condition}
                            </span>
                        </div>
                        <div>{getConditionBadge && getConditionBadge(inspection.condition, inspection.inspection_damages)}</div>
                    </div>

                    {/* Temuan Kerusakan Detail */}
                    {inspection.inspection_damages && inspection.inspection_damages.length > 0 && (
                        <div className="border border-rose-200 bg-rose-50/50 rounded-lg p-4 space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                                <WrenchScrewdriverIcon className="h-4 w-4 text-[#DA1212]" />
                                Rincian Temuan Kerusakan ({inspection.inspection_damages.length})
                            </h4>
                            <div className="space-y-2">
                                {inspection.inspection_damages.map((dmg, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-rose-200 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">
                                                {dmg.damage_category?.name || 'Kerusakan'}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {dmg.damage_category?.description || dmg.notes || 'Tanpa catatan khusus'}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-[3px]">
                                            Severity: {dmg.severity || 'Medium'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Integritas Lokasi & Anti-Fraud HSSE */}
                    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <ShieldCheckIcon className="h-4 w-4 text-[#11468F]" />
                            Verifikasi Lokasi & Integritas HSSE
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 block">Koordinat Lapangan:</span>
                                <span className="font-mono text-slate-800">
                                    {inspection.inspection_lat || '-'}, {inspection.inspection_lng || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 block">Akurasi GPS:</span>
                                <span className="font-mono text-slate-800">
                                    {inspection.gps_accuracy_meters ? `${Math.round(inspection.gps_accuracy_meters)} meter` : 'Tidak tercatat'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 block">Validasi Radius:</span>
                                <span className={`font-bold ${inspection.location_valid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {inspection.location_valid ? 'Dalam Radius Terminal' : 'Di Luar Radius'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 block">Pemeriksa:</span>
                                <span className="font-bold text-slate-800">
                                    {inspection.user?.name || 'Teknisi'} ({inspection.user?.role || 'User'})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Galeri Foto Dokumentasi */}
                    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <CameraIcon className="h-4 w-4 text-slate-700" />
                            Dokumentasi Visual (Klik foto untuk memperbesar)
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {inspection.photo_url && (
                                <div
                                    onClick={() => onPhotoClick && onPhotoClick(inspection.photo_url, 'Foto Tabung APAR', inspection)}
                                    className="cursor-pointer group aspect-video rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100"
                                >
                                    <img
                                        src={formatStorageUrl(inspection.photo_url)}
                                        alt="Tabung"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-bold rounded-[3px]">
                                        Tabung
                                    </span>
                                </div>
                            )}
                            {inspection.selfie_url && (
                                <div
                                    onClick={() => onPhotoClick && onPhotoClick(inspection.selfie_url, 'Foto Selfie Petugas', inspection)}
                                    className="cursor-pointer group aspect-video rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100"
                                >
                                    <img
                                        src={formatStorageUrl(inspection.selfie_url)}
                                        alt="Selfie"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-bold rounded-[3px]">
                                        Selfie
                                    </span>
                                </div>
                            )}
                            {inspection.inspection_damages?.map((dmg, i) => (
                                dmg.damage_photo_url && (
                                    <div
                                        key={i}
                                        onClick={() => onPhotoClick && onPhotoClick(dmg.damage_photo_url, `Kerusakan: ${dmg.damage_category?.name}`, inspection)}
                                        className="cursor-pointer group aspect-video rounded-lg overflow-hidden border border-rose-300 relative bg-slate-100 ring-1 ring-rose-300"
                                    >
                                        <img
                                            src={formatStorageUrl(dmg.damage_photo_url)}
                                            alt="Kerusakan"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-rose-900/90 text-white text-[9px] font-bold rounded-[3px]">
                                            Rusak
                                        </span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Catatan Tambahan */}
                    {inspection.notes && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                            <span className="font-bold text-slate-900 block mb-1">Catatan Inspeksi:</span>
                            <p className="leading-relaxed">{inspection.notes}</p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-[#041562] hover:bg-[#11468F] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InspectionDetailModal;
