import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
    FireIcon,
    ArrowLeftIcon,
    MapPinIcon,
    TruckIcon,
    ScaleIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const InspectionHeader = ({ apar }) => {
    const navigate = useNavigate();

    if (!apar) {
        return null;
    }

    const isMobileLocation = apar.location_type === 'mobile' || Boolean(apar.tank_truck);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#041562] via-[#092370] to-[#11468F] shadow-lg rounded-[10px] p-4 sm:p-6 text-white border-b-4 border-emerald-500">
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#11468F]/30 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                {/* Top Row: Back button & Status Pill */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => navigate({ to: '/inspections' })}
                        className="inline-flex items-center px-2.5 py-1.5 min-h-[36px] text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-[6px] transition-colors cursor-pointer"
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 mr-1.5" />
                        Kembali
                    </button>

                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold">
                        <span className="relative flex h-2 w-2 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        Inspeksi Siaga
                    </div>
                </div>

                {/* Middle Row: Icon & Serial Number */}
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-[8px] bg-white/15 border border-white/20 flex items-center justify-center shadow-md text-white flex-shrink-0">
                        <FireIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-200">
                            Lembar Inspeksi Lapangan
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-wider text-white truncate drop-shadow-xs">
                            {apar.serial_number || 'N/A'}
                        </h1>
                    </div>
                </div>

                {/* Bottom Row: Metadata Chips */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-white/10 text-xs">
                    {/* Location Chip */}
                    <div className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-white/10 backdrop-blur-xs text-slate-100 font-medium">
                        {isMobileLocation ? (
                            <TruckIcon className="w-3.5 h-3.5 mr-1.5 text-blue-300 flex-shrink-0" />
                        ) : (
                            <MapPinIcon className="w-3.5 h-3.5 mr-1.5 text-blue-300 flex-shrink-0" />
                        )}
                        <span className="truncate max-w-[200px] sm:max-w-none">
                            {apar.location_name || 'N/A'}
                        </span>
                        {apar.tank_truck && (
                            <span className="font-mono text-blue-200 ml-1">
                                ({apar.tank_truck.plate_number})
                            </span>
                        )}
                    </div>

                    {/* Media Type & Capacity Chip */}
                    {(apar.apar_type?.name || apar.capacity) && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-white/10 backdrop-blur-xs text-slate-100 font-medium">
                            <ScaleIcon className="w-3.5 h-3.5 mr-1.5 text-blue-300 flex-shrink-0" />
                            <span>
                                {apar.apar_type?.name || 'Standar'}{' '}
                                {apar.capacity ? `• ${apar.capacity} kg` : ''}
                            </span>
                        </div>
                    )}

                    {/* Readiness Status Chip */}
                    {apar.status && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-white/10 backdrop-blur-xs text-slate-100 font-medium capitalize">
                            <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-300 flex-shrink-0" />
                            <span>{apar.status}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InspectionHeader;
