import React, { useState, useEffect, Fragment } from "react";
import {
    Link,
    useParams,
    useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    UserIcon,
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

const UserDetail = () => {
    const { id } = useParams({ strict: false });
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const {
        data: user,
        isLoading: loading,
        isError,
    } = useQuery({
        queryKey: ["users", id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/users/${id}`);
            return res.data;
        },
        enabled: !!id,
        throwOnError: false,
    });

    useEffect(() => {
        if (isError) {
            showError("Gagal memuat data pengguna");
        }
    }, [isError]);

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus Pengguna",
            message: `Apakah Anda yakin ingin menghapus pengguna ${user.name}? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/api/users/${id}`);
                showSuccess("Pengguna berhasil dihapus");
                queryClient.invalidateQueries({ queryKey: ["users"] });
                navigate({ to: "/users" });
            } catch (error) {
                console.error("Error deleting user:", error);
                showError(
                    error?.response?.data?.message || "Gagal menghapus pengguna"
                );
            }
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case "admin":
                return ShieldCheckIcon;
            case "supervisor":
                return UserGroupIcon;
            case "teknisi":
                return UserIcon;
            default:
                return UserIcon;
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case "admin":
                return "Administrator";
            case "supervisor":
                return "Supervisor";
            case "teknisi":
                return "Teknisi";
            default:
                return role;
        }
    };

    const getRoleBadgeClasses = (role) => {
        switch (role) {
            case "admin":
                return "bg-[#041562] text-white";
            case "supervisor":
                return "bg-[#11468F] text-white";
            case "teknisi":
                return "bg-[#EEEEEE] text-[#041562]";
            default:
                return "bg-[#EEEEEE] text-slate-700";
        }
    };

    const getStatusColor = (isActive) => {
        return isActive
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-red-50 text-[#DA1212] border border-red-200";
    };

    const getStatusText = (isActive) => {
        return isActive ? "Aktif" : "Nonaktif";
    };

    const getStatusIcon = (isActive) => {
        return isActive ? CheckCircleIcon : XCircleIcon;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64 py-12">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-[#11468F] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-16 bg-white rounded-[6px] border border-[#EEEEEE] shadow-sm">
                <h3 className="text-base font-bold text-[#041562] mb-2">
                    Pengguna tidak ditemukan
                </h3>
                <Link
                    to="/users"
                    className="inline-flex items-center px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold text-xs uppercase tracking-wider rounded-[6px] shadow-sm transition-all"
                >
                    Kembali ke Daftar Pengguna
                </Link>
            </div>
        );
    }

    const RoleIcon = getRoleIcon(user.role);
    const StatusIcon = getStatusIcon(user.is_active);

    return (
        <Fragment>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <Link
                            to="/users"
                            className="mr-4 p-2 rounded-[6px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-[#041562] tracking-tight">
                                Detail Pengguna
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Informasi lengkap pengguna {user.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <Link
                            to={`/users/${id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold text-xs uppercase tracking-wider rounded-[6px] shadow-sm transition-all"
                        >
                            <PencilIcon className="h-4 w-4 mr-1.5" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center px-4 py-2 bg-[#DA1212] hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-[6px] shadow-sm transition-all"
                        >
                            <TrashIcon className="h-4 w-4 mr-1.5" />
                            Hapus
                        </button>
                    </div>
                </div>

                {/* User Information */}
                <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <div className="flex items-center">
                            <div className="h-16 w-16 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="ml-5">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {user.name}
                                </h3>
                                <div className="mt-1.5 flex items-center space-x-2">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] text-xs font-semibold tracking-wider uppercase ${getRoleBadgeClasses(
                                            user.role
                                        )}`}
                                    >
                                        <RoleIcon className="h-3.5 w-3.5 mr-1" />
                                        {getRoleText(user.role)}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] text-xs font-semibold ${getStatusColor(
                                            user.is_active
                                        )}`}
                                    >
                                        <StatusIcon className="h-3.5 w-3.5 mr-1" />
                                        {getStatusText(user.is_active)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <dl className="divide-y divide-slate-100">
                            <div className="bg-slate-50/50 px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                                    <EnvelopeIcon className="h-4 w-4 mr-2 text-slate-400" />
                                    Email
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0 sm:col-span-2">
                                    {user.email}
                                </dd>
                            </div>
                            <div className="bg-white px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                                    <PhoneIcon className="h-4 w-4 mr-2 text-slate-400" />
                                    Nomor Telepon
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0 sm:col-span-2">
                                    {user.phone || "Tidak ada"}
                                </dd>
                            </div>
                            <div className="bg-slate-50/50 px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                                    Tanggal Bergabung
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0 sm:col-span-2">
                                    {new Date(
                                        user.created_at
                                    ).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </dd>
                            </div>
                            <div className="bg-white px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    ID Pengguna
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0 sm:col-span-2">
                                    #{user.id}
                                </dd>
                            </div>
                            <div className="bg-slate-50/50 px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Terakhir Diperbarui
                                </dt>
                                <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0 sm:col-span-2">
                                    {new Date(
                                        user.updated_at
                                    ).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Role Information */}
                <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] p-6">
                    <h3 className="text-base font-bold text-[#041562] tracking-tight mb-3">
                        Informasi Peran & Hak Akses
                    </h3>
                    <div className="flex items-center">
                        <div className="p-3 bg-[#041562] text-white rounded-[6px] mr-4 shadow-sm">
                            <RoleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {getRoleText(user.role)}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {user.role === "admin" &&
                                    "Memiliki akses penuh ke semua modul sistem dan konfigurasi."}
                                {user.role === "supervisor" &&
                                    "Dapat mengelola APAR, mobil tangki, menjadwalkan inspeksi, dan meninjau laporan."}
                                {user.role === "teknisi" &&
                                    "Dapat melaksanakan jadwal inspeksi dan melaporkan temuan kondisi APAR."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Status */}
                <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight mb-3">
                        Status Akun
                    </h3>
                    <div className="flex items-center">
                        <div className={`p-3 rounded-[6px] mr-4 shadow-sm ${
                            user.is_active 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}>
                            <StatusIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {getStatusText(user.is_active)}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {user.is_active
                                    ? "Pengguna terverifikasi dan dapat login ke aplikasi."
                                    : "Pengguna saat ini dinonaktifkan dan diblokir dari login."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                {...config}
                isOpen={isOpen}
                onClose={config.onCancel || close}
                onConfirm={config.onConfirm}
            />
        </Fragment>
    );
};

export default UserDetail;
