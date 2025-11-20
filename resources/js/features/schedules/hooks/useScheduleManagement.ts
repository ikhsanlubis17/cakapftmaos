import { useState, useCallback, useEffect } from 'react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useSchedulesData } from './useSchedulesData';
import { validateScheduleForm } from '../utils/scheduleUtils';
import type { Schedule, ScheduleFormData } from '@/types/schedule.types';

interface UseScheduleManagementReturn {
    // Data
    schedules: Schedule[];
    apars: any[];
    teknisi: any[];
    pagination: any;
    combinedLoading: boolean;
    searchLoading: boolean;
    sendingNotifications: boolean;

    // Filters
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    activeFilter: string;
    setActiveFilter: (status: string) => void;
    resetFilters: () => void;
    clearSearch: () => void;
    handlePageChange: (page: number) => void;

    // Modal State
    showModal: boolean;
    showNotificationModal: boolean;
    showScheduleDetail: Schedule | null;
    editingSchedule: Schedule | null;
    openCreateModal: () => void;
    closeModal: () => void;
    handleEdit: (schedule: Schedule) => void;
    handleShow: (schedule: Schedule) => void;
    closeDetailModal: () => void;

    // Form State
    formData: ScheduleFormData;
    setFormData: React.Dispatch<React.SetStateAction<ScheduleFormData>>;
    errors: Record<string, string>;
    submitting: boolean;
    submitted: boolean;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;

    // Bulk Actions
    bulkDeleteMode: boolean;
    selectedSchedules: number[];
    deleting: boolean;
    toggleBulkDeleteMode: () => void;
    handleSelectSchedule: (id: number) => void;
    handleSelectAll: () => void;
    handleDelete: (id: number) => Promise<void>;
    handleBulkDelete: () => Promise<void>;

    // Notifications
    handleSendNotifications: () => void;
    sendNotificationByType: (type: 'today' | 'all') => Promise<void>;
    closeNotificationModal: () => void;

    // Confirm Dialog
    confirmDialog: any;
}

export const useScheduleManagement = (): UseScheduleManagementReturn => {
    const { isOpen, config, confirm, close } = useConfirmDialog();

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
    const [showScheduleDetail, setShowScheduleDetail] = useState<Schedule | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<ScheduleFormData>({
        apar_id: 0,
        assigned_user_id: 0,
        scheduled_date: "",
        start_time: "",
        end_time: "",
        frequency: "weekly",
        is_active: true,
        notes: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Bulk delete state
    const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
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
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value, type } = e.target;
            const checked = (e.target as HTMLInputElement).checked;
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

    const resetForm = () => {
        setFormData({
            apar_id: 0,
            assigned_user_id: 0,
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

    const handleSubmit = async (e: React.FormEvent) => {
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

        setSubmitting(true);

        try {
            await scheduleMutation.mutateAsync({
                id: editingSchedule?.id,
                payload: formData,
            });

            setSubmitted(true);
            setTimeout(() => {
                setShowModal(false);
                setEditingSchedule(null);
                resetForm();
                setSubmitted(false);
            }, 1000);
        } catch (error: any) {
            if (error?.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setSubmitting(false);
        }
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

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            apar_id: schedule.apar_id,
            assigned_user_id: schedule.assigned_user_id,
            scheduled_date: schedule.scheduled_date || "",
            start_time: schedule.start_time || "",
            end_time: schedule.end_time || "",
            frequency: schedule.frequency,
            is_active: schedule.is_active,
            notes: schedule.notes || "",
        });
        setShowModal(true);
    };

    const handleShow = (schedule: Schedule) => {
        setShowScheduleDetail(schedule);
    };

    const closeDetailModal = () => {
        setShowScheduleDetail(null);
    };

    // Single delete handler
    const handleDelete = async (id: number) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus",
            message: "Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.",
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (!confirmed) return;

        setDeleting(true);
        try {
            await deleteMutation.mutateAsync(id);
        } catch (error) {
            console.error("Gagal menghapus jadwal:", error);
        } finally {
            setDeleting(false);
        }
    };

    // Bulk delete handlers
    const handleBulkDelete = async () => {
        if (selectedSchedules.length === 0) return;

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

            await Promise.all(deletePromises);
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

    const handleSelectSchedule = (id: number) => {
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
            setSelectedSchedules(schedules.map((schedule: Schedule) => schedule.id));
        }
    };

    // Notification handlers
    const handleSendNotifications = () => {
        setShowNotificationModal(true);
    };

    const closeNotificationModal = () => {
        setShowNotificationModal(false);
    };

    const sendNotificationByType = async (type: 'today' | 'all') => {
        setShowNotificationModal(false);

        let message = "";
        let endpoint = "";

        if (type === "today") {
            message = "Apakah Anda yakin ingin mengirim notifikasi reminder untuk jadwal yang sedang berlangsung?";
            endpoint = "/api/notifications/bulk";
        } else if (type === "all") {
            message = "Apakah Anda yakin ingin mengirim notifikasi reminder untuk semua jadwal aktif?";
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

    const handlePageChange = (page: number) => {
        fetchData(page);
    };

    return {
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
        resetFilters,
        clearSearch,
        handlePageChange,
        showModal,
        showNotificationModal,
        showScheduleDetail,
        editingSchedule,
        openCreateModal,
        closeModal,
        handleEdit,
        handleShow,
        closeDetailModal,
        formData,
        setFormData,
        errors,
        submitting,
        submitted,
        handleChange,
        handleSubmit,
        bulkDeleteMode,
        selectedSchedules,
        deleting,
        toggleBulkDeleteMode,
        handleSelectSchedule,
        handleSelectAll,
        handleDelete,
        handleBulkDelete,
        handleSendNotifications,
        sendNotificationByType,
        closeNotificationModal,
        confirmDialog: { isOpen, config, close, confirm },
    };
};
