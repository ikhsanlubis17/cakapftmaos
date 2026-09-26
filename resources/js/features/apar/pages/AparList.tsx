import React, { useState, Fragment, useMemo } from "react";
import { Apar } from "@/types/api";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    FireIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    DocumentArrowDownIcon,
    QrCodeIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AparFilterBar from "../components/AparFilterBar";
import AparTable from "../components/AparTable";
import AparQrDownloadModal from "../components/AparQrDownloadModal";

export const AparList: React.FC = () => {
    const { user, apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const queryClient = useQueryClient();

    // Filters state
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");

    // Bulk selection & deletion
    const [selectedApars, setSelectedApars] = useState<number[]>([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // QR Download modal
    const [showQrDownloadModal, setShowQrDownloadModal] = useState<boolean>(false);
    const [downloadingQr, setDownloadingQr] = useState<boolean>(false);
    const [qrDownloadApars, setQrDownloadApars] = useState<Apar[]>([]);

    // Query: fetch APAR list
    const {
        data: apars = [],
        isLoading,
        isError,
    } = useQuery<Apar[], Error>({
        queryKey: ["apars"],
        queryFn: async () => {
            const response = await apiClient.get("/api/apar");
            return response.data.data ?? response.data;
        },
        staleTime: 60 * 1000,
    });

    // Client-side filtering
    const filteredApars = useMemo(() => {
        return apars.filter((apar) => {
            const matchesSearch =
                !searchTerm ||
                apar.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apar.location_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || apar.status === statusFilter;
            const matchesLocation =
                locationFilter === "all" || apar.location_type === locationFilter;

            return matchesSearch && matchesStatus && matchesLocation;
        });
    }, [apars, searchTerm, statusFilter, locationFilter]);

    const hasActiveFilters = Boolean(
        searchTerm || statusFilter !== "all" || locationFilter !== "all"
    );

    const handleResetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setLocationFilter("all");
    };

    // Bulk delete selection toggles
    const handleToggleSelectApar = (id: number) => {
        setSelectedApars((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedApars.length === filteredApars.length) {
            setSelectedApars([]);
        } else {
            setSelectedApars(filteredApars.map((a) => a.id));
        }
    };

    // Mutations
    const deleteMutation = useMutation<void, any, number>({
        mutationFn: async (aparId: number) => {
            await apiClient.delete(`/api/apar/${aparId}`);
        },
        onMutate: async (aparId: number) => {
            // Cancel outgoing refetches agar tidak menimpa optimistic update
            await queryClient.cancelQueries({ queryKey: ["apars"] });
            const previousApars = queryClient.getQueryData<Apar[]>(["apars"]);
            // Optimistic update: langsung hapus APAR dari cache tampilan
            queryClient.setQueryData<Apar[]>(["apars"], (old) =>
                old ? old.filter((a) => a.id !== aparId) : []
            );
            return { previousApars };
        },
        onError: (err, aparId, context: any) => {
            if (context?.previousApars) {
                queryClient.setQueryData(["apars"], context.previousApars);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["apars"] });
        },
    });

    const bulkDeleteMutation = useMutation<any, any, number[]>({
        mutationFn: async (ids: number[]) => {
            const response = await apiClient.post("/api/apar/bulk-delete", { ids });
            return response.data;
        },
        onMutate: async (ids: number[]) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["apars"] });
            const previousApars = queryClient.getQueryData<Apar[]>(["apars"]);
            // Optimistic update: langsung kosongkan tabung terpilih dari cache tampilan
            queryClient.setQueryData<Apar[]>(["apars"], (old) =>
                old ? old.filter((a) => !ids.includes(a.id)) : []
            );
            return { previousApars };
        },
        onError: (err, ids, context: any) => {
            if (context?.previousApars) {
                queryClient.setQueryData(["apars"], context.previousApars);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["apars"] });
        },
    });

    const handleDelete = async (aparId: number, serialNumber: string) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus APAR",
            message: `Apakah Anda yakin ingin menghapus APAR ${serialNumber}? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            setDeletingId(aparId);
            try {
                await deleteMutation.mutateAsync(aparId);
                showSuccess(`APAR ${serialNumber} berhasil dihapus`);
            } catch (error: any) {
                console.error("Gagal menghapus APAR:", error);
                showError(
                    error?.response?.data?.message || "Gagal menghapus APAR. Silakan coba lagi."
                );
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedApars.length === 0) {
            showError("Pilih APAR yang akan dihapus terlebih dahulu");
            return;
        }

        const countToDelete = selectedApars.length;
        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${countToDelete} APAR sekaligus? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            setDeleting(true);
            try {
                await bulkDeleteMutation.mutateAsync(selectedApars);
                showSuccess(`${countToDelete} APAR berhasil dihapus.`);
                setSelectedApars([]);
                setBulkDeleteMode(false);
            } catch (error: any) {
                console.error("Gagal menghapus APAR massal:", error);
                showError(
                    error?.response?.data?.message || "Gagal menghapus APAR terpilih."
                );
            } finally {
                setDeleting(false);
            }
        }
    };

    // QR Download action
    const handleOpenQrModal = () => {
        setQrDownloadApars(filteredApars);
        setShowQrDownloadModal(true);
    };

    const handleDownloadQrPdf = async (
        aparsToDownload: Apar[],
        printFormat: "both" | "qr_only" | "serial_only" = "both"
    ) => {
        setDownloadingQr(true);
        try {
            const pdfPayload = {
                title: "Label & QR Code APAR - CAKAP FT MAOS",
                apars: aparsToDownload,
                print_format: printFormat,
                generatedAt: new Date().toLocaleString("id-ID"),
                totalApars: aparsToDownload.length,
            };

            const response = await apiClient.post(
                "/api/apar/download-qr-pdf",
                pdfPayload,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            const filenamePrefix =
                printFormat === "qr_only"
                    ? "qr-code-apar"
                    : printFormat === "serial_only"
                    ? "nomor-seri-apar"
                    : "label-apar";
            link.setAttribute(
                "download",
                `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showSuccess("Dokumen label APAR berhasil diunduh!");
            setShowQrDownloadModal(false);
        } catch (error) {
            console.error("Error downloading QR PDF:", error);
            showError("Gagal mengunduh dokumen label APAR.");
        } finally {
            setDownloadingQr(false);
        }
    };

    return (
        <Fragment>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                            <FireIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Manajemen APAR
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Kelola seluruh data master tabung pemadam api, titik koordinat, dan status kesiapan
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Download QR Button */}
                        {(user?.role === "admin" || user?.role === "supervisor") && (
                            <button
                                type="button"
                                onClick={handleOpenQrModal}
                                className="inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-[#11468F] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-[6px] shadow-xs transition-colors"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                Unduh QR Code APAR
                            </button>
                        )}

                        {/* Bulk Delete Mode Toggle */}
                        {user?.role === "admin" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkDeleteMode(!bulkDeleteMode);
                                    if (bulkDeleteMode) setSelectedApars([]);
                                }}
                                className={`inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded-[6px] transition-colors shadow-xs ${
                                    bulkDeleteMode
                                        ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                {bulkDeleteMode ? (
                                    <>
                                        <XMarkIcon className="h-4 w-4 mr-2" />
                                        Keluar Hapus Massal
                                    </>
                                ) : (
                                    <>
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Hapus Massal
                                    </>
                                )}
                            </button>
                        )}

                        {/* Scan QR for Teknisi */}
                        {user?.role === "teknisi" && (
                            <Link
                                to="/scan"
                                className="inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                            >
                                <QrCodeIcon className="h-4 w-4 mr-2" />
                                Scan QR & Inspeksi
                            </Link>
                        )}

                        {/* Add New APAR Button */}
                        {(user?.role === "admin" || user?.role === "supervisor") && (
                            <Link
                                to="/apar/create"
                                data-testid="add-apar-btn"
                                className="inline-flex items-center px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-1.5" />
                                Tambah APAR
                            </Link>
                        )}
                    </div>
                </div>

                {/* Bulk Delete Active Bar */}
                {bulkDeleteMode && (
                    <div className="bg-rose-50 border border-rose-200 rounded-[8px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <div className="text-xs font-bold text-rose-800">
                            Mode Hapus Massal Aktif: {selectedApars.length} tabung dipilih dari {filteredApars.length} total.
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={selectedApars.length === 0 || deleting}
                                className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] transition-colors shadow-xs"
                            >
                                {deleting ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                        Menghapus...
                                    </>
                                ) : (
                                    `Hapus (${selectedApars.length}) APAR`
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkDeleteMode(false);
                                    setSelectedApars([]);
                                }}
                                disabled={deleting}
                                className="px-3 py-2 min-h-[44px] text-xs font-semibold text-rose-700 hover:bg-rose-100 rounded-[6px] transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Filter Section */}
                <AparFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    locationFilter={locationFilter}
                    setLocationFilter={setLocationFilter}
                    onResetFilters={handleResetFilters}
                    hasActiveFilters={hasActiveFilters}
                    totalResults={filteredApars.length}
                />

                {/* Table Section */}
                {isLoading ? (
                    <div className="bg-white border border-slate-200 rounded-[8px] p-12 text-center shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Memuat data APAR FT Maos...
                        </p>
                    </div>
                ) : (
                    <AparTable
                        apars={filteredApars}
                        bulkDeleteMode={bulkDeleteMode}
                        selectedAparIds={selectedApars}
                        onToggleSelectApar={handleToggleSelectApar}
                        onToggleSelectAll={handleToggleSelectAll}
                        onDelete={handleDelete}
                        userRole={user?.role}
                        hasActiveFilters={hasActiveFilters}
                        onResetFilters={handleResetFilters}
                        deletingId={deletingId}
                        isBulkDeleting={deleting}
                    />
                )}
            </div>

            {/* QR Download Modal */}
            <AparQrDownloadModal
                isOpen={showQrDownloadModal}
                onClose={() => setShowQrDownloadModal(false)}
                filteredApars={filteredApars}
                selectedApars={qrDownloadApars}
                setSelectedApars={setQrDownloadApars}
                onDownload={handleDownloadQrPdf}
                downloading={downloadingQr}
            />

            {/* Bulk Deleting Modal Overlay */}
            {deleting && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center">
                        <div
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                            aria-hidden="true"
                        />
                        <div className="relative bg-white rounded-lg shadow-2xl max-w-sm w-full mx-auto p-6 border border-slate-200 text-center transform transition-all z-10 space-y-4">
                            <div className="relative mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-rose-50 border border-rose-200">
                                <svg
                                    className="animate-spin h-8 w-8 text-[#DA1212]"
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
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight">
                                    Menghapus Data APAR
                                </h3>
                                <p className="text-xs font-semibold text-rose-600 mt-1 uppercase tracking-wider font-mono">
                                    {selectedApars.length} Tabung Diproses
                                </p>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                    Sistem sedang memproses penghapusan data secara aman dalam transaksi database. Mohon jangan menutup halaman ini...
                                </p>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-rose-600 h-1.5 rounded-full animate-pulse w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isOpen}
                onClose={close}
                onConfirm={config.onConfirm}
                title={config.title}
                message={config.message}
                type={config.type}
                confirmText={config.confirmText}
                cancelText={config.cancelText}
                confirmButtonColor={config.confirmButtonColor}
            />
        </Fragment>
    );
};

export default AparList;
