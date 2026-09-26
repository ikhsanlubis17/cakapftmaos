import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "@/components/ui/Toast";
import {
    FireIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    CalendarDaysIcon,
    CogIcon,
    ArrowPathIcon,
    PlusIcon,
    XCircleIcon,
    WrenchScrewdriverIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { getScheduleWindow } from "@/utils/scheduleTime";
import DashboardCharts from "../components/DashboardCharts";
import UpcomingInspectionsCard from "../components/UpcomingInspectionsCard";
import TeknisiDashboardView from "../components/TeknisiDashboardView";
import {
    QuickActionsCard,
    RecentInspectionsCard,
} from "../components/QuickActionsAndRecent";
import Skeleton from "@/components/ui/Skeleton";

// Query functions
const fetchDashboardStats = async ({ apiClient, startDate, endDate }) => {
    const response = await apiClient.get("/api/stats", {
        params: {
            start_date: startDate,
            end_date: endDate,
        },
    });

    if (response.data.success) {
        return response.data.data;
    }
    throw new Error("Failed to fetch dashboard stats");
};

const fetchTeknisiData = async ({ apiClient }) => {
    const schedulesResponse = await apiClient.get(
        "/api/schedules/my-schedules"
    );
    const schedules = schedulesResponse.data || [];

    const now = new Date();
    const stats = {
        totalAssignedSchedules: schedules.length,
        completedInspections: schedules.filter((s) => s.is_completed).length,
        pendingInspections: schedules.filter((s) => {
            const { start } = getScheduleWindow(s);
            return !s.is_completed && start && start >= now;
        }).length,
        overdueInspections: schedules.filter((s) => {
            const { start } = getScheduleWindow(s);
            return !s.is_completed && start && start < now;
        }).length,
        totalRepairs: 0,
        completedRepairs: 0,
        pendingRepairs: 0,
    };

    return { schedules, stats };
};

const fetchUpcomingInspectionsData = async ({
    apiClient,
    startDate,
    endDate,
}) => {
    const response = await apiClient.get("/api/schedules/upcoming", {
        params: {
            start_date: startDate,
            end_date: endDate,
        },
    });

    if (response.data.success) {
        return response.data.data.schedules || [];
    }
    return [];
};

const sendReminderEmailMutation = async ({ apiClient, scheduleId }) => {
    const response = await apiClient.post(
        `/api/schedules/${scheduleId}/send-reminder`
    );
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error(response.data.message || "Failed to send reminder email");
};

const DashboardEnhanced = () => {
    const { apiClient, user } = useAuth();
    const queryClient = useQueryClient();

    // Date filter state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Toast state
    const [toast, setToast] = useState({
        isOpen: false,
        type: "success",
        message: "",
        duration: 4000,
    });

    // Dashboard stats query
    const {
        data: dashboardData,
        isLoading: dashboardLoading,
        refetch: refetchDashboard,
    } = useQuery({
        queryKey: ["dashboard-stats", startDate, endDate],
        queryFn: () => fetchDashboardStats({ apiClient, startDate, endDate }),
        enabled: !!startDate && !!endDate,
        staleTime: 5 * 60 * 1000,
    });

    // Teknisi data query
    const {
        data: teknisiData,
        isLoading: teknisiLoading,
    } = useQuery({
        queryKey: ["teknisi-dashboard"],
        queryFn: () => fetchTeknisiData({ apiClient }),
        enabled: user?.role === "teknisi",
        staleTime: 5 * 60 * 1000,
    });

    // Upcoming inspections query
    const {
        data: upcomingInspections = [],
        isLoading: upcomingInspectionsLoading,
        refetch: refetchUpcomingInspections,
    } = useQuery({
        queryKey: ["upcoming-inspections", startDate, endDate],
        queryFn: () =>
            fetchUpcomingInspectionsData({ apiClient, startDate, endDate }),
        enabled: !!startDate && !!endDate,
        staleTime: 5 * 60 * 1000,
    });

    // Send reminder mutation
    const sendReminderMutation = useMutation({
        mutationFn: ({ scheduleId }) =>
            sendReminderEmailMutation({ apiClient, scheduleId }),
        onSuccess: (data) => {
            const technicianName = data.technician_name || "Teknisi";
            showToast(
                "success",
                `Reminder email berhasil dikirim kepada ${technicianName} (${data.technician_email})!`
            );
            refetchUpcomingInspections();
        },
        onError: (error) => {
            showToast(
                "error",
                "Gagal mengirim reminder email: " + error.message
            );
        },
    });

    // Extract data from queries with fallbacks
    const stats = dashboardData?.stats || {
        totalApar: 0,
        activeApar: 0,
        pendingRepairs: 0,
        inactiveApar: 0,
        overdueInspections: 0,
    };

    const aparStatusChart = dashboardData?.aparStatusChart || {
        active: 0,
        needsRepair: 0,
        inactive: 0,
        underRepair: 0,
    };
    const repairStatusChart = dashboardData?.repairStatusChart || {
        approved: 0,
        pending: 0,
        rejected: 0,
        completed: 0,
    };
    const inspectionsByDate = dashboardData?.inspectionsByDate || [];
    const dateRange = dashboardData?.dateRange || [];
    const recentInspections = dashboardData?.recentInspections || [];

    const mySchedules = teknisiData?.schedules || [];
    const teknisiStats = teknisiData?.stats || {
        totalAssignedSchedules: 0,
        completedInspections: 0,
        pendingInspections: 0,
        overdueInspections: 0,
        totalRepairs: 0,
        completedRepairs: 0,
        pendingRepairs: 0,
    };

    useEffect(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        setStartDate(startOfWeek.toISOString().split("T")[0]);
        setEndDate(endOfWeek.toISOString().split("T")[0]);
    }, []);

    const handleDateFilter = () => {
        if (startDate && endDate) {
            refetchDashboard();
            refetchUpcomingInspections();
        }
    };

    const resetDateFilter = () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        setStartDate(startOfWeek.toISOString().split("T")[0]);
        setEndDate(endOfWeek.toISOString().split("T")[0]);
    };

    const showToast = (type, message, duration = 4000) => {
        setToast({
            isOpen: true,
            type,
            message,
            duration,
        });
    };

    const closeToast = () => {
        setToast((prev) => ({ ...prev, isOpen: false }));
    };

    // Helper functions for schedule status
    const getStatusColor = (schedule) => {
        const { start, end } = getScheduleWindow(schedule);
        const now = new Date();

        if (!start || !schedule.is_active) {
            return "bg-gray-100 text-gray-700";
        }

        const endTime = end || new Date(start.getTime() + 60 * 60 * 1000);

        if (
            start.toDateString() === now.toDateString() &&
            now >= start &&
            now <= endTime
        ) {
            return "bg-amber-100 text-amber-700";
        }

        if (start.toDateString() === now.toDateString() && now < start) {
            return "bg-blue-100 text-blue-700";
        }

        if (start < now) {
            return "bg-red-100 text-red-700";
        }

        return "bg-emerald-100 text-emerald-700";
    };

    const getStatusText = (schedule) => {
        const { start, end } = getScheduleWindow(schedule);
        const now = new Date();

        if (!start) {
            return "Tidak diketahui";
        }

        if (!schedule.is_active) {
            return "Nonaktif";
        }

        const endTime = end || new Date(start.getTime() + 60 * 60 * 1000);

        if (now >= start && now <= endTime) {
            return "Hari ini (sedang berlangsung)";
        }

        if (start.toDateString() === now.toDateString() && now < start) {
            return "Hari ini (belum dimulai)";
        }

        if (start < now) {
            return "Terlambat";
        }

        return "Akan datang";
    };

    const getStatusIcon = (schedule) => {
        const { start, end } = getScheduleWindow(schedule);
        const now = new Date();

        if (!start || !schedule.is_active) {
            return XCircleIcon;
        }

        const endTime = end || new Date(start.getTime() + 60 * 60 * 1000);

        if (
            start.toDateString() === now.toDateString() &&
            now >= start &&
            now <= endTime
        ) {
            return ClockIcon;
        }

        if (start.toDateString() === now.toDateString() && now < start) {
            return CalendarDaysIcon;
        }

        if (start < now) {
            return ExclamationTriangleIcon;
        }

        return CheckCircleIcon;
    };

    const getFrequencyText = (frequency) => {
        switch (frequency) {
            case "daily":
                return "Harian";
            case "weekly":
                return "Mingguan";
            case "monthly":
                return "Bulanan";
            case "quarterly":
                return "Per-3 Bulan";
            case "semiannual":
                return "Per-6 Bulan";
            case "annual":
                return "Tahunan";
            default:
                return frequency;
        }
    };

    const isLoading =
        dashboardLoading || teknisiLoading || upcomingInspectionsLoading;

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="bg-[#041562] rounded-lg p-6 lg:p-8 text-white">
                    <Skeleton className="h-4 w-32 bg-white/20 mb-3" />
                    <Skeleton className="h-8 w-64 bg-white/20 mb-2" />
                    <Skeleton className="h-4 w-48 bg-white/15" />
                </div>

                {/* Metric Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg p-5 lg:p-6 border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-6 border border-slate-200 h-64 shadow-sm">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <Skeleton className="h-44 w-full" />
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-slate-200 h-64 shadow-sm">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <Skeleton className="h-44 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative bg-[#041562] border border-[#11468F]/40 rounded-lg p-5 sm:p-6 lg:p-7 text-white shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#11468F] via-[#DA1212] to-[#11468F]"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Pertamina Patra Niaga • FT Maos</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                            Dashboard Pemantauan APAR
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1 font-normal">
                            Selamat datang kembali,{" "}
                            <span className="font-semibold text-white">{user?.name}</span>
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                            onClick={() => {
                                refetchDashboard();
                                if (user?.role === "teknisi") {
                                    queryClient.invalidateQueries({
                                        queryKey: ["teknisi-dashboard"],
                                    });
                                }
                            }}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-[6px] transition-all duration-150 text-xs font-semibold flex items-center justify-center gap-2"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Refresh Data
                        </button>
                        {user?.role !== "admin" && (
                            <Link
                                to="/inspections/new"
                                className="bg-[#11468F] text-white px-5 py-2.5 rounded-[6px] hover:bg-[#0d3873] shadow-sm transition-all duration-150 font-semibold text-xs flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Inspeksi Baru
                            </Link>
                        )}
                        {user?.role === "admin" && (
                            <Link
                                to="/damage-categories"
                                className="bg-white/10 text-white border border-white/20 px-4 py-2.5 rounded-[6px] hover:bg-white/20 transition-colors text-xs font-semibold flex items-center justify-center gap-2"
                            >
                                <CogIcon className="h-4 w-4" />
                                Kelola Kategori
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid for non-teknisi (Supervisor & Admin) */}
            {user?.role !== "teknisi" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {/* Card 1: Total APAR */}
                    <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#041562]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                    Total APAR Terdaftar
                                </p>
                                <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-[#041562] leading-tight font-mono">
                                    {stats.totalApar}
                                </p>
                                <p className="text-xs text-slate-500 mt-2 font-medium">
                                    <span>{stats.inactiveApar || 0} unit nonaktif</span>
                                </p>
                            </div>
                            <div className="p-3 bg-[#041562] rounded-lg text-white flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <FireIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Kesiapan Operasional */}
                    <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 shadow-sm">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                    Kesiapan Operasional
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-emerald-700 leading-tight font-mono">
                                        {stats.activeApar}
                                    </p>
                                    <span className="text-xs font-bold text-slate-500">
                                        / {stats.totalApar}
                                    </span>
                                </div>
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <ShieldCheckIcon className="w-3.5 h-3.5 mr-1" />
                                    {stats.totalApar > 0 ? Math.round((stats.activeApar / stats.totalApar) * 100) : 100}% Siap Operasi
                                </div>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                                <CheckCircleIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Menunggu Disposisi Perbaikan */}
                    <Link
                        to="/repair-approvals"
                        className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 shadow-sm block"
                    >
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                    Persetujuan Perbaikan
                                </p>
                                <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-amber-700 leading-tight font-mono">
                                    {repairStatusChart?.pending ?? stats.pendingRepairs ?? 0}
                                </p>
                                <p className="text-xs text-amber-700 mt-2 font-bold flex items-center gap-1 group-hover:underline">
                                    <span>Tinjau permohonan</span>
                                    <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                </p>
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                                <WrenchScrewdriverIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </Link>

                    {/* Card 4: Inspeksi Terlambat */}
                    <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all duration-200 shadow-sm">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                    Inspeksi Terlambat
                                </p>
                                <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-[#DA1212] leading-tight font-mono">
                                    {stats.overdueInspections}
                                </p>
                                <p className="text-xs text-[#DA1212] mt-2 font-semibold flex items-center gap-1">
                                    {stats.overdueInspections > 0 ? (
                                        <span>Perlu tindakan segera</span>
                                    ) : (
                                        <span className="text-emerald-700 font-bold">Semua jadwal on-time</span>
                                    )}
                                </p>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[#DA1212] flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                                <ClockIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Teknisi Dashboard View */}
            {user?.role === "teknisi" && (
                <TeknisiDashboardView
                    teknisiStats={teknisiStats}
                    mySchedules={mySchedules}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                />
            )}

            {/* Bento Grid: Non-teknisi (Admin & Supervisor) */}
            {user?.role !== "teknisi" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Visual Analytics & Trend Charts (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <DashboardCharts
                            aparStatusChart={aparStatusChart}
                            repairStatusChart={repairStatusChart}
                            inspectionsByDate={inspectionsByDate}
                            dateRange={dateRange}
                            totalApar={stats.totalApar}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            onApplyDateFilter={handleDateFilter}
                            onResetDateFilter={resetDateFilter}
                        />
                    </div>

                    {/* Right Column: Operational Flow & Feeds (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. Quick Actions (No Laporan Perbaikan Saya for admin/supervisor) */}
                        <QuickActionsCard
                            userRole={user?.role}
                            isAdmin={user?.role === "admin"}
                        />

                        {/* 2. Upcoming Inspections Agenda */}
                        <UpcomingInspectionsCard
                            upcomingInspections={upcomingInspections}
                            isLoading={upcomingInspectionsLoading}
                            onRefresh={refetchUpcomingInspections}
                            getStatusIcon={getStatusIcon}
                            getStatusColor={getStatusColor}
                            getStatusText={getStatusText}
                            getFrequencyText={getFrequencyText}
                            isAdmin={user?.role === "admin"}
                        />

                        {/* 3. Recent Inspections Feed */}
                        <RecentInspectionsCard
                            recentInspections={recentInspections}
                        />
                    </div>
                </div>
            )}

            {/* Toast Component */}
            <Toast
                isOpen={toast.isOpen}
                onClose={closeToast}
                type={toast.type}
                message={toast.message}
                duration={toast.duration}
                position="top-right"
            />
        </div>
    );
};

export default DashboardEnhanced;
