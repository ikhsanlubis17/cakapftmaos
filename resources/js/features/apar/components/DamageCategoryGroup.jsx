import React, { useState } from "react";
import {
    PencilIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon,
    PlusIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "@heroicons/react/24/outline";

export const DamageCategoryGroup = ({
    type,
    categories,
    bulkDeleteMode,
    selectedCategories,
    onSelectCategory,
    onEdit,
    onDelete,
    onToggleActive,
    onAddForType,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const getMediaTypeTheme = (t) => {
        switch (t?.toLowerCase()) {
            case "co2":
                return {
                    badgeBg: "bg-slate-900 text-white",
                    accentBg: "bg-slate-100 text-slate-800 border-slate-300",
                    border: "border-slate-200",
                    label: "CO2 (Carbon Dioxide)",
                };
            case "powder":
                return {
                    badgeBg: "bg-[#041562] text-white",
                    accentBg: "bg-blue-50 text-[#11468F] border-blue-200",
                    border: "border-blue-100",
                    label: "POWDER (Dry Chemical)",
                };
            case "foam":
                return {
                    badgeBg: "bg-amber-700 text-white",
                    accentBg: "bg-amber-50 text-amber-800 border-amber-200",
                    border: "border-amber-100",
                    label: "FOAM (AFFF Liquid)",
                };
            case "liquid":
                return {
                    badgeBg: "bg-cyan-700 text-white",
                    accentBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
                    border: "border-cyan-100",
                    label: "LIQUID (Water / Chemical)",
                };
            default:
                return {
                    badgeBg: "bg-[#11468F] text-white",
                    accentBg: "bg-slate-50 text-slate-800 border-slate-200",
                    border: "border-slate-200",
                    label: t.toUpperCase(),
                };
        }
    };

    const getSeverityBadge = (severity) => {
        switch (severity?.toLowerCase()) {
            case "critical":
            case "kritis":
                return {
                    bg: "bg-rose-100 text-rose-800 border-rose-300",
                    label: "Kritis",
                    dot: "bg-rose-600",
                };
            case "high":
            case "tinggi":
                return {
                    bg: "bg-rose-50 text-rose-700 border-rose-200",
                    label: "Tinggi",
                    dot: "bg-rose-500",
                };
            case "medium":
            case "sedang":
                return {
                    bg: "bg-amber-50 text-amber-700 border-amber-200",
                    label: "Sedang",
                    dot: "bg-amber-500",
                };
            case "low":
            case "rendah":
                return {
                    bg: "bg-blue-50 text-blue-700 border-blue-200",
                    label: "Rendah",
                    dot: "bg-blue-500",
                };
            default:
                return {
                    bg: "bg-slate-100 text-slate-700 border-slate-200",
                    label: severity || "Standar",
                    dot: "bg-slate-400",
                };
        }
    };

    const theme = getMediaTypeTheme(type);
    const activeCount = categories.filter((c) => c.is_active).length;

    return (
        <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
            {/* Group Header */}
            <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title={isExpanded ? "Sembunyikan Kategori" : "Tampilkan Kategori"}
                    >
                        {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                            <ChevronDownIcon className="w-5 h-5" />
                        )}
                    </button>
                    <div
                        className={`w-9 h-9 rounded-[6px] ${theme.badgeBg} flex items-center justify-center font-mono font-bold text-xs shadow-xs tracking-wider`}
                    >
                        {type.toUpperCase().substring(0, 3)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                {theme.label}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-bold bg-white text-slate-700 border border-slate-300">
                                {categories.length} Item
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Status: <span className="font-semibold text-emerald-700">{activeCount} Aktif</span> dari {categories.length} total opsi temuan
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 pl-9 sm:pl-0">
                    <button
                        type="button"
                        onClick={() => onAddForType(type)}
                        className="inline-flex items-center px-3 py-2 min-h-[38px] text-xs font-bold uppercase tracking-wider text-[#11468F] bg-white hover:bg-blue-50 border border-blue-200 rounded-[6px] transition-colors shadow-2xs"
                    >
                        <PlusIcon className="w-3.5 h-3.5 mr-1" />
                        Tambah di {type.toUpperCase()}
                    </button>
                </div>
            </div>

            {/* Collapsible Content Grid */}
            {isExpanded && (
                <div className="p-4 sm:p-5 bg-slate-50/40">
                    {categories.length === 0 ? (
                        <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-[6px]">
                            <p className="text-xs text-slate-500">
                                Belum ada temuan kerusakan terdaftar untuk tipe media ini.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5">
                            {categories.map((cat) => {
                                const isSelected = selectedCategories.includes(cat.id);
                                const sev = getSeverityBadge(cat.severity);

                                return (
                                    <div
                                        key={cat.id}
                                        className={`bg-white rounded-[8px] border p-4.5 flex flex-col justify-between transition-all duration-150 shadow-2xs hover:shadow-sm ${
                                            isSelected
                                                ? "border-rose-400 bg-rose-50/30 ring-1 ring-rose-400"
                                                : cat.is_active
                                                ? "border-slate-200 hover:border-slate-300"
                                                : "border-slate-200 bg-slate-50/60 opacity-80"
                                        }`}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-2.5 mb-2.5">
                                            <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                                                {bulkDeleteMode && (
                                                    <div className="pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => onSelectCategory(cat.id)}
                                                            className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                                                        {cat.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* Action Icon Buttons */}
                                            <div className="flex items-center space-x-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleActive(cat)}
                                                    className={`p-1.5 rounded-[4px] border transition-colors ${
                                                        cat.is_active
                                                            ? "text-emerald-700 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100"
                                                            : "text-slate-400 bg-slate-100 border-slate-200 hover:bg-slate-200"
                                                    }`}
                                                    title={cat.is_active ? "Nonaktifkan Kategori" : "Aktifkan Kategori"}
                                                >
                                                    {cat.is_active ? (
                                                        <EyeIcon className="w-4 h-4" />
                                                    ) : (
                                                        <EyeSlashIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(cat)}
                                                    className="p-1.5 text-slate-600 hover:text-[#11468F] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-[4px] transition-colors"
                                                    title="Edit Kategori"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDelete(cat.id, cat.name)}
                                                    className="p-1.5 text-slate-600 hover:text-[#DA1212] bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-[4px] transition-colors"
                                                    title="Hapus Kategori"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-slate-600 leading-relaxed mb-4 min-h-[32px]">
                                            {cat.description || "Tidak ada deskripsi detail untuk kategori ini."}
                                        </p>

                                        {/* Card Footer Badges */}
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${sev.bg}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sev.dot}`}></span>
                                                    {sev.label}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onToggleActive(cat)}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                                                    cat.is_active
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                                }`}
                                            >
                                                {cat.is_active ? "● Aktif" : "○ Nonaktif"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DamageCategoryGroup;
