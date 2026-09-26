import React from "react";
import {
    XMarkIcon,
    FireIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { getAparStatusConfig } from "@/utils/statusUtils";

export const AssignAparModal = ({
    isOpen,
    onClose,
    availableApars,
    selectedAparId,
    setSelectedAparId,
    searchTerm,
    setSearchTerm,
    onAssign,
    assigning,
    tankTruckId,
}) => {
    if (!isOpen) return null;

    const filteredApars = availableApars.filter((apar) => {
        const query = searchTerm.toLowerCase();
        return (
            apar.serial_number?.toLowerCase().includes(query) ||
            apar.location_name?.toLowerCase().includes(query) ||
            apar.apar_type?.name?.toLowerCase().includes(query)
        );
    });

    const selectedApar = availableApars.find(
        (a) => String(a.id) === String(selectedAparId)
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[8px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#041562] text-white">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-[6px]">
                            <FireIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-wide">
                                Pasang APAR ke Mobil Tangki
                            </h3>
                            <p className="text-xs text-slate-300">
                                Pilih tabung APAR bertipe mobil untuk dipasangkan pada armada ini
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-slate-300 hover:text-white rounded-[4px] hover:bg-white/10 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nomor seri tabung, jenis, atau lokasi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto p-4 divide-y divide-slate-100">
                    {filteredApars.length === 0 ? (
                        <div className="py-12 text-center">
                            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                            <h4 className="text-sm font-bold text-slate-800">
                                Tidak Ada APAR Tersedia
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                Semua APAR bertipe mobil telah terpasang pada armada lain, atau tidak ada yang sesuai dengan pencarian Anda.
                            </p>
                        </div>
                    ) : (
                        filteredApars.map((apar) => {
                            const isSelected = String(apar.id) === String(selectedAparId);
                            const statusConfig = getAparStatusConfig(apar.status);
                            const isAlreadyOnThis =
                                apar.tank_truck_id &&
                                String(apar.tank_truck_id) === String(tankTruckId);

                            return (
                                <div
                                    key={apar.id}
                                    onClick={() => setSelectedAparId(String(apar.id))}
                                    className={`p-3.5 rounded-[6px] cursor-pointer transition-all ${
                                        isSelected
                                            ? "bg-blue-50 border border-blue-300 shadow-xs"
                                            : "hover:bg-slate-50 border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-[6px] bg-red-50 text-rose-600 flex items-center justify-center font-bold text-xs border border-red-200">
                                                <FireIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-sm text-slate-900">
                                                        {apar.serial_number}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${statusConfig.color}`}
                                                    >
                                                        {statusConfig.text}
                                                    </span>
                                                    {isAlreadyOnThis && (
                                                        <span className="text-[10px] font-bold text-[#11468F] bg-blue-100/60 px-1.5 py-0.5 rounded-[3px]">
                                                            Terpasang di Truk Ini
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {apar.apar_type?.name || "Standar"} &bull; {apar.capacity} kg &bull; {apar.location_name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 border-t border-slate-200 bg-slate-50 gap-3">
                    <div className="text-xs text-slate-600">
                        {selectedApar ? (
                            <span>
                                Tabung Terpilih:{" "}
                                <span className="font-mono font-bold text-slate-900">
                                    {selectedApar.serial_number}
                                </span>
                            </span>
                        ) : (
                            <span>Pilih salah satu tabung APAR di atas</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-[6px] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onAssign}
                            disabled={!selectedAparId || assigning}
                            className="inline-flex items-center justify-center px-5 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] disabled:opacity-50 rounded-[6px] shadow-sm transition-colors"
                        >
                            {assigning ? (
                                "Menugaskan..."
                            ) : (
                                <>
                                    <PlusIcon className="w-4 h-4 mr-1.5" />
                                    Pasang APAR
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignAparModal;
