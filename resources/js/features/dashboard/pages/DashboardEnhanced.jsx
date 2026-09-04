import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Toast from "@/components/ui/Toast";
import {
    FireIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    WrenchScrewdriverIcon,
    DocumentTextIcon,
    UserGroupIcon,
    TruckIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    CogIcon,
    BellIcon,
    TagIcon,
    XMarkIcon,
    ArrowPathIcon,
    PlusIcon,
    EyeIcon,
    FunnelIcon,
    UserIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import {
    getScheduleWindow,
    formatScheduleDate,
    formatScheduleTime,
} from "@/utils/scheduleTime";
import { Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

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
    const [showDateFilter, setShowDateFilter] = useState(false);

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
        error: dashboardError,
        refetch: refetchDashboard,
    } = useQuery({
        queryKey: ["dashboard-stats", startDate, endDate],
        queryFn: () => fetchDashboardStats({ apiClient, startDate, endDate }),
        enabled: !!startDate && !!endDate,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Teknisi data query
    const {
        data: teknisiData,
        isLoading: teknisiLoading,
        error: teknisiError,
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
        error: upcomingInspectionsError,
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
        onSuccess: (data, variables) => {
            const technicianName = data.technician_name || "Teknisi";
            showToast(
                "success",
                `Reminder email berhasil dikirim kepada ${technicianName} (${data.technician_email})!`
            );
            refetchUpcomingInspections(); // Refresh the list
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
    const dateRangeInfo = dashboardData?.dateRangeInfo || {
        startDate: "",
        endDate: "",
    };
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
        // Set default date range to current week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

        const startDateStr = startOfWeek.toISOString().split("T")[0];
        const endDateStr = endOfWeek.toISOString().split("T")[0];

        setStartDate(startDateStr);
        setEndDate(endDateStr);
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

    const statusChartData = {
        labels: ["Aktif", "Perlu Perbaikan", "Nonaktif", "Sedang Perbaikan"],
        datasets: [
            {
                data: [
                    aparStatusChart.active,
                    aparStatusChart.needsRepair,
                    aparStatusChart.inactive,
                    aparStatusChart.underRepair,
                ],
                backgroundColor: ["#10b981", "#f59e0b", "#DA1212", "#11468F"],
                borderWidth: 1,
                borderColor: ["#059669", "#d97706", "#b91c1c", "#0d3873"],
                hoverBackgroundColor: [
                    "#059669",
                    "#d97706",
                    "#b91c1c",
                    "#0d3873",
                ],
            },
        ],
    };

    const repairChartData = {
        labels: ["Disetujui", "Menunggu", "Ditolak", "Selesai"],
        datasets: [
            {
                data: [
                    repairStatusChart.approved,
                    repairStatusChart.pending,
                    repairStatusChart.rejected,
                    repairStatusChart.completed,
                ],
                backgroundColor: ["#10b981", "#f59e0b", "#DA1212", "#11468F"],
                borderWidth: 1,
                borderColor: ["#059669", "#d97706", "#b91c1c", "#0d3873"],
                hoverBackgroundColor: [
                    "#059669",
                    "#d97706",
                    "#b91c1c",
                    "#0d3873",
                ],
            },
        ],
    };

    // Process inspection data for stacked bar chart
    const inspectionChartData = {
        labels: dateRange.map((day) => {
            const dayNames = {
                Monday: "Sen",
                Tuesday: "Sel",
                Wednesday: "Rab",
                Thursday: "Kam",
                Friday: "Jum",
                Saturday: "Sab",
                Sunday: "Min",
            };
            return dayNames[day] || day;
        }),
        datasets: [
            {
                label: "Baik",
                data: inspectionsByDate.map((item) => item.good),
                backgroundColor: "#11468F",
                borderRadius: 4,
                maxBarThickness: 36,
            },
            {
                label: "Perlu Perbaikan",
                data: inspectionsByDate.map((item) => item.needs_repair),
                backgroundColor: "#f59e0b",
                borderRadius: 4,
                maxBarThickness: 36,
            },
        ],
    };

    // Calculate totals for chart legends
    const totalApar = stats.totalApar; // Use the actual total from stats instead of calculating from chart data
    const totalRepairs =
        repairStatusChart.approved +
        repairStatusChart.pending +
        repairStatusChart.rejected +
        repairStatusChart.completed;

    // Helper function to calculate accurate percentages that total 100%
    const calculatePercentages = (
        active,
        needsRepair,
        inactive,
        underRepair,
        total
    ) => {
        if (total === 0)
            return { active: 0, needsRepair: 0, inactive: 0, underRepair: 0 };

        // Calculate initial percentages
        let activePercent = Math.round((active / total) * 100);
        let needsRepairPercent = Math.round((needsRepair / total) * 100);
        let inactivePercent = Math.round((inactive / total) * 100);
        let underRepairPercent = Math.round((underRepair / total) * 100);

        // Calculate total percentage
        let totalPercent =
            activePercent +
            needsRepairPercent +
            inactivePercent +
            underRepairPercent;

        // If total is not 100%, adjust the largest value
        if (totalPercent !== 100) {
            const difference = 100 - totalPercent;

            // Find the largest category and adjust it
            if (
                active >= needsRepair &&
                active >= inactive &&
                active >= underRepair
            ) {
                activePercent += difference;
            } else if (
                needsRepair >= active &&
                needsRepair >= inactive &&
                needsRepair >= underRepair
            ) {
                needsRepairPercent += difference;
            } else if (
                inactive >= active &&
                inactive >= needsRepair &&
                inactive >= underRepair
            ) {
                inactivePercent += difference;
            } else {
                underRepairPercent += difference;
            }
        }

        return {
            active: activePercent,
            needsRepair: needsRepairPercent,
            inactive: inactivePercent,
            underRepair: underRepairPercent,
        };
    };

    // Calculate accurate percentages for APAR status
    const percentages = calculatePercentages(
        aparStatusChart.active,
        aparStatusChart.needsRepair,
        aparStatusChart.inactive,
        aparStatusChart.underRepair,
        totalApar
    );

    // Calculate inspection totals
    const totalInspections = inspectionsByDate.reduce(
        (sum, item) => sum + item.total,
        0
    );
    const totalGoodInspections = inspectionsByDate.reduce(
        (sum, item) => sum + item.good,
        0
    );
    const totalNeedsRepairInspections = inspectionsByDate.reduce(
        (sum, item) => sum + item.needs_repair,
        0
    );

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

    // Helper functions for schedule status (same as SchedulesManagement.jsx)
    const getStatusColor = (schedule) => {
        const { start, end } = getScheduleWindow(schedule);
        const now = new Date();

        if (!start) {
            return "bg-gray-100 text-gray-700";
        }

        if (!schedule.is_active) {
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

        if (!start) {
            return XCircleIcon;
        }

        if (!schedule.is_active) {
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

    const sendReminderEmail = async (schedule) => {
        // Validasi role admin
        if (user?.role !== "admin") {
            showToast(
                "error",
                "Anda tidak memiliki akses untuk mengirim reminder email"
            );
            return;
        }

        if (sendReminderMutation.isPending) return; // Prevent double clicks

        sendReminderMutation.mutate({ scheduleId: schedule.id });
    };

    // Combined loading state
    const isLoading =
        dashboardLoading || teknisiLoading || upcomingInspectionsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
                    <span className="text-gray-600 font-medium">
                        Memuat data...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative bg-[#041562] border border-[#11468F]/30 rounded-[6px] p-6 lg:p-8 text-white shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#11468F]"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[20px] bg-white/10 border border-white/15 text-[10px] font-semibold text-white uppercase tracking-wider mb-2">
                            <span>Sistem Pemantauan Aset</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard Operasional</h1>
                        <p className="text-slate-300 text-sm mt-1 font-normal">
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
                        <Link
                            to="/inspections/new"
                            className="bg-[#11468F] text-white px-5 py-2.5 rounded-[6px] hover:bg-[#0d3873] shadow-sm transition-all duration-150 font-semibold text-xs flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Inspeksi Baru
                        </Link>
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

            {/* Stats Grid */}
            {user?.role !== "teknisi" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Total APAR Card */}
                    <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-[#EEEEEE] hover:border-slate-300 hover:shadow-sm transition-all duration-150 group">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                    Total APAR Terdaftar
                                </p>
                                <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[#041562] leading-tight">
                                    {stats.totalApar}
                                </p>
                            </div>
                            <div className="p-3 bg-[#041562] rounded-[6px] text-white flex-shrink-0 shadow-sm">
                                <FireIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    {/* Inspeksi Terlambat Card */}
                    <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-[#EEEEEE] hover:border-red-200 hover:shadow-sm transition-all duration-150 group">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                    Inspeksi Terlambat
                                </p>
                                <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[#DA1212] leading-tight">
                                    {stats.overdueInspections}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-[#DA1212] flex-shrink-0">
                                <ClockIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Jadwal Inspeksi Terdekat Component */}
            {user?.role !== "teknisi" && (
                <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 lg:mb-6">
                        <div>
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1 leading-tight tracking-tight">
                                Jadwal Inspeksi Terdekat
                            </h3>
                            <p className="text-xs text-slate-500 leading-tight">
                                Kirim reminder email kepada teknisi untuk inspeksi yang akan datang
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => refetchUpcomingInspections()}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#11468F] hover:text-[#041562] uppercase tracking-wider transition-colors"
                            >
                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {upcomingInspectionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#11468F]"></div>
                            <span className="ml-3 text-xs text-slate-600 font-semibold">
                                Memuat jadwal...
                            </span>
                        </div>
                    ) : upcomingInspections.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingInspections.slice(0, 5).map((schedule) => {
                                const StatusIcon = getStatusIcon(schedule);
                                return (
                                    <div
                                        key={schedule.id}
                                        className="p-4 bg-white rounded-[6px] border border-[#EEEEEE] hover:border-slate-300 transition-all duration-150"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex gap-4 flex-1">
                                                <div className="flex-shrink-0">
                                                    <div className="w-11 h-11 bg-[#041562] rounded-[6px] flex items-center justify-center text-white">
                                                        <FireIcon className="h-6 w-6" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {
                                                                schedule.apar
                                                                    ?.serial_number
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                schedule.apar
                                                                    ?.location_name
                                                            }
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            {/* Status Aktif/Nonaktif */}
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                                    schedule.is_active
                                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                                                }`}
                                                            >
                                                                {schedule.is_active
                                                                    ? "Aktif"
                                                                    : "Nonaktif"}
                                                            </span>
                                                            {/* Status Jadwal */}
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${getStatusColor(
                                                                    schedule
                                                                )}`}
                                                            >
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {getStatusText(
                                                                    schedule
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                                            <span className="truncate">
                                                                {schedule
                                                                    .assigned_user
                                                                    ?.name ||
                                                                    "Teknisi tidak ditugaskan"}
                                                            </span>
                                                            <span className="text-gray-400">
                                                                •
                                                            </span>
                                                            <span className="truncate">
                                                                {
                                                                    schedule
                                                                        .assigned_user
                                                                        ?.email
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                                                <span>
                                                                    {formatScheduleDate(
                                                                        schedule,
                                                                        "id-ID",
                                                                        {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                                                <span>
                                                                    {formatScheduleTime(
                                                                        schedule
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <span className="px-2 py-0.5 text-xs font-semibold bg-[#EEEEEE] text-[#11468F] border border-slate-200 rounded-[3px] w-fit">
                                                                {getFrequencyText(
                                                                    schedule.frequency
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {schedule.notes && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                                            <p className="text-sm text-gray-700">
                                                                <span className="font-medium">
                                                                    Catatan:
                                                                </span>{" "}
                                                                {schedule.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end sm:justify-start gap-2">
                                                {/* Tombol Kirim Reminder hanya untuk Admin */}
                                                {/* {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => sendReminderEmail(schedule)}
                                                    disabled={sendingReminder === schedule.id}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                >
                                                    {sendingReminder === schedule.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                                            Mengirim...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BellIcon className="h-3 w-3" />
                                                            Kirim Reminder
                                                        </>
                                                    )}
                                                </button>
                                            )} */}

                                                {/* Informasi untuk non-admin */}
                                                {user?.role !== "admin" && (
                                                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                                                        Hanya admin yang dapat
                                                        mengirim reminder
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {upcomingInspections.length > 5 && (
                                <div className="text-center pt-4">
                                    <p className="text-sm text-gray-500">
                                        Menampilkan 5 dari{" "}
                                        {upcomingInspections.length} jadwal
                                        terdekat
                                    </p>
                                    {user?.role === "admin" && (
                                        <Link
                                            to="/schedules"
                                            className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                        >
                                            Lihat Semua Jadwal
                                            <ArrowPathIcon className="h-3 w-3 rotate-90" />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium mb-2">
                                Tidak ada jadwal inspeksi terdekat
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Semua jadwal inspeksi sudah selesai atau belum
                                dijadwalkan
                            </p>
                            {user?.role === "admin" && (
                                <Link
                                    to="/schedules"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Buat Jadwal Baru
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Teknisi Dashboard Section */}
            {user?.role === "teknisi" && (
                <div className="space-y-6 lg:space-y-8">
                    {/* Teknisi Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {/* Total Jadwal */}
                        <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-[#EEEEEE] hover:border-slate-300 hover:shadow-sm transition-all duration-150 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                        Total Jadwal
                                    </p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[#041562] leading-tight">
                                        {teknisiStats.totalAssignedSchedules}
                                    </p>
                                </div>
                                <div className="p-3 bg-[#041562] rounded-[6px] text-white flex-shrink-0">
                                    <CalendarDaysIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        {/* Inspeksi Selesai */}
                        <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-200 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                        Inspeksi Selesai
                                    </p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-emerald-600 leading-tight">
                                        {teknisiStats.completedInspections}
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-[6px] border border-emerald-200 text-emerald-600 flex-shrink-0">
                                    <CheckCircleIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        {/* Inspeksi Pending */}
                        <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-200 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                        Inspeksi Pending
                                    </p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-amber-600 leading-tight">
                                        {teknisiStats.pendingInspections}
                                    </p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-[6px] border border-amber-200 text-amber-600 flex-shrink-0">
                                    <ClockIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        {/* Inspeksi Terlambat */}
                        <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-200 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                        Inspeksi Terlambat
                                    </p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-red-600 leading-tight">
                                        {teknisiStats.overdueInspections}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-[6px] border border-red-200 text-red-600 flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* My Schedules Section */}
                    <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="mb-5 lg:mb-6">
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1 leading-tight tracking-tight">
                                Jadwal Inspeksi Saya
                            </h3>
                            <p className="text-xs text-slate-500 leading-tight">
                                Jadwal inspeksi yang ditugaskan kepada Anda
                            </p>
                        </div>
                        <div className="space-y-3">
                            {mySchedules.length > 0 ? (
                                mySchedules.slice(0, 3).map((schedule) => {
                                    const StatusIcon = getStatusIcon(schedule);
                                    return (
                                        <div
                                            key={schedule.id}
                                            className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                                                        <FireIcon className="h-6 w-6 text-red-600" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {
                                                                schedule.apar
                                                                    ?.serial_number
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                schedule.apar
                                                                    ?.location_name
                                                            }
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${getStatusColor(
                                                                    schedule
                                                                )}`}
                                                            >
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {getStatusText(
                                                                    schedule
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 text-sm text-gray-600">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                                                <span>
                                                                    {formatScheduleDate(
                                                                        schedule,
                                                                        "id-ID",
                                                                        {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                                                <span>
                                                                    {formatScheduleTime(
                                                                        schedule
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/my-schedules`}
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                                                    >
                                                        <EyeIcon className="h-3 w-3" />
                                                        Lihat Detail
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium mb-2">
                                        Belum ada jadwal inspeksi
                                    </p>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Jadwal inspeksi akan muncul di sini
                                        setelah ditugaskan
                                    </p>
                                </div>
                            )}

                            {mySchedules.length > 3 && (
                                <div className="text-center pt-4">
                                    <Link
                                        to="/my-schedules"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                    >
                                        Lihat Semua Jadwal
                                        <ArrowPathIcon className="h-3 w-3 rotate-90" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {user?.role !== "teknisi" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* APAR Status Chart */}
                    <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="mb-5 lg:mb-6">
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1 leading-tight tracking-tight">
                                Status Kondisi APAR
                            </h3>
                            <p className="text-xs text-slate-500 leading-tight">
                                Distribusi kondisi operasional APAR
                            </p>
                        </div>
                        <div className="h-48 lg:h-64 mb-5 lg:mb-6">
                            <Doughnut
                                data={statusChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    cutout: "60%",
                                }}
                            />
                        </div>
                        <div className="space-y-2 lg:space-y-2.5">
                            {/* Chart Legend with Accurate Percentages (Total always 100%) */}
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-200">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Aktif
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                                        {aparStatusChart.active}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-1 leading-tight">
                                        ({percentages.active}%)
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Perlu Perbaikan
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-amber-600 text-xs sm:text-sm">
                                        {aparStatusChart.needsRepair}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-1 leading-tight">
                                        ({percentages.needsRepair}%)
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-[#DA1212] rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Nonaktif
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-[#DA1212] text-xs sm:text-sm">
                                        {aparStatusChart.inactive}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-1 leading-tight">
                                        ({percentages.inactive}%)
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-[#11468F] rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Sedang Perbaikan
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-[#11468F] text-xs sm:text-sm">
                                        {aparStatusChart.underRepair}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-1 leading-tight">
                                        ({percentages.underRepair}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Repair Status Chart */}
                    <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="mb-5 lg:mb-6">
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1 leading-tight tracking-tight">
                                Status Tiket Perbaikan
                            </h3>
                            <p className="text-xs text-slate-500 leading-tight">
                                Progress evaluasi perbaikan tabung
                            </p>
                        </div>
                        <div className="h-48 lg:h-64 mb-5 lg:mb-6">
                            <Doughnut
                                data={repairChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    cutout: "60%",
                                }}
                            />
                        </div>
                        <div className="space-y-2 lg:space-y-2.5">
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-200">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Disetujui
                                    </span>
                                </div>
                                <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                                    {repairStatusChart.approved}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Menunggu
                                    </span>
                                </div>
                                <span className="font-bold text-amber-600 text-xs sm:text-sm">
                                    {repairStatusChart.pending}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-[#DA1212] rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Ditolak
                                    </span>
                                </div>
                                <span className="font-bold text-[#DA1212] text-xs sm:text-sm">
                                    {repairStatusChart.rejected}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[3px] border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2.5 h-2.5 bg-[#11468F] rounded-[2px] flex-shrink-0"></div>
                                    <span className="text-xs text-slate-700 font-semibold leading-tight">
                                        Selesai
                                    </span>
                                </div>
                                <span className="font-bold text-[#11468F] text-xs sm:text-sm">
                                    {repairStatusChart.completed}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspections Chart */}
            {user?.role !== "teknisi" && (
                <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 lg:mb-6">
                        <div>
                            <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1 leading-tight tracking-tight">
                                Aktivitas Inspeksi Harian
                            </h3>
                            <p className="text-xs text-slate-500 leading-tight">
                                Volume inspeksi berhasil & perbaikan per hari
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDateFilter(!showDateFilter)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#11468F] hover:text-[#041562] uppercase tracking-wider transition-colors"
                        >
                            <FunnelIcon className="h-3.5 w-3.5" />
                            Filter Rentang
                        </button>
                    </div>

                    {/* Date Filter Panel */}
                    {showDateFilter && (
                        <div className="mb-5 lg:mb-6 p-4 bg-slate-50 rounded-[6px] border border-[#EEEEEE]">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Dari Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-150"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Sampai Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-150"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={handleDateFilter}
                                        className="bg-[#11468F] text-white px-4 py-2 rounded-[6px] hover:bg-[#0d3873] transition-all duration-150 text-xs font-semibold shadow-sm"
                                    >
                                        Terapkan Filter
                                    </button>
                                    <button
                                        onClick={resetDateFilter}
                                        className="bg-slate-200 text-slate-700 px-4 py-2 rounded-[6px] hover:bg-slate-300 transition-all duration-200 text-xs font-bold shadow-sm"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="h-48 lg:h-64 mb-5 lg:mb-6">
                        <Bar
                            data={inspectionChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: "top",
                                        labels: {
                                            usePointStyle: true,
                                            padding: 20,
                                            font: {
                                                size: 12,
                                            },
                                        },
                                    },
                                    tooltip: {
                                        mode: "index",
                                        intersect: false,
                                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                                        titleColor: "white",
                                        bodyColor: "white",
                                        borderColor: "rgba(255, 255, 255, 0.2)",
                                        borderWidth: 1,
                                        cornerRadius: 8,
                                        displayColors: true,
                                        callbacks: {
                                            title: function (context) {
                                                return context[0].label;
                                            },
                                            label: function (context) {
                                                return (
                                                    context.dataset.label +
                                                    ": " +
                                                    context.parsed.y
                                                );
                                            },
                                        },
                                    },
                                },
                                scales: {
                                    x: {
                                        stacked: true,
                                        grid: {
                                            color: "#f3f4f6",
                                        },
                                        ticks: {
                                            font: {
                                                size: 11,
                                            },
                                        },
                                    },
                                    y: {
                                        stacked: true,
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 1,
                                            font: {
                                                size: 11,
                                            },
                                        },
                                        grid: {
                                            color: "#f3f4f6",
                                        },
                                    },
                                },
                                interaction: {
                                    intersect: false,
                                },
                            }}
                        />
                    </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 p-4 lg:p-5 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                            <div className="text-xl lg:text-2xl font-bold text-emerald-600 mb-1">
                                {totalGoodInspections}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 font-medium">
                                Baik
                            </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                            <div className="text-xl lg:text-2xl font-bold text-amber-600 mb-1">
                                {totalNeedsRepairInspections}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 font-medium">
                                Perlu Perbaikan
                            </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                            <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                                {totalInspections}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 font-medium">
                                Total
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Section */}
            {user?.role !== "teknisi" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="mb-5 lg:mb-6">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">
                                Aksi Cepat
                            </h3>
                            <p className="text-xs lg:text-sm text-gray-500 leading-tight">
                                Akses fitur utama dengan mudah
                            </p>
                        </div>
                        <div className="space-y-3 lg:space-y-4">
                            <Link
                                to="/inspections/new"
                                className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all duration-200 group hover:shadow-sm"
                            >
                                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-200 flex-shrink-0">
                                    <FireIcon className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 mb-1 text-sm lg:text-base leading-tight">
                                        Inspeksi APAR Baru
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-600 leading-tight">
                                        Mulai inspeksi APAR sekarang
                                    </p>
                                </div>
                            </Link>

                            {user?.role === "admin" && (
                                <Link
                                    to="/repair-approvals"
                                    className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all duration-200 group hover:shadow-sm"
                                >
                                    <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-200 flex-shrink-0">
                                        <WrenchScrewdriverIcon className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 mb-1 text-sm lg:text-base leading-tight">
                                            Persetujuan Perbaikan
                                        </p>
                                        <p className="text-xs lg:text-sm text-gray-600 leading-tight">
                                            Tinjau dan setujui permintaan
                                            perbaikan
                                        </p>
                                    </div>
                                </Link>
                            )}

                            <Link
                                to="/my-repairs"
                                className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all duration-200 group hover:shadow-sm"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200 flex-shrink-0">
                                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 mb-1 text-sm lg:text-base leading-tight">
                                        Perbaikan Saya
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-600 leading-tight">
                                        Pantau status perbaikan yang diajukan
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Inspections */}
                    <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="mb-5 lg:mb-6">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">
                                Inspeksi Terbaru
                            </h3>
                            <p className="text-xs lg:text-sm text-gray-500 leading-tight">
                                5 inspeksi terakhir yang dilakukan
                            </p>
                        </div>
                        <div className="space-y-2.5 lg:space-y-3">
                            {recentInspections.length > 0 ? (
                                recentInspections
                                    .slice(0, 5)
                                    .map((inspection) => (
                                        <div
                                            key={inspection.id}
                                            className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300"
                                        >
                                            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                                <FireIcon className="h-4 w-4 text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate text-sm lg:text-base leading-tight">
                                                    APAR{" "}
                                                    {
                                                        inspection.apar
                                                            ?.serial_number
                                                    }
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs lg:text-sm text-gray-600">
                                                        {inspection.user?.name}
                                                    </span>
                                                    <span className="text-gray-400">
                                                        •
                                                    </span>
                                                    <span className="text-xs lg:text-sm text-gray-500">
                                                        {new Date(
                                                            inspection.created_at
                                                        ).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/apar/${inspection.apar?.id}`}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs lg:text-sm font-medium transition-colors flex-shrink-0"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                                Lihat
                                            </Link>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-8 lg:py-12">
                                    <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 lg:mb-4">
                                        <DocumentTextIcon className="h-6 lg:h-8 lg:w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium mb-1 text-sm lg:text-base">
                                        Belum ada inspeksi
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-400 leading-tight">
                                        Mulai inspeksi pertama Anda
                                    </p>
                                    <Link
                                        to="/inspections/new"
                                        className="inline-flex items-center gap-2 mt-4 text-red-600 hover:text-red-700 font-medium transition-colors"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Inspeksi Sekarang
                                    </Link>
                                </div>
                            )}
                        </div>
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
