import React from "react";
import { Link } from "@tanstack/react-router";
import { Apar } from "@/types/api";
import {
    FireIcon,
    MapPinIcon,
    TruckIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ExclamationTriangleIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { getAparStatusConfig, getLocationTypeConfig } from "@/utils/statusUtils";

interface AparTableProps {
    apars: Apar[];
    bulkDeleteMode: boolean;
    selectedAparIds: number[];
    onToggleSelectApar: (id: number) => void;
    onToggleSelectAll: () => void;
    onDelete: (id: number, serialNumber: string) => void;
    userRole?: string;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
    deletingId?: number | null;
    isBulkDeleting?: boolean;
}

export const AparTable: React.FC<AparTableProps> = ({
    apars,
    bulkDeleteMode,
    selectedAparIds,
    onToggleSelectApar,
    onToggleSelectAll,
    onDelete,
    userRole,
    hasActiveFilters,
    onResetFilters,
    deletingId,
    isBulkDeleting = false,
}) => {
    const isAllSelected =
        apars.length > 0 && selectedAparIds.length === apars.length;

    return (
        <div className="bg-white border border-slate-200 rounded-[8px] shadow-sm overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
                <table
                    data-testid="apar-table"
                    className="min-w-full divide-y divide-slate-200 text-left"
                >
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                            {bulkDeleteMode && (
                                <th scope="col" className="px-4 py-3.5 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={onToggleSelectAll}
                                        disabled={isBulkDeleting}
                                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 disabled:opacity-50"
                                    />
                                </th>
                            )}
                            <th scope="col" className="px-5 py-3.5">
                                Identitas APAR
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                                Lokasi Penempatan
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                                Kapasitas
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                                Masa Berlaku
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
                        {apars.map((apar) => {
                            const isSelected = selectedAparIds.includes(apar.id);
                            const isRowDeleting = deletingId === apar.id;
                            const statusConfig = getAparStatusConfig(apar.status);
                            const locationConfig = getLocationTypeConfig(
                                apar.location_type
                            );
                            const isExpired =
                                apar.expired_at &&
                                new Date(apar.expired_at) < new Date();

                            return (
                                <tr
                                    key={apar.id}
                                    className={`transition-colors hover:bg-slate-50/80 ${
                                        isSelected ? "bg-rose-50/40" : ""
                                    } ${
                                        isRowDeleting
                                            ? "bg-rose-50/60 opacity-60 pointer-events-none"
                                            : ""
                                    }`}
                                >
                                    {bulkDeleteMode && (
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    onToggleSelectApar(apar.id)
                                                }
                                                disabled={isBulkDeleting || isRowDeleting}
                                                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 disabled:opacity-50"
                                            />
                                        </td>
                                    )}

                                    {/* Serial Number & Type */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-[6px] bg-red-50 border border-red-200 text-[#DA1212] flex items-center justify-center">
                                                <FireIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <Link
                                                    to="/apar/$id"
                                                    params={{ id: String(apar.id) }}
                                                    className="font-mono font-bold text-slate-900 hover:text-[#11468F] transition-colors tracking-wider"
                                                >
                                                    {apar.serial_number}
                                                </Link>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {apar.apar_type?.name || "APAR Standar"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Location */}
                                    <td className="px-5 py-4">
                                        <div className="text-xs font-semibold text-slate-900">
                                            {apar.location_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${locationConfig.color}`}
                                            >
                                                {apar.location_type === "mobile" ? (
                                                    <TruckIcon className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <MapPinIcon className="w-3 h-3 mr-1" />
                                                )}
                                                {locationConfig.text}
                                            </span>
                                            {apar.tank_truck && (
                                                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[3px] border border-slate-200">
                                                    {apar.tank_truck.plate_number}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Capacity */}
                                    <td className="px-5 py-4">
                                        <span className="font-mono text-xs font-bold text-slate-900">
                                            {apar.capacity}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-1">
                                            kg
                                        </span>
                                    </td>

                                    {/* Expiry Date */}
                                    <td className="px-5 py-4">
                                        {apar.expired_at ? (
                                            <div>
                                                <span
                                                    className={`text-xs font-mono font-semibold ${
                                                        isExpired
                                                            ? "text-rose-600 font-bold"
                                                            : "text-slate-800"
                                                    }`}
                                                >
                                                    {new Date(
                                                        apar.expired_at
                                                    ).toLocaleDateString("id-ID", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                                {isExpired && (
                                                    <div className="inline-flex items-center text-[10px] font-bold text-rose-600 mt-0.5">
                                                        <ExclamationTriangleIcon className="w-3 h-3 mr-0.5" />
                                                        Kadaluarsa
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">
                                                -
                                            </span>
                                        )}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-semibold border ${statusConfig.color}`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotColor}`}
                                            />
                                            {statusConfig.text}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 text-right">
                                        <div className="inline-flex items-center space-x-1">
                                            {/* Detail */}
                                            <Link
                                                to="/apar/$id"
                                                params={{ id: String(apar.id) }}
                                                className={`p-2 text-slate-500 hover:text-[#11468F] hover:bg-slate-100 rounded-[4px] transition-colors ${
                                                    isRowDeleting || isBulkDeleting
                                                        ? "pointer-events-none opacity-40"
                                                        : ""
                                                }`}
                                                title="Lihat Detail APAR"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </Link>

                                            {/* Edit */}
                                            {(userRole === "admin" ||
                                                userRole === "supervisor") && (
                                                <Link
                                                    to="/apar/$id/edit"
                                                    params={{ id: String(apar.id) }}
                                                    className={`p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-[4px] transition-colors ${
                                                        isRowDeleting || isBulkDeleting
                                                            ? "pointer-events-none opacity-40"
                                                            : ""
                                                    }`}
                                                    title="Edit APAR"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Link>
                                            )}

                                            {/* Delete */}
                                            {userRole === "admin" && (
                                                <button
                                                    type="button"
                                                    disabled={isRowDeleting || isBulkDeleting}
                                                    onClick={() =>
                                                        onDelete(
                                                            apar.id,
                                                            apar.serial_number
                                                        )
                                                    }
                                                    className="p-2 text-slate-500 hover:text-[#DA1212] hover:bg-rose-50 rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={
                                                        isRowDeleting
                                                            ? "Sedang Menghapus..."
                                                            : "Hapus APAR"
                                                    }
                                                >
                                                    {isRowDeleting ? (
                                                        <svg
                                                            className="animate-spin h-4 w-4 text-[#DA1212]"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <TrashIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty State when apars.length === 0 */}
            {apars.length === 0 && (
                <div
                    data-testid="empty-state"
                    className="text-center py-12 px-4"
                >
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <FireIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                        Tidak ada APAR ditemukan
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {hasActiveFilters
                            ? "Coba ubah filter pencarian Anda atau hapus filter yang ada."
                            : "Belum ada tabung APAR yang terdaftar dalam sistem operasional."}
                    </p>
                    {!hasActiveFilters &&
                        (userRole === "admin" || userRole === "supervisor") && (
                            <div className="mt-4">
                                <Link
                                    to="/apar/create"
                                    className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4 mr-1.5" />
                                    Tambah APAR Pertama
                                </Link>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

export default AparTable;
