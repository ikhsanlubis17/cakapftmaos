import React, { useState, useEffect, useCallback } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { BellIcon, PlusIcon, CalendarIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Custom hook and utilities
import { useSchedulesData } from "../hooks/useSchedulesData";
import { validateScheduleForm } from "../utils/scheduleUtils";

// UI Components
import ScheduleFilters from "../components/ScheduleFilters/ScheduleFilters";
import ScheduleTable from "../components/ScheduleTable/ScheduleTable";
import ScheduleModal from "../components/ScheduleModal/ScheduleModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal/ScheduleDetailModal";
import NotificationModal from "../components/NotificationModal/NotificationModal";

/**
 * SchedulesManagement Component
 * Main entry point for schedule management feature
 * Orchestrates all sub-components and manages high-level state
 */
const SchedulesManagement = () => {
    const { isOpen, config, confirm, close } = useConfirmDialog();

    // Get all data and operations from custom hook
    const {
        schedules,
        apars,
        teknisi,
        pagination,
        combinedLoading,
        searchLoading,
        sendingNotifications,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        activeFilter,
        setActiveFilter,
        scheduleMutation,
        deleteMutation,
        sendNotificationsMutation,
        fetchData,
    } = useSchedulesData();

    // Local UI state
    const [showModal, setShowModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showScheduleDetail, setShowScheduleDetail] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        apar_id: "",
        assigned_user_id: "",
        scheduled_date: "",
        start_time: "",
        end_time: "",
        frequency: "weekly",
        is_active: true,
        notes: "",
    });
    const [errors, setErrors] = useState({});
    
    // Bulk delete state
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Modal overflow control
    useEffect(() => {
        if (showModal || showScheduleDetail) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showModal, showScheduleDetail]);

    // Form handlers
    const handleChange = useCallback(
        (e) => {
            const { name, value, type, checked } = e.target;
            const safeValue = type === "checkbox" ? checked : value || "";

            setFormData((prev) => ({
                ...prev,
                [name]: safeValue,
            }));

            if (errors[name]) {
                setErrors((prev) => ({
                    ...prev,
                    [name]: "",
                }));
            }
        },
        [errors]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const validationErrors = validateScheduleForm(
            formData,
            teknisi,
            editingSchedule
        );

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Prepare payload
        const payload = {
            apar_id: formData.apar_id,
            assigned_user_id: formData.assigned_user_id,
            scheduled_date: formData.scheduled_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            frequency: formData.frequency,
            is_active: formData.is_active,
            notes: formData.notes,
        };

        setSubmitting(true);

        try {
            await scheduleMutation.mutateAsync({
                id: editingSchedule?.id,
                payload,
            });

            setSubmitted(true);
            setTimeout(() => {
                setShowModal(false);
                setEditingSchedule(null);
                resetForm();
                setSubmitted(false);
            }, 1000);
        } catch (error) {
            if (error?.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            apar_id: "",
            assigned_user_id: "",
            scheduled_date: "",
            start_time: "",
            end_time: "",
            frequency: "weekly",
            is_active: true,
            notes: "",
        });
        setErrors({});
        setSubmitted(false);
    };

    // CRUD operations
    const openCreateModal = () => {
        setEditingSchedule(null);
        resetForm();
        setSubmitted(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSchedule(null);
        resetForm();
        setSubmitted(false);
    };

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            apar_id: schedule.apar_id,
            assigned_user_id: schedule.assigned_user_id,
            scheduled_date: schedule.scheduled_date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            frequency: schedule.frequency,
            is_active: schedule.is_active,
            notes: schedule.notes || "",
        });
        setShowModal(true);
    };

    const handleShow = (schedule) => {
        setShowScheduleDetail(schedule);
    };

    const handleDelete = async (scheduleId) => {
        if (!scheduleId) {
            console.error("Schedule ID is required for deletion");
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Jadwal",
            message:
                "Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.",
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            await deleteMutation.mutateAsync(scheduleId);
        }
    };

    // Bulk delete handlers
    const handleBulkDelete = async () => {
        if (selectedSchedules.length === 0) {
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedSchedules.length} jadwal? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (!confirmed) return;

        setDeleting(true);
        try {
            const deletePromises = selectedSchedules.map(async (id) => {
                try {
                    await deleteMutation.mutateAsync(id);
                    return { success: true, id };
                } catch (error) {
                    return { success: false, id, error };
                }
            });

            const results = await Promise.all(deletePromises);
            const successful = results.filter((r) => r.success);
            const failed = results.filter((r) => !r.success);

            // Success/error messages are already handled by deleteMutation
            setSelectedSchedules([]);
            setBulkDeleteMode(false);
        } catch (error) {
            console.error("Gagal dalam bulk delete:", error);
        } finally {
            setDeleting(false);
        }
    };

    const toggleBulkDeleteMode = () => {
        setBulkDeleteMode(!bulkDeleteMode);
        setSelectedSchedules([]);
    };

    const handleSelectSchedule = (id) => {
        setSelectedSchedules((prev) =>
            prev.includes(id)
                ? prev.filter((scheduleId) => scheduleId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedSchedules.length === schedules.length) {
            setSelectedSchedules([]);
        } else {
            setSelectedSchedules(schedules.map((schedule) => schedule.id));
        }
    };

    // Notification handlers
    const handleSendNotifications = () => {
        setShowNotificationModal(true);
    };

    const sendNotificationByType = async (type) => {
        setShowNotificationModal(false);

        let message = "";
        let endpoint = "";

        if (type === "today") {
            message =
                "Apakah Anda yakin ingin mengirim notifikasi reminder untuk jadwal yang sedang berlangsung?";
            endpoint = "/api/notifications/bulk";
        } else if (type === "all") {
            message =
                "Apakah Anda yakin ingin mengirim notifikasi reminder untuk semua jadwal aktif?";
            endpoint = "/api/notifications/bulk-all";
        }

        const confirmed = await confirm({
            title: "Konfirmasi Kirim Notifikasi",
            message: message,
            type: "info",
            confirmText: "Ya, Kirim",
            cancelText: "Batal",
            confirmButtonColor: "blue",
        });

        if (confirmed) {
            sendNotificationsMutation.mutate(endpoint);
        }
    };

    // Filter handlers
    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setActiveFilter("all");
        fetchData(1);
    };

    const clearSearch = () => {
        setSearchTerm("");
        fetchData(1);
    };

    const handlePageChange = (page) => {
        fetchData(page);
    };

    // Loading state
    if (combinedLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-500 border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
            {/* Header Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                        Kelola Jadwal Inspeksi
                                    </h1>
                                    <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
                                        Kelola jadwal inspeksi APAR untuk teknisi
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            {bulkDeleteMode ? (
                                <>
                                    <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                                        <span className="text-sm text-gray-600">
                                            {selectedSchedules.length} dipilih
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedSchedules.length === 0 || deleting}
                                        className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-transparent text-sm sm:text-base font-medium rounded-lg sm:rounded-xl text-white ${
                                            selectedSchedules.length > 0 && !deleting
                                                ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/20"
                                                : "bg-gray-300 cursor-not-allowed"
                                        } transition-all duration-200`}
                                    >
                                        {deleting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon className="w-4 h-4 mr-2" />
                                                Hapus ({selectedSchedules.length})
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={toggleBulkDeleteMode}
                                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                                    >
                                        <XMarkIcon className="w-4 h-4 mr-2" />
                                        Batal
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleBulkDeleteMode}
                                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                                    >
                                        <TrashIcon className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Hapus Massal</span>
                                        <span className="sm:hidden">Hapus</span>
                                    </button>
                                    <button
                                        onClick={handleSendNotifications}
                                        disabled={sendingNotifications}
                                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {sendingNotifications ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                                <span className="hidden sm:inline">
                                                    Mengirim...
                                                </span>
                                                <span className="sm:hidden">Mengirim</span>
                                            </>
                                        ) : (
                                            <>
                                                <BellIcon className="w-4 h-4 mr-2" />
                                                <span className="hidden sm:inline">
                                                    Kirim Notifikasi
                                                </span>
                                                <span className="sm:hidden">Notifikasi</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={openCreateModal}
                                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Buat Jadwal</span>
                                        <span className="sm:hidden">Buat</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <ScheduleFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                activeFilter={activeFilter}
                searchLoading={searchLoading}
                onSearchChange={setSearchTerm}
                onStatusChange={setStatusFilter}
                onActiveChange={setActiveFilter}
                onReset={resetFilters}
                onClearSearch={clearSearch}
            />

            {/* Schedules Table */}
            <ScheduleTable
                schedules={schedules}
                pagination={pagination}
                loading={combinedLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleShow}
                onPageChange={handlePageChange}
                onCreateNew={openCreateModal}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                activeFilter={activeFilter}
                onResetFilters={resetFilters}
                bulkDeleteMode={bulkDeleteMode}
                selectedSchedules={selectedSchedules}
                onSelectSchedule={handleSelectSchedule}
                onSelectAll={handleSelectAll}
            />

            {/* Create/Edit Modal */}
            <ScheduleModal
                isOpen={showModal}
                onClose={closeModal}
                onSubmit={handleSubmit}
                formData={formData}
                onChange={handleChange}
                errors={errors}
                apars={apars}
                teknisi={teknisi}
                editingSchedule={editingSchedule}
                submitting={submitting}
                submitted={submitted}
            />

            {/* Schedule Detail Modal */}
            <ScheduleDetailModal
                schedule={showScheduleDetail}
                isOpen={!!showScheduleDetail}
                onClose={() => setShowScheduleDetail(null)}
                onEdit={handleEdit}
            />

            {/* Notification Type Selection Modal */}
            <NotificationModal
                isOpen={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
                onSelectType={sendNotificationByType}
                sending={sendingNotifications}
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

export default SchedulesManagement;
