import React from "react";
import { Link } from "@tanstack/react-router";
import {
    TruckIcon,
    FireIcon,
    PhoneIcon,
    UserIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { getTruckComplianceSummary } from "@/utils/statusUtils";

export const TankTruckTable = ({
    tankTrucks,
    bulkDeleteMode,
    selectedTankTrucks,
    onSelectTankTruck,
    onSelectAll,
    onDelete,
}) => {
    const isAllSelected =
        tankTrucks.length > 0 && selectedTankTrucks.length === tankTrucks.length;

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
                return {
                    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    text: "Aktif",
                };
            case "maintenance":
                return {
                    color: "bg-amber-50 text-amber-700 border-amber-200",
                    text: "Maintenance",
                };
            case "inactive":
                return {
                    color: "bg-slate-100 text-slate-700 border-slate-200",
                    text: "Nonaktif",
                };
            default:
                return {
                    color: "bg-slate-50 text-slate-700 border-slate-200",
                    text: status || "Aktif",
                };
        }
    };

    if (tankTrucks.length === 0) {
        return (
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-12 text-center">
                <TruckIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                <h3 className="text-sm font-bold text-slate-900">
                    Tidak ada mobil tangki ditemukan
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Coba ubah kata kunci pencarian Anda atau tambahkan armada baru.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                            {bulkDeleteMode && (
                                <th scope="col" className="px-4 py-3.5 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={onSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                    />
                                </th>
                            )}
                            <th scope="col" className="px-5 py-3.5">
                                Identitas Armada
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                                Awak / Pengemudi
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                                APAR Terpasang
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                                Status
                            </th>
                            <th scope="col" className="px-5 py-3.5 text-right">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {tankTrucks.map((truck) => {
                            const isSelected = selectedTankTrucks.includes(truck.id);
                            const statusConfig = getStatusBadge(truck.status);
                            const aparCount = truck.apars?.length || 0;

                            return (
                                <tr
                                    key={truck.id}
                                    className={`hover:bg-slate-50/80 transition-colors ${
                                        isSelected ? "bg-rose-50/40" : ""
                                    }`}
                                >
                                    {bulkDeleteMode && (
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    onSelectTankTruck(truck.id)
                                                }
                                                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                            />
                                        </td>
                                    )}

                                    {/* Plate number & description */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 rounded-[6px] bg-blue-50 border border-blue-200 text-[#11468F] flex items-center justify-center flex-shrink-0">
                                                <TruckIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <Link
                                                    to="/tank-trucks/$id"
                                                    params={{ id: String(truck.id) }}
                                                    className="font-mono font-bold text-slate-900 hover:text-[#11468F] tracking-wider transition-colors"
                                                >
                                                    {truck.plate_number}
                                                </Link>
                                                {truck.description && (
                                                    <div className="text-[11px] text-slate-500 line-clamp-1">
                                                        {truck.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Driver */}
                                    <td className="px-5 py-4">
                                        <div className="text-xs font-bold text-slate-900">
                                            {truck.driver_name}
                                        </div>
                                        {truck.driver_phone && (
                                            <div className="flex items-center text-[11px] font-mono text-slate-500 mt-0.5">
                                                <PhoneIcon className="w-3 h-3 mr-1" />
                                                {truck.driver_phone}
                                            </div>
                                        )}
                                    </td>

                                    {/* Attached APAR count & HSSE Compliance */}
                                    <td className="px-5 py-4">
                                        {(() => {
                                            const compliance = getTruckComplianceSummary(truck.apars || []);
                                            return (
                                                <div className="space-y-1">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-semibold border ${
                                                            aparCount > 0
                                                                ? "bg-blue-50 text-[#11468F] border-blue-200"
                                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                                        }`}
                                                    >
                                                        <FireIcon className="w-3.5 h-3.5 mr-1" />
                                                        {aparCount} APAR
                                                    </span>
                                                    {aparCount > 0 && (
                                                        <div>
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${compliance.badge.color}`}
                                                            >
                                                                {compliance.badge.text}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    {/* Status badge */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-semibold border ${statusConfig.color}`}
                                        >
                                            {statusConfig.text}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 text-right">
                                        <div className="inline-flex items-center space-x-1">
                                            <Link
                                                to="/tank-trucks/$id"
                                                params={{ id: String(truck.id) }}
                                                className="p-2 text-slate-500 hover:text-[#11468F] hover:bg-slate-100 rounded-[4px] transition-colors"
                                                title="Lihat Detail & APAR"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                to="/tank-trucks/$id/edit"
                                                params={{ id: String(truck.id) }}
                                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-[4px] transition-colors"
                                                title="Edit Mobil Tangki"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(truck.id)}
                                                className="p-2 text-slate-500 hover:text-[#DA1212] hover:bg-rose-50 rounded-[4px] transition-colors"
                                                title="Hapus Mobil Tangki"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TankTruckTable;
