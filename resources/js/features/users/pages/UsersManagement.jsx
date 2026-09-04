import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatsCard from "@/components/common/StatsCard";
import FilterSection from "@/components/common/FilterSection";
import UsersTable from "@/features/users/components/UsersTable";
import UserModal from "@/features/users/components/UserModal";
import { PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const UsersManagement = () => {
    const { user, apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "teknisi",
        password: "",
        admin_password: "", // Added for admin confirmation
        is_active: true,
    });

    const {
        data: users = [],
        isLoading: loading,
        isError,
    } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await apiClient.get("/api/users");
            return res.data;
        },
        throwOnError: false,
    });

    useEffect(() => {
        if (isError) {
            setError("Gagal memuat data pengguna");
        }
    }, [isError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await apiClient.put(`/api/users/${editingUser.id}`, formData);
                showSuccess("Pengguna berhasil diperbarui");
            } else {
                await apiClient.post("/api/users", formData);
                showSuccess("Pengguna berhasil ditambahkan");
            }
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["users"] });
        } catch (error) {
            console.error("Error saving user:", error);
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const message = Object.values(validationErrors).flat().join('\n');
                showError(message || "Data yang dimasukkan tidak valid");
            } else {
                showError(error.response?.data?.message || "Gagal menyimpan data pengguna");
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            password: "",
            is_active: user.is_active,
        });
        setShowModal(true);
    };

    const handleDelete = async (userId) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus",
            message:
                "Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.",
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/api/users/${userId}`);
                showSuccess("Pengguna berhasil dihapus");
                queryClient.invalidateQueries({ queryKey: ["users"] });
            } catch (error) {
                console.error("Error deleting user:", error);
                showError("Gagal menghapus pengguna");
            }
        }
    };

    const handleUnblock = async (user) => {
        const confirmed = await confirm({
            title: "Konfirmasi Buka Blokir",
            message: `Apakah Anda yakin ingin membuka blokir pengguna ${user.name}?`,
            type: "info",
            confirmText: "Ya, Buka Blokir",
            cancelText: "Batal",
            confirmButtonColor: "purple",
        });

        if (confirmed) {
            try {
                await apiClient.post(`/api/users/${user.id}/unblock`);
                showSuccess("Blokir pengguna berhasil dibuka");
                queryClient.invalidateQueries({ queryKey: ["users"] });
            } catch (error) {
                console.error("Error unblocking user:", error);
                showError("Gagal membuka blokir pengguna");
            }
        }
    };

    const handleResendActivation = async (user) => {
        const confirmed = await confirm({
            title: "Kirim Ulang Aktivasi",
            message: `Kirim ulang email aktivasi untuk ${user.name}? Token baru akan berlaku selama 24 jam.`,
            type: "info",
            confirmText: "Kirim Email",
            cancelText: "Batal",
            confirmButtonColor: "blue",
        });

        if (confirmed) {
            try {
                // Using axios directly or apiClient
                await apiClient.post(`/api/users/${user.id}/resend-activation`);
                showSuccess("Email aktivasi berhasil dikirim ulang");
            } catch (error) {
                console.error("Error resending activation:", error);
                showError(error.response?.data?.message || "Gagal mengirim ulang aktivasi");
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            role: "teknisi",
            password: "",
            admin_password: "",
            is_active: true,
        });
    };

    const openCreateModal = () => {
        setEditingUser(null);
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        resetForm();
    };

    // Filter users based on search and filters
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus =
            statusFilter === "all" ||
            user.is_active === (statusFilter === "active");

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Calculate statistics
    const totalUsers = users.length;
    const teknisiCount = users.filter((u) => u.role === "teknisi").length;
    const supervisorCount = users.filter((u) => u.role === "supervisor").length;
    const activeCount = users.filter((u) => u.is_active).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#11468F] rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-sm font-semibold text-slate-600">
                        Memuat data pengguna...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4 bg-white p-8 rounded-[6px] border border-[#EEEEEE] shadow-sm">
                    <div className="bg-red-50 text-[#DA1212] rounded-[6px] p-3 w-14 h-14 mx-auto mb-4 flex items-center justify-center border border-red-200">
                        <svg
                            className="w-8 h-8 text-[#DA1212]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                        Terjadi Kesalahan
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={fetchUsers}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] p-6 lg:p-8 animate-fade-in-up">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#041562] text-white rounded-[6px] shadow-sm">
                                <UserGroupIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-[#041562] tracking-tight">
                                    Manajemen Pengguna
                                </h1>
                                <p className="text-slate-600 mt-1 text-sm">
                                    Kelola pengguna, penetapan peran teknisi dan supervisor
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Tambah Pengguna
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div
                    className="stats-grid animate-fade-in-up"
                    style={{ animationDelay: "0.1s" }}
                >
                    <StatsCard
                        icon={({ className }) => (
                            <svg
                                className={className}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
                            </svg>
                        )}
                        title="Total Pengguna"
                        value={totalUsers}
                        color="text-[#041562]"
                        bgColor="bg-[#EEEEEE]"
                        iconColor="text-[#041562]"
                    />

                    <StatsCard
                        icon={({ className }) => (
                            <svg
                                className={className}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        )}
                        title="Teknisi"
                        value={teknisiCount}
                        color="text-slate-900"
                        bgColor="bg-slate-100"
                        iconColor="text-slate-700"
                    />

                    <StatsCard
                        icon={({ className }) => (
                            <svg
                                className={className}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                        )}
                        title="Supervisor"
                        value={supervisorCount}
                        color="text-[#11468F]"
                        bgColor="bg-blue-50"
                        iconColor="text-[#11468F]"
                    />

                    <StatsCard
                        icon={({ className }) => (
                            <svg
                                className={className}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        )}
                        title="Aktif"
                        value={activeCount}
                        color="text-emerald-700"
                        bgColor="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                </div>

                {/* Filters */}
                <FilterSection
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                />

                {/* Users Table */}
                <UsersTable
                    users={filteredUsers}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUnblock={handleUnblock}
                    onResendActivation={handleResendActivation}
                />
            </div>

            {/* User Modal */}
            <UserModal
                isOpen={showModal}
                onClose={closeModal}
                editingUser={editingUser}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                {...config}
                isOpen={isOpen}
                onClose={config.onCancel || close}
                onConfirm={config.onConfirm}
            />
        </div>
    );
};

export default UsersManagement;
