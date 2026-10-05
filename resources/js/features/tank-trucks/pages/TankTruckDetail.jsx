import React, { useState } from "react";
import { useNavigate, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
    TruckIcon,
    ArrowLeftIcon,
    FireIcon,
    UserIcon,
    PhoneIcon,
    PlusIcon,
    TrashIcon,
    EyeIcon,
    PencilIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
    getAparStatusConfig,
    getAparExpiryConfig,
    getTruckAparPosition,
    getTruckComplianceSummary,
} from "@/utils/statusUtils";
import { formatDate } from "@/utils/dateUtils";
import AssignAparModal from "../components/AssignAparModal";

export const TankTruckDetail = () => {
    const { id } = useParams({ from: "/authenticated/tank-trucks/$id" });
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAparId, setSelectedAparId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [assigning, setAssigning] = useState(false);

    const { data: truckResponse, isLoading } = useQuery({
        queryKey: ["tank-truck", id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/tank-trucks/${id}`);
            return res.data || res;
        },
        enabled: Boolean(id),
        staleTime: 60 * 1000,
    });

    const { data: aparsResponse } = useQuery({
        queryKey: ["apars"],
        queryFn: async () => {
            const res = await apiClient.get("/api/apar");
            return res.data || res;
        },
        staleTime: 60 * 1000,
    });

    const tankTruck = truckResponse?.data || truckResponse || null;
    const apars = tankTruck?.apars || [];
    const compliance = getTruckComplianceSummary(apars);
    const allApars = aparsResponse?.data || aparsResponse || [];
    const availableApars = allApars.filter(
        (apar) =>
            apar.location_type === "mobile" &&
            (!apar.tank_truck_id || apar.tank_truck_id == id)
    );

    const assignMutation = useMutation({
        mutationFn: (payload) =>
            apiClient.post(`/api/tank-trucks/${id}/assign-apar`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-truck", id] });
            queryClient.invalidateQueries({ queryKey: ["apars"] });
            showSuccess("APAR berhasil ditugaskan ke mobil tangki!");
            setShowAssignModal(false);
            setSelectedAparId("");
            setSearchTerm("");
        },
        onError: (err) => {
            console.error("Error assigning APAR:", err);
            showError(
                err?.response?.data?.message || "Gagal menugaskan APAR ke armada ini."
            );
        },
    });

    const unassignMutation = useMutation({
        mutationFn: (aparId) =>
            apiClient.post(`/api/tank-trucks/${id}/remove-apar`, { apar_id: aparId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-truck", id] });
            queryClient.invalidateQueries({ queryKey: ["apars"] });
            showSuccess("APAR berhasil dilepas dari mobil tangki.");
        },
        onError: () => {
            showError("Gagal melepas APAR.");
        },
    });

    const handleAssignApar = async () => {
        if (!selectedAparId) {
            showError("Pilih APAR terlebih dahulu.");
            return;
        }

        setAssigning(true);
        try {
            await assignMutation.mutateAsync({ apar_id: selectedAparId });
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassignApar = async (aparId, serialNumber) => {
        const confirmed = await confirm({
            title: "Lepas APAR dari Armada",
            message: `Apakah Anda yakin ingin melepas tabung APAR ${serialNumber} dari mobil tangki ini?`,
            type: "warning",
            confirmText: "Ya, Lepas",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            await unassignMutation.mutateAsync(aparId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Memuat data mobil tangki...
                    </p>
                </div>
            </div>
        );
    }

    if (!tankTruck) {
        return (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-[8px] p-8">
                <TruckIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                <h3 className="text-base font-bold text-slate-800">
                    Mobil Tangki Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                    Data mobil tangki dengan ID {id} tidak ditemukan.
                </p>
                <Link
                    to="/tank-trucks"
                    className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] rounded-[6px]"
                >
                    Kembali ke Daftar
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                        <TruckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                                {tankTruck.plate_number}
                            </h1>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold border ${
                                    tankTruck.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                            >
                                {tankTruck.status === "active" ? "Aktif Beroperasi" : "Maintenance"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Detail armada mobil tangki dan tabung pemadam api terpasang
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        to="/tank-trucks/$id/edit"
                        params={{ id: String(tankTruck.id) }}
                        className="inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                    >
                        <PencilIcon className="w-4 h-4 mr-1.5" />
                        Edit Armada
                    </Link>
                    <Link
                        to="/tank-trucks"
                        className="inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] shadow-xs transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                        Kembali
                    </Link>
                </div>
            </div>

            {/* HSSE Safety & Compliance Banner */}
            <div
                className={`p-4 rounded-[8px] border shadow-xs flex items-start gap-3.5 ${
                    !compliance.isFitToWork
                        ? "bg-rose-50/80 border-rose-200 text-rose-900"
                        : compliance.warning > 0
                        ? "bg-amber-50/80 border-amber-200 text-amber-900"
                        : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                }`}
            >
                <div className="mt-0.5 shrink-0">
                    {!compliance.isFitToWork ? (
                        <ShieldExclamationIcon className="w-5 h-5 text-rose-600" />
                    ) : compliance.warning > 0 ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                    ) : (
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                    )}
                </div>
                <div className="flex-1 text-xs">
                    <div className="font-bold uppercase tracking-wider flex flex-wrap items-center gap-2">
                        <span>
                            {!compliance.isFitToWork
                                ? "Kelaikan HSSE: Perhatian Khusus (Not Fit to Work)"
                                : compliance.warning > 0
                                ? "Kelaikan HSSE: Peringatan Kedaluwarsa Segera"
                                : "Kelaikan HSSE: Memenuhi Syarat Operasi (Fit to Work)"}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${compliance.badge.color}`}
                        >
                            {compliance.badge.text}
                        </span>
                    </div>
                    <p className="mt-1 text-slate-700 leading-relaxed">
                        {!compliance.isFitToWork
                            ? `Armada ini memiliki ${compliance.expired} tabung APAR kedaluwarsa atau ${compliance.needsRepair} tabung yang memerlukan perbaikan. Harap lakukan penggantian dengan APAR Cadangan sebelum pengisian BBM.`
                            : compliance.warning > 0
                            ? `Terdapat ${compliance.warning} tabung APAR yang akan kedaluwarsa dalam 30 hari ke depan. Disarankan mempersiapkan tabung pengganti dari Buffer Stock FT Maos.`
                            : `Seluruh tabung pemadam api (${apars.length} unit) dalam kondisi aktif dan memenuhi regulasi keselamatan Objek Vital Nasional Pertamina.`}
                    </p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Truck Details */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                        Informasi Armada
                    </h3>
                    <dl className="space-y-3 text-xs">
                        <div>
                            <dt className="text-slate-500 font-semibold">Nomor Plat Mobil</dt>
                            <dd className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                                {tankTruck.plate_number}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 font-semibold">Pengemudi / Awak</dt>
                            <dd className="font-bold text-slate-900 mt-0.5 flex items-center">
                                <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {tankTruck.driver_name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 font-semibold">Nomor Telepon</dt>
                            <dd className="font-mono text-slate-800 mt-0.5 flex items-center">
                                <PhoneIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {tankTruck.driver_phone || "-"}
                            </dd>
                        </div>
                        {tankTruck.description && (
                            <div>
                                <dt className="text-slate-500 font-semibold">Deskripsi</dt>
                                <dd className="text-slate-700 mt-0.5 leading-relaxed">
                                    {tankTruck.description}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Attached APAR List */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                APAR Terpasang ({apars.length})
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Tabung pemadam api dan posisi slot pemasangan di armada
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAssignModal(true)}
                            className="inline-flex items-center px-3.5 py-1.5 min-h-[38px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                        >
                            <PlusIcon className="w-3.5 h-3.5 mr-1" />
                            Pasang APAR
                        </button>
                    </div>

                    {apars.length === 0 ? (
                        <div className="py-10 text-center">
                            <FireIcon className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                            <h4 className="text-xs font-bold text-slate-700">
                                Belum Ada APAR Terpasang
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Klik tombol "Pasang APAR" di atas untuk menugaskan tabung ke mobil tangki ini.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {apars.map((apar) => {
                                const statusConfig = getAparStatusConfig(apar.status);
                                const position = getTruckAparPosition(apar.serial_number);
                                const expiryConfig = getAparExpiryConfig(apar.expired_at);

                                return (
                                    <div
                                        key={apar.id}
                                        className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/80 transition-colors px-2 rounded-[6px]"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="w-9 h-9 rounded-[6px] bg-red-50 text-[#DA1212] border border-red-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                                <FireIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        to="/apar/$id"
                                                        params={{ id: String(apar.id) }}
                                                        className="font-mono font-bold text-sm text-slate-900 hover:text-[#11468F] transition-colors"
                                                    >
                                                        {apar.serial_number}
                                                    </Link>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${position.tagColor}`}
                                                    >
                                                        {position.slot} • {position.zone}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${statusConfig.color}`}
                                                    >
                                                        {statusConfig.text}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    <span>{apar.apar_type?.name || "Standar"} ({position.type})</span>
                                                    <span>&bull;</span>
                                                    <span>Kapasitas: {apar.capacity} {apar.apar_type?.name === 'foam' ? 'L' : 'kg'}</span>
                                                    <span>&bull;</span>
                                                    <span className={`font-semibold inline-flex items-center px-1.5 py-0.2 rounded text-[11px] border ${expiryConfig.color}`}>
                                                        Exp: {formatDate(apar.expired_at)} ({expiryConfig.shortText || expiryConfig.text})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1.5 self-end sm:self-center">
                                            <Link
                                                to="/apar/$id"
                                                params={{ id: String(apar.id) }}
                                                className="p-1.5 text-slate-500 hover:text-[#11468F] hover:bg-slate-100 rounded-[4px] transition-colors"
                                                title="Lihat Detail APAR"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUnassignApar(
                                                        apar.id,
                                                        apar.serial_number
                                                    )
                                                }
                                                className="p-1.5 text-slate-500 hover:text-[#DA1212] hover:bg-rose-50 rounded-[4px] transition-colors"
                                                title="Lepas dari Mobil Tangki"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AssignAparModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                availableApars={availableApars}
                selectedAparId={selectedAparId}
                setSelectedAparId={setSelectedAparId}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAssign={handleAssignApar}
                assigning={assigning}
                tankTruckId={id}
            />

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
        </div>
    );
};

export default TankTruckDetail;
