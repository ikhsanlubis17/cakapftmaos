import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
    fetchSchedules,
    fetchApars,
    fetchUsers,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    sendNotifications,
} from "../api/scheduleApi";

/**
 * Custom hook for managing schedules data and operations
 * Handles all data fetching, state management, and mutations
 */
export const useSchedulesData = () => {
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    // Local state
    const [schedules, setSchedules] = useState([]);
    const [apars, setApars] = useState([]);
    const [teknisi, setTeknisi] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");
    const [sendingNotifications, setSendingNotifications] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    // Queries: apars
    const {
        data: aparData,
        isLoading: aparLoading,
        isError: aparError,
    } = useQuery({
        queryKey: ["apars"],
        queryFn: () => fetchApars(apiClient),
        staleTime: 1000 * 60, // 1 minute
    });

    // Queries: users (teknisi)
    const {
        data: usersData,
        isLoading: usersLoading,
        isError: usersError,
    } = useQuery({
        queryKey: ["users"],
        queryFn: () => fetchUsers(apiClient),
        staleTime: 1000 * 60,
    });

    // Queries: schedules (with pagination/filters)
    const {
        data: schedulesData,
        isLoading: schedulesLoading,
        isError: schedulesError,
        refetch: schedulesRefetch,
    } = useQuery({
        queryKey: [
            "schedules",
            pagination.current_page,
            pagination.per_page,
            searchTerm,
            statusFilter,
            activeFilter,
        ],
        queryFn: () => {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                _t: Date.now(),
            };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter !== "all") params.status = statusFilter;
            if (activeFilter !== "all") params.active = activeFilter;

            return fetchSchedules(apiClient, params);
        },
        keepPreviousData: true,
        staleTime: 1000 * 30,
    });

    // Combined loading state
    const combinedLoading = aparLoading && usersLoading && schedulesLoading;

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (
                searchTerm.trim() ||
                statusFilter !== "all" ||
                activeFilter !== "all"
            ) {
                setSearchLoading(true);
                setPagination((prev) => ({ ...prev, current_page: 1 }));
                schedulesRefetch().finally(() => setSearchLoading(false));
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, activeFilter]);

    // Immediate fetch when filters are reset to 'all'
    useEffect(() => {
        if (
            statusFilter === "all" &&
            activeFilter === "all" &&
            !searchTerm.trim()
        ) {
            setPagination((prev) => ({ ...prev, current_page: 1 }));
            if (schedulesRefetch) schedulesRefetch();
        }
    }, [statusFilter, activeFilter, searchTerm]);

    // Reset pagination when filters change
    useEffect(() => {
        if (pagination.current_page !== 1) {
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }
    }, [statusFilter, activeFilter]);

    // Update local state from queries when data arrives
    useEffect(() => {
        if (schedulesData) {
            try {
                const schedulesRes = schedulesData;
                const schedulesDataInner = schedulesRes.data || schedulesRes;
                let validSchedules = Array.isArray(
                    schedulesData.data ? schedulesData.data : schedulesData
                )
                    ? (schedulesDataInner.data || schedulesDataInner).filter(
                          (schedule) =>
                              schedule &&
                              schedule.id &&
                              schedule.apar_id &&
                              schedule.assigned_user_id &&
                              schedule.scheduled_date &&
                              schedule.start_time
                      )
                    : [];

                setSchedules(validSchedules);

                // Update pagination
                const meta = schedulesRes.data || schedulesRes;
                setPagination((prev) => ({
                    ...prev,
                    current_page: meta.current_page || prev.current_page,
                    last_page: meta.last_page || prev.last_page,
                    per_page: meta.per_page || prev.per_page,
                    total: meta.total || validSchedules.length,
                }));
            } catch (e) {
                console.error("Error processing schedules data", e);
            }
        }

        if (schedulesError) {
            showError("Gagal memuat data jadwal");
        }
    }, [schedulesData, schedulesError]);

    useEffect(() => {
        if (aparData) {
            const validApars = Array.isArray(aparData)
                ? aparData.filter((a) => a && a.id)
                : [];
            setApars(validApars);
        }
    }, [aparData]);

    useEffect(() => {
        if (usersData) {
            const validTeknisi = Array.isArray(usersData)
                ? usersData.filter((u) => u && u.id && u.role === "teknisi")
                : [];
            setTeknisi(validTeknisi);
        }
    }, [usersData]);

    // Mutation: Create/Update Schedule
    const scheduleMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            if (id) {
                return await updateSchedule(apiClient, id, payload);
            }
            return await createSchedule(apiClient, payload);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            const action = variables.id ? "diperbarui" : "dibuat";
            const notificationText = variables.id
                ? "dan notifikasi telah dikirim kembali ke teknisi"
                : "dan notifikasi telah dikirim ke teknisi yang ditugaskan";
            showSuccess(`Jadwal berhasil ${action} ${notificationText}.`);
        },
        onError: (error) => {
            if (error.response?.data?.errors) {
                showError("Mohon periksa kembali data yang diisi");
                return error.response.data.errors;
            } else if (error.response?.data?.message) {
                showError(error.response.data.message);
            } else if (error.message) {
                showError(error.message);
            } else {
                showError("Gagal menyimpan jadwal");
            }
        },
    });

    // Mutation: Delete Schedule
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteSchedule(apiClient, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            showSuccess("Jadwal berhasil dihapus");
        },
        onError: (error) => {
            if (error.response?.status === 404) {
                showError("Jadwal tidak ditemukan atau sudah dihapus");
                if (schedulesRefetch) schedulesRefetch();
            } else {
                showError("Gagal menghapus jadwal");
            }
        },
    });

    // Mutation: Send Notifications
    const sendNotificationsMutation = useMutation({
        mutationFn: (endpoint) => sendNotifications(apiClient, endpoint),
        onMutate: () => setSendingNotifications(true),
        onSuccess: (data) =>
            showSuccess(`Berhasil mengirim ${data.sent_count} notifikasi`),
        onError: () => showError("Gagal mengirim notifikasi"),
        onSettled: () => setSendingNotifications(false),
    });

    // Helper function to change page and trigger refetch
    const fetchData = (page = 1) => {
        setPagination((prev) => ({ ...prev, current_page: page }));
        if (schedulesRefetch) schedulesRefetch();
    };

    return {
        // Data
        schedules,
        apars,
        teknisi,
        pagination,
        
        // Loading states
        combinedLoading,
        searchLoading,
        sendingNotifications,
        
        // Filters
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        activeFilter,
        setActiveFilter,
        
        // Mutations
        scheduleMutation,
        deleteMutation,
        sendNotificationsMutation,
        
        // Helper functions
        fetchData,
        schedulesRefetch,
    };
};
