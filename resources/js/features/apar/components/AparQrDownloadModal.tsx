import React, { useState, useMemo } from "react";
import { Apar } from "@/types/api";
import {
    XMarkIcon,
    DocumentArrowDownIcon,
    QrCodeIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    TruckIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface AparQrDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    filteredApars: Apar[];
    selectedApars: Apar[];
    setSelectedApars: React.Dispatch<React.SetStateAction<Apar[]>>;
    onDownload: (
        apars: Apar[],
        printFormat: "both" | "qr_only" | "serial_only"
    ) => void;
    downloading: boolean;
}

export const AparQrDownloadModal: React.FC<AparQrDownloadModalProps> = ({
    isOpen,
    onClose,
    filteredApars,
    selectedApars,
    setSelectedApars,
    onDownload,
    downloading,
}) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [locationFilter, setLocationFilter] = useState<"all" | "statis" | "mobile">("all");
    const [printFormat, setPrintFormat] = useState<"both" | "qr_only" | "serial_only">("both");

    // Reset filters when modal closes
    const handleClose = () => {
        setSearchQuery("");
        setLocationFilter("all");
        onClose();
    };

    // Calculate count for filter badges
    const statisCount = useMemo(
        () => filteredApars.filter((a) => a.location_type === "statis").length,
        [filteredApars]
    );
    const mobileCount = useMemo(
        () => filteredApars.filter((a) => a.location_type === "mobile" || Boolean(a.tank_truck)).length,
        [filteredApars]
    );

    // Filter APARs based on search input & location pill
    const displayedApars = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return filteredApars.filter((apar) => {
            const matchesSearch =
                !query ||
                apar.serial_number?.toLowerCase().includes(query) ||
                apar.location_name?.toLowerCase().includes(query) ||
                apar.tank_truck?.plate_number?.toLowerCase().includes(query) ||
                apar.apar_type?.name?.toLowerCase().includes(query) ||
                apar.qr_code?.toLowerCase().includes(query);

            const isMobile = apar.location_type === "mobile" || Boolean(apar.tank_truck);
            const matchesLocation =
                locationFilter === "all" ||
                (locationFilter === "mobile" ? isMobile : apar.location_type === "statis");

            return matchesSearch && matchesLocation;
        });
    }, [filteredApars, searchQuery, locationFilter]);

    if (!isOpen) return null;

    // Check if all currently displayed items are selected
    const isAllDisplayedSelected =
        displayedApars.length > 0 &&
        displayedApars.every((apar) => selectedApars.some((a) => a.id === apar.id));

    // Handle toggle select all visible items
    const handleToggleAllDisplayed = (checked: boolean) => {
        if (checked) {
            setSelectedApars((prev) => {
                const newSelected = [...prev];
                for (const apar of displayedApars) {
                    if (!newSelected.some((a) => a.id === apar.id)) {
                        newSelected.push(apar);
                    }
                }
                return newSelected;
            });
        } else {
            const displayedIds = new Set(displayedApars.map((a) => a.id));
            setSelectedApars((prev) => prev.filter((a) => !displayedIds.has(a.id)));
        }
    };

    const handleToggleSingle = (apar: Apar, checked: boolean) => {
        if (checked) {
            setSelectedApars((prev) => [...prev, apar]);
        } else {
            setSelectedApars((prev) => prev.filter((a) => a.id !== apar.id));
        }
    };

    const handleClearAllSelected = () => {
        setSelectedApars([]);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-[8px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#041562] text-white">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 bg-white/10 rounded-[6px] flex-shrink-0">
                            <QrCodeIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold tracking-wide truncate">
                                Unduh QR Code APAR
                            </h3>
                            <p className="text-xs text-slate-300 truncate">
                                Pilih tabung APAR yang ingin dicetak label QR-nya
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 text-slate-300 hover:text-white rounded-[4px] hover:bg-white/10 transition-colors flex-shrink-0 ml-2"
                        aria-label="Tutup Modal"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-9 py-2 sm:py-2.5 min-h-[44px] text-xs sm:text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all placeholder:text-slate-400"
                            placeholder="Cari nomor seri, nama lokasi, nopol tangki..."
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                aria-label="Hapus kata kunci pencarian"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills (Semua / Statis / Mobil Tangki) */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => setLocationFilter("all")}
                            className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                locationFilter === "all"
                                    ? "bg-[#041562] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Semua ({filteredApars.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocationFilter("statis")}
                            className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                locationFilter === "statis"
                                    ? "bg-[#041562] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            Statis ({statisCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocationFilter("mobile")}
                            className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                locationFilter === "mobile"
                                    ? "bg-[#041562] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            <TruckIcon className="w-3 h-3 mr-1" />
                            Mobil Tangki ({mobileCount})
                        </button>
                    </div>

                    {/* Print Format Selector */}
                    <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-3 space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            Pilih Format Label Cetak PDF
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setPrintFormat("both")}
                                className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer ${
                                    printFormat === "both"
                                        ? "bg-white border-[#11468F] ring-2 ring-[#11468F]/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <QrCodeIcon className="h-4 w-4 text-[#11468F]" />
                                    <span className="text-xs font-bold text-slate-900">Unduh Kombinasi</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Bagian kartu QR selesai dahulu, disusul bagian nomor seri (4 per baris)
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPrintFormat("qr_only")}
                                className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer ${
                                    printFormat === "qr_only"
                                        ? "bg-white border-[#11468F] ring-2 ring-[#11468F]/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <QrCodeIcon className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-slate-900">Kartu QR Code</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Menampilkan Kode QR beserta nomor serinya bersamaan (4 per baris)
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPrintFormat("serial_only")}
                                className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer ${
                                    printFormat === "serial_only"
                                        ? "bg-white border-[#11468F] ring-2 ring-[#11468F]/20 shadow-xs"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <DocumentTextIcon className="h-4 w-4 text-[#041562]" />
                                    <span className="text-xs font-bold text-slate-900">Label Nomor Seri</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                    Label strip nomor seri polos untuk bodi/braket (4 per baris)
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Select All & Selection Counter Bar */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 pt-1 gap-2">
                        <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isAllDisplayedSelected}
                                onChange={(e) => handleToggleAllDisplayed(e.target.checked)}
                                disabled={displayedApars.length === 0}
                                className="h-4 w-4 rounded border-slate-300 text-[#11468F] focus:ring-[#11468F] cursor-pointer"
                            />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                {searchQuery || locationFilter !== "all"
                                    ? `Pilih Semua Hasil (${displayedApars.length} APAR)`
                                    : `Pilih Semua (${filteredApars.length} APAR)`}
                            </span>
                        </label>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#11468F] bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-100">
                                {selectedApars.length} dipilih
                            </span>
                            {selectedApars.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAllSelected}
                                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List APAR */}
                    <div className="max-h-64 sm:max-h-72 overflow-y-auto border border-slate-200 rounded-[6px] divide-y divide-slate-100 bg-slate-50/50 p-1">
                        {displayedApars.length === 0 ? (
                            <div className="p-6 text-center space-y-2">
                                <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-slate-300" />
                                <p className="text-xs font-semibold text-slate-700">
                                    Tidak ada tabung APAR yang cocok
                                    {searchQuery ? ` dengan "${searchQuery}"` : ""}.
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Coba ubah kata kunci pencarian atau ganti filter kategori.
                                </p>
                                {(searchQuery || locationFilter !== "all") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setLocationFilter("all");
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 min-h-[36px] text-xs font-bold text-[#11468F] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[6px] transition-colors cursor-pointer"
                                    >
                                        Reset Pencarian & Filter
                                    </button>
                                )}
                            </div>
                        ) : (
                            displayedApars.map((apar) => {
                                const isChecked = selectedApars.some((a) => a.id === apar.id);
                                return (
                                    <label
                                        key={apar.id}
                                        className={`flex items-center justify-between p-2.5 rounded-[4px] cursor-pointer transition-colors ${
                                            isChecked
                                                ? "bg-blue-50/80 border border-blue-200"
                                                : "hover:bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) =>
                                                    handleToggleSingle(apar, e.target.checked)
                                                }
                                                className="h-4 w-4 rounded border-slate-300 text-[#11468F] focus:ring-[#11468F] cursor-pointer flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold font-mono text-slate-900 truncate">
                                                    {apar.serial_number}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    {apar.location_name} &bull; {apar.capacity} kg
                                                    {apar.tank_truck && (
                                                        <span className="font-mono text-slate-700 ml-1">
                                                            ({apar.tank_truck.plate_number})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[3px] bg-white border border-slate-200 text-slate-700 flex-shrink-0 ml-2">
                                            {apar.location_type === "statis" ? "Statis" : "Mobil"}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={downloading}
                        className="px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-[6px] transition-colors text-center cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => onDownload(selectedApars, printFormat)}
                        disabled={selectedApars.length === 0 || downloading}
                        className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#041562] hover:bg-[#11468F] disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] shadow-sm transition-colors text-center cursor-pointer"
                    >
                        {downloading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                                Menyiapkan PDF...
                            </>
                        ) : (
                            <>
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                Unduh PDF ({selectedApars.length} APAR)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AparQrDownloadModal;
