import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Toast from '../components/Toast';
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
    XCircleIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const DashboardEnhanced = () => {
    const { apiClient, user } = useAuth();
    const [stats, setStats] = useState({
        totalApar: 0,
        activeApar: 0,
        pendingRepairs: 0,
        inactiveApar: 0,
        overdueInspections: 0,
    });
    const [recentInspections, setRecentInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aparStatusChart, setAparStatusChart] = useState({ active: 0, needsRepair: 0, inactive: 0, underRepair: 0 });
    const [repairStatusChart, setRepairStatusChart] = useState({ approved: 0, pending: 0, rejected: 0, completed: 0 });
    const [inspectionsByDate, setInspectionsByDate] = useState([]);
    const [dateRange, setDateRange] = useState([]);
    const [dateRangeInfo, setDateRangeInfo] = useState({ startDate: '', endDate: '' });
    
    // Date filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Upcoming inspections state
    const [upcomingInspections, setUpcomingInspections] = useState([]);
    const [upcomingInspectionsLoading, setUpcomingInspectionsLoading] = useState(true);
    const [sendingReminder, setSendingReminder] = useState(null);

    // Teknisi dashboard state
    const [teknisiStats, setTeknisiStats] = useState({
        totalAssignedSchedules: 0,
        completedInspections: 0,
        pendingInspections: 0,
        overdueInspections: 0,
        totalRepairs: 0,
        completedRepairs: 0,
        pendingRepairs: 0
    });
    const [mySchedules, setMySchedules] = useState([]);
    const [myInspections, setMyInspections] = useState([]);
    const [myRepairs, setMyRepairs] = useState([]);

    // Toast state
    const [toast, setToast] = useState({
        isOpen: false,
        type: 'success',
        message: '',
        duration: 4000
    });

    useEffect(() => {
        // Set default date range to current week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        
        const startDateStr = startOfWeek.toISOString().split('T')[0];
        const endDateStr = endOfWeek.toISOString().split('T')[0];
        
        setStartDate(startDateStr);
        setEndDate(endDateStr);
        
        // Fetch data with the correct date range
        fetchDashboardData(startDateStr, endDateStr);
        fetchUpcomingInspections(startDateStr, endDateStr); // Pass dates directly
        
        // Fetch teknisi data if user is teknisi
        if (user?.role === 'teknisi') {
            fetchTeknisiDashboardData();
        }
    }, []);

    const fetchDashboardData = async (start = startDate, end = endDate) => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/stats', {
                params: {
                    start_date: start,
                    end_date: end
                }
            });
            
            if (response.data.success) {
                setStats(response.data.data.stats);
                setAparStatusChart(response.data.data.aparStatusChart);
                setRepairStatusChart(response.data.data.repairStatusChart);
                setInspectionsByDate(response.data.data.inspectionsByDate || []);
                setDateRange(response.data.data.dateRange || []);
                setDateRangeInfo(response.data.data.dateRangeInfo || {});
                setRecentInspections(response.data.data.recentInspections || []);
                
            }
        } catch (error) {
            // Fallback to default data if API fails
            setStats({
                totalApar: 0,
                activeApar: 0,
                pendingRepairs: 0,
                inactiveApar: 0,
                overdueInspections: 0,
            });
            setAparStatusChart({ active: 0, needsRepair: 0, inactive: 0, underRepair: 0 });
            setRepairStatusChart({ approved: 0, pending: 0, rejected: 0, completed: 0 });
            setInspectionsByDate([]);
            setDateRange([]);
            setDateRangeInfo({ startDate: '', endDate: '' });
            setRecentInspections([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDateFilter = () => {
        if (startDate && endDate) {
            fetchDashboardData(startDate, endDate);
        }
    };

    const resetDateFilter = () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        setStartDate(startOfWeek.toISOString().split('T')[0]);
        setEndDate(endOfWeek.toISOString().split('T')[0]);
        fetchDashboardData(startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]);
    };

    const statusChartData = {
        labels: ['Aktif', 'Perlu Perbaikan', 'Nonaktif', 'Sedang Perbaikan'],
        datasets: [
            {
                data: [aparStatusChart.active, aparStatusChart.needsRepair, aparStatusChart.inactive, aparStatusChart.underRepair],
                backgroundColor: ['#059669', '#d97706', '#dc2626', '#2563eb'],
                borderWidth: 0,
                hoverBackgroundColor: ['#047857', '#b45309', '#b91c1c', '#1d4ed8'],
            },
        ],
    };

    const repairChartData = {
        labels: ['Disetujui', 'Menunggu', 'Ditolak', 'Selesai'],
        datasets: [
            {
                data: [repairStatusChart.approved, repairStatusChart.pending, repairStatusChart.rejected, repairStatusChart.completed],
                backgroundColor: ['#059669', '#d97706', '#dc2626', '#2563eb'],
                borderWidth: 0,
                hoverBackgroundColor: ['#047857', '#b45309', '#b91c1c', '#1d4ed8'],
            },
        ],
    };

    // Process inspection data for stacked bar chart
    const inspectionChartData = {
        labels: dateRange.map(day => {
            const dayNames = {
                'Monday': 'Sen',
                'Tuesday': 'Sel',
                'Wednesday': 'Rab',
                'Thursday': 'Kam',
                'Friday': 'Jum',
                'Saturday': 'Sab',
                'Sunday': 'Min'
            };
            return dayNames[day] || day;
        }),
        datasets: [
            {
                label: 'Baik',
                data: inspectionsByDate.map(item => item.good),
                backgroundColor: '#059669',
                borderRadius: 4,
                maxBarThickness: 40,
            },
            {
                label: 'Perlu Perbaikan',
                data: inspectionsByDate.map(item => item.needs_repair),
                backgroundColor: '#d97706',
                borderRadius: 4,
                maxBarThickness: 40,
            },
        ],
    };

    // Calculate totals for chart legends
    const totalApar = stats.totalApar; // Use the actual total from stats instead of calculating from chart data
    const totalRepairs = repairStatusChart.approved + repairStatusChart.pending + repairStatusChart.rejected + repairStatusChart.completed;
    
    // Helper function to calculate accurate percentages that total 100%
    const calculatePercentages = (active, needsRepair, inactive, underRepair, total) => {
        if (total === 0) return { active: 0, needsRepair: 0, inactive: 0, underRepair: 0 };
        
        // Calculate initial percentages
        let activePercent = Math.round((active / total) * 100);
        let needsRepairPercent = Math.round((needsRepair / total) * 100);
        let inactivePercent = Math.round((inactive / total) * 100);
        let underRepairPercent = Math.round((underRepair / total) * 100);
        
        // Calculate total percentage
        let totalPercent = activePercent + needsRepairPercent + inactivePercent + underRepairPercent;
        
        // If total is not 100%, adjust the largest value
        if (totalPercent !== 100) {
            const difference = 100 - totalPercent;
            
            // Find the largest category and adjust it
            if (active >= needsRepair && active >= inactive && active >= underRepair) {
                activePercent += difference;
            } else if (needsRepair >= active && needsRepair >= inactive && needsRepair >= underRepair) {
                needsRepairPercent += difference;
            } else if (inactive >= active && inactive >= needsRepair && inactive >= underRepair) {
                inactivePercent += difference;
            } else {
                underRepairPercent += difference;
            }
        }
        
        return { active: activePercent, needsRepair: needsRepairPercent, inactive: inactivePercent, underRepair: underRepairPercent };
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
    const totalInspections = inspectionsByDate.reduce((sum, item) => sum + item.total, 0);
    const totalGoodInspections = inspectionsByDate.reduce((sum, item) => sum + item.good, 0);
    const totalNeedsRepairInspections = inspectionsByDate.reduce((sum, item) => sum + item.needs_repair, 0);

    const fetchTeknisiDashboardData = async () => {
        try {
            // Fetch teknisi schedules
            const schedulesResponse = await apiClient.get('/api/schedules/my-schedules');
            console.log('Schedules response:', schedulesResponse.data);
            
            // API mengembalikan data langsung tanpa wrapper success
            const schedules = schedulesResponse.data || [];
            setMySchedules(schedules);
            
            // Calculate stats from schedules
            const now = new Date();
            const stats = {
                totalAssignedSchedules: schedules.length,
                completedInspections: schedules.filter(s => s.is_completed).length,
                pendingInspections: schedules.filter(s => !s.is_completed && new Date(s.scheduled_date) >= now).length,
                overdueInspections: schedules.filter(s => !s.is_completed && new Date(s.scheduled_date) < now).length,
                totalRepairs: 0,
                completedRepairs: 0,
                pendingRepairs: 0
            };
            setTeknisiStats(stats);
            
            console.log('Teknisi stats calculated:', stats);
        } catch (error) {
            console.error('Error fetching teknisi data:', error);
            // Set default empty state
            setMySchedules([]);
            setTeknisiStats({
                totalAssignedSchedules: 0,
                completedInspections: 0,
                pendingInspections: 0,
                overdueInspections: 0,
                totalRepairs: 0,
                completedRepairs: 0,
                pendingRepairs: 0
            });
        }
    };

    const fetchUpcomingInspections = async (startDateParam, endDateParam) => {
        try {
            setUpcomingInspectionsLoading(true);
            
            const response = await apiClient.get('/api/schedules/upcoming', {
                params: {
                    start_date: startDateParam,
                    end_date: endDateParam
                }
            });
            
            if (response.data.success) {
                const schedules = response.data.data.schedules || [];
                setUpcomingInspections(schedules);
            } else {
                setUpcomingInspections([]);
            }
        } catch (error) {
            setUpcomingInspections([]);
        } finally {
            setUpcomingInspectionsLoading(false);
        }
    };

    const showToast = (type, message, duration = 4000) => {
        setToast({
            isOpen: true,
            type,
            message,
            duration
        });
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, isOpen: false }));
    };

    // Helper functions for schedule status (same as SchedulesManagement.jsx)
    const getStatusColor = (schedule) => {
        const now = new Date();
        const scheduledDate = schedule.scheduled_date.split('T')[0];
        const scheduledDateTime = new Date(`${scheduledDate}T${schedule.start_time}`);
        const scheduledEndDateTime = new Date(`${scheduledDate}T${schedule.end_time}`);
        
        if (!schedule.is_active) {
            return 'bg-gray-100 text-gray-700';
        }
        
        // Priority order: today_ongoing > today_not_started > overdue > upcoming
        
        // Check if schedule is today and ongoing (within time window) - HIGHEST PRIORITY
        if (scheduledDate === now.toISOString().split('T')[0] && 
            now >= scheduledDateTime && now <= scheduledEndDateTime) {
            return 'bg-amber-100 text-amber-700';
        }
        
        // Check if schedule is today but not started yet - SECOND PRIORITY
        if (scheduledDate === now.toISOString().split('T')[0] && now < scheduledDateTime) {
            return 'bg-blue-100 text-blue-700';
        }
        
        // Check if schedule is overdue (past start time) - THIRD PRIORITY
        if (scheduledDateTime < now) {
            return 'bg-red-100 text-red-700';
        }
        
        // Future schedule - LOWEST PRIORITY
        return 'bg-emerald-100 text-emerald-700';
    };

    const getStatusText = (schedule) => {
        const now = new Date();
        const scheduledDate = schedule.scheduled_date.split('T')[0];
        const scheduledDateTime = new Date(`${scheduledDate}T${schedule.start_time}`);
        const scheduledEndDateTime = new Date(`${scheduledDate}T${schedule.end_time}`);
        
        if (!schedule.is_active) {
            return 'Nonaktif';
        }
        
        // Priority order: today_ongoing > today_not_started > overdue > upcoming
        
        // Check if schedule is today and ongoing (within time window) - HIGHEST PRIORITY
        if (scheduledDate === now.toISOString().split('T')[0] && 
            now >= scheduledDateTime && now <= scheduledEndDateTime) {
            return 'Hari ini (sedang berlangsung)';
        }
        
        // Check if schedule is today but not started yet - SECOND PRIORITY
        if (scheduledDate === now.toISOString().split('T')[0] && now < scheduledDateTime) {
            return 'Hari ini (belum dimulai)';
        }
        
        // Check if schedule is overdue (past start time) - THIRD PRIORITY
        if (scheduledDateTime < now) {
            return 'Terlambat';
        }
        
        // Future schedule - LOWEST PRIORITY
        return 'Akan datang';
    };

    const getStatusIcon = (schedule) => {
        const now = new Date();
        const scheduledDate = schedule.scheduled_date.split('T')[0];
        const scheduledDateTime = new Date(`${scheduledDate}T${schedule.start_time}`);
        const scheduledEndDateTime = new Date(`${scheduledDate}T${schedule.end_time}`);
        
        if (!schedule.is_active) {
            return XCircleIcon;
        }
        
        // Priority order: today_ongoing > today_not_started > overdue > upcoming
        
        // Check if schedule is today and ongoing (within time window) - HIGHEST PRIORITY
        if (scheduledDate === now.toISOString().split('T')[0] && 
            now >= scheduledDateTime && now <= scheduledEndDateTime) {
            return ClockIcon;
        }
        
        // Check if schedule is today but not started yet - SECOND PRIORITY
        if (scheduledDate === now.toISOString().split('T')[0] && now < scheduledDateTime) {
            return CalendarDaysIcon;
        }
        
        // Check if schedule is overdue (past start time) - THIRD PRIORITY
        if (scheduledDateTime < now) {
            return ExclamationTriangleIcon;
        }
        
        // Future schedule - LOWEST PRIORITY
        return CheckCircleIcon;
    };

    const getFrequencyText = (frequency) => {
        switch (frequency) {
            case 'daily':
                return 'Harian';
            case 'weekly':
                return 'Mingguan';
            case 'monthly':
                return 'Bulanan';
            case 'quarterly':
                return 'Per-3 Bulan';
            case 'semiannual':
                return 'Per-6 Bulan';
            case 'annual':
                return 'Tahunan';
            default:
                return frequency;
        }
    };

    const sendReminderEmail = async (schedule) => {
        // Validasi role admin
        if (user?.role !== 'admin') {
            showToast('error', 'Anda tidak memiliki akses untuk mengirim reminder email');
            return;
        }
        
        if (sendingReminder === schedule.id) return; // Prevent double clicks
        setSendingReminder(schedule.id);
        try {
            const response = await apiClient.post(`/api/schedules/${schedule.id}/send-reminder`);
            if (response.data.success) {
                const technicianName = response.data.data.technician_name || 'Teknisi';
                showToast('success', `Reminder email berhasil dikirim kepada ${technicianName} (${response.data.data.technician_email})!`);
                fetchUpcomingInspections(startDate, endDate); // Refresh list after sending reminder
            } else {
                showToast('error', 'Gagal mengirim reminder email: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error sending reminder email:', error);
            showToast('error', 'Gagal mengirim reminder email: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingReminder(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
                    <span className="text-gray-600 font-medium">Memuat data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                        <p className="text-red-100 text-lg">
                            Selamat datang kembali, <span className="font-semibold">{user?.name}</span>
                        </p>
                        <p className="text-red-200 text-sm mt-1">
                            Kelola dan pantau sistem APAR dengan mudah
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => fetchDashboardData()}
                            className="bg-white/20 backdrop-blur text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Refresh
                        </button>
                        <Link
                            to="/inspections/new"
                            className="bg-white text-red-600 px-5 py-2.5 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Inspeksi Baru
                        </Link>
                        {user?.role === 'admin' && (
                            <Link
                                to="/damage-categories"
                                className="bg-red-700 text-white px-5 py-2.5 rounded-lg hover:bg-red-800 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <CogIcon className="h-4 w-4" />
                                Kelola Kategori Kerusakan
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {user?.role !== 'teknisi' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Total APAR Card */}
                <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:shadow-red-50/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3 leading-tight">Total APAR</p>
                            <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">{stats.totalApar}</p>
                        </div>
                        <div className="p-2.5 lg:p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors duration-300 flex-shrink-0">
                            <FireIcon className="h-5 w-5 lg:h-6 lg:w-6 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Inspeksi Terlambat Card */}
                <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3 leading-tight">Inspeksi Terlambat</p>
                            <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 leading-tight">{stats.overdueInspections}</p>
                        </div>
                        <div className="p-2.5 lg:p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-300 flex-shrink-0">
                            <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* Jadwal Inspeksi Terdekat Component */}
            {user?.role !== 'teknisi' && (
            <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 lg:mb-6">
                    <div>
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Jadwal Inspeksi Terdekat</h3>
                        <p className="text-xs lg:text-sm text-gray-500 leading-tight">Kirim reminder email kepada teknisi untuk inspeksi yang akan datang</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => fetchUpcomingInspections(startDate, endDate)}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm lg:text-base"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {upcomingInspectionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                        <span className="ml-3 text-gray-600">Memuat jadwal...</span>
                    </div>
                ) : upcomingInspections.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingInspections.slice(0, 5).map((schedule) => {
                            const StatusIcon = getStatusIcon(schedule);
                            return (
                                <div key={schedule.id} className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="flex gap-4 flex-1">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                                                    <FireIcon className="h-6 w-6 text-red-600" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                    <h4 className="font-semibold text-gray-900 truncate">
                                                        {schedule.apar?.serial_number} - {schedule.apar?.location_name}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        {/* Status Aktif/Nonaktif */}
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            schedule.is_active 
                                                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                        }`}>
                                                            {schedule.is_active ? '🟢 Aktif' : '⚫ Nonaktif'}
                                                        </span>
                                                        {/* Status Jadwal */}
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule)}`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {getStatusText(schedule)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1.5 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{schedule.assigned_user?.name || "Teknisi tidak ditugaskan"}</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="truncate">{schedule.assigned_user?.email}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                                            <span>
                                                                {schedule.scheduled_date ? 
                                                                    new Date(schedule.scheduled_date).toLocaleDateString("id-ID", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    }) : 'Tanggal tidak valid'
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <ClockIcon className="w-4 h-4 text-gray-400" />
                                                            <span>{schedule.start_time} - {schedule.end_time}</span>
                                                        </div>
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full w-fit">
                                                            {getFrequencyText(schedule.frequency)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {schedule.notes && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-medium">Catatan:</span> {schedule.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-end sm:justify-start gap-2">
                                            {/* Tombol Kirim Reminder hanya untuk Admin */}
                                            {user?.role === 'admin' && (
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
                                            )}
                                            
                                            {/* Informasi untuk non-admin */}
                                            {user?.role !== 'admin' && (
                                                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                                                    Hanya admin yang dapat mengirim reminder
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
                                    Menampilkan 5 dari {upcomingInspections.length} jadwal terdekat
                                </p>
                                <Link
                                    to="/schedules"
                                    className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                >
                                    Lihat Semua Jadwal
                                    <ArrowPathIcon className="h-3 w-3 rotate-90" />
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium mb-2">Tidak ada jadwal inspeksi terdekat</p>
                        <p className="text-sm text-gray-400 mb-4">Semua jadwal inspeksi sudah selesai atau belum dijadwalkan</p>
                        <Link
                            to="/schedules"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Buat Jadwal Baru
                        </Link>
                    </div>
                )}
            </div>
            )}

            {/* Teknisi Dashboard Section */}
            {user?.role === 'teknisi' && (
                <div className="space-y-6 lg:space-y-8">
                    {/* Teknisi Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {/* Total Jadwal */}
                        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3 leading-tight">Total Jadwal</p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 leading-tight">{teknisiStats.totalAssignedSchedules}</p>
                                </div>
                                <div className="p-2.5 lg:p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-300 flex-shrink-0">
                                    <CalendarDaysIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Inspeksi Selesai */}
                        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:shadow-emerald-50/50 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3 leading-tight">Inspeksi Selesai</p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-emerald-600 leading-tight">{teknisiStats.completedInspections}</p>
                                </div>
                                <div className="p-2.5 lg:p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors duration-300 flex-shrink-0">
                                    <CheckCircleIcon className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" />
                                </div>
                            </div>
                        </div>

                        {/* Inspeksi Pending */}
                        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:shadow-amber-50/50 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3 leading-tight">Inspeksi Pending</p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-amber-600 leading-tight">{teknisiStats.pendingInspections}</p>
                                </div>
                                <div className="p-2.5 lg:p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors duration-300 flex-shrink-0">
                                    <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 text-amber-500" />
                                </div>
                            </div>
                        </div>

                        {/* Inspeksi Terlambat */}
                        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 hover:shadow-xl hover:shadow-red-50/50 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs lg:text-sm font-medium text-gray-500 mb-2 lg:mb-3 leading-tight">Inspeksi Terlambat</p>
                                    <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-red-600 leading-tight">{teknisiStats.overdueInspections}</p>
                                </div>
                                <div className="p-2.5 lg:p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors duration-300 flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 lg:h-6 lg:w-6 text-red-500" />
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* My Schedules Section */}
                    <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="mb-5 lg:mb-6">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Jadwal Inspeksi Saya</h3>
                            <p className="text-xs lg:text-sm text-gray-500 leading-tight">Jadwal inspeksi yang ditugaskan kepada Anda</p>
                        </div>
                        <div className="space-y-3">
                            {mySchedules.length > 0 ? (
                                mySchedules.slice(0, 3).map((schedule) => {
                                    const StatusIcon = getStatusIcon(schedule);
                                    return (
                                        <div key={schedule.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                                                        <FireIcon className="h-6 w-6 text-red-600" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                        <h4 className="font-semibold text-gray-900 truncate">
                                                            {schedule.apar?.serial_number} - {schedule.apar?.location_name}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule)}`}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {getStatusText(schedule)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5 text-sm text-gray-600">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                                                <span>
                                                                    {schedule.scheduled_date ? 
                                                                        new Date(schedule.scheduled_date).toLocaleDateString("id-ID", {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        }) : 'Tanggal tidak valid'
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                                                <span>{schedule.start_time} - {schedule.end_time}</span>
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
                                    <p className="text-gray-500 font-medium mb-2">Belum ada jadwal inspeksi</p>
                                    <p className="text-sm text-gray-400 mb-4">Jadwal inspeksi akan muncul di sini setelah ditugaskan</p>
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
            {user?.role !== 'teknisi' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* APAR Status Chart */}
                <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="mb-5 lg:mb-6">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Status APAR</h3>
                        <p className="text-xs lg:text-sm text-gray-500 leading-tight">Distribusi kondisi APAR</p>
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
                                cutout: '60%',
                            }}
                        />
                    </div>
                    <div className="space-y-2.5 lg:space-y-3">
                        {/* Chart Legend with Accurate Percentages (Total always 100%) */}
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-emerald-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Aktif</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-emerald-600 text-sm lg:text-base">{aparStatusChart.active}</span>
                                <span className="text-gray-500 text-xs lg:text-sm ml-1 leading-tight">
                                    ({percentages.active}%)
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-amber-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Perlu Perbaikan</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-amber-600 text-sm lg:text-base">{aparStatusChart.needsRepair}</span>
                                <span className="text-gray-500 text-xs lg:text-sm ml-1 leading-tight">
                                    ({percentages.needsRepair}%)
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-red-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Nonaktif</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-red-600 text-sm lg:text-base">{aparStatusChart.inactive}</span>
                                    <span className="text-gray-500 text-xs lg:text-sm ml-1 leading-tight">
                                    ({percentages.inactive}%)
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Sedang Perbaikan</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-blue-600 text-sm lg:text-base">{aparStatusChart.underRepair}</span>
                                    <span className="text-gray-500 text-xs lg:text-sm ml-1 leading-tight">
                                    ({percentages.underRepair}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Repair Status Chart */}
                <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="mb-5 lg:mb-6">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Status Perbaikan</h3>
                        <p className="text-xs lg:text-sm text-gray-500 leading-tight">Progress perbaikan APAR</p>
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
                                cutout: '60%',
                            }}
                        />
                    </div>
                    <div className="space-y-2.5 lg:space-y-3">
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-emerald-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Disetujui</span>
                            </div>
                            <span className="font-bold text-emerald-600 text-sm lg:text-base">{repairStatusChart.approved}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-amber-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Menunggu</span>
                            </div>
                            <span className="font-bold text-amber-600 text-sm lg:text-base">{repairStatusChart.pending}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-red-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Ditolak</span>
                            </div>
                            <span className="font-bold text-red-600 text-sm lg:text-base">{repairStatusChart.rejected}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 lg:p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                                <span className="text-xs lg:text-sm text-gray-700 font-medium leading-tight">Selesai</span>
                            </div>
                            <span className="font-bold text-blue-600 text-sm lg:text-base">{repairStatusChart.completed}</span>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* Inspections Chart */}
            {user?.role !== 'teknisi' && (
            <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 lg:mb-6">
                    <div>
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Inspeksi Harian</h3>
                        <p className="text-xs lg:text-sm text-gray-500 leading-tight">Aktivitas inspeksi per hari</p>
                    </div>
                    <button
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm lg:text-base"
                    >
                        <FunnelIcon className="h-4 w-4" />
                        Filter Tanggal
                    </button>
                </div>

                {/* Date Filter Panel */}
                {showDateFilter && (
                    <div className="mb-5 lg:mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleDateFilter}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                >
                                        Terapkan Filter
                                </button>
                                <button
                                    onClick={resetDateFilter}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
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
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 20,
                                        font: {
                                            size: 12
                                            }
                                        }
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        titleColor: 'white',
                                        bodyColor: 'white',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        borderWidth: 1,
                                        cornerRadius: 8,
                                        displayColors: true,
                                        callbacks: {
                                            title: function(context) {
                                                return context[0].label;
                                            },
                                            label: function(context) {
                                                return context.dataset.label + ': ' + context.parsed.y;
                                            }
                                        }
                                    }
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    grid: {
                                            color: '#f3f4f6',
                                    },
                                    ticks: {
                                        font: {
                                            size: 11
                                        }
                                    }
                                },
                                y: {
                                    stacked: true,
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1,
                                        font: {
                                            size: 11
                                        }
                                    },
                                    grid: {
                                        color: '#f3f4f6',
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
                        <div className="text-xl lg:text-2xl font-bold text-emerald-600 mb-1">{totalGoodInspections}</div>
                        <div className="text-xs lg:text-sm text-gray-600 font-medium">Baik</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                        <div className="text-xl lg:text-2xl font-bold text-amber-600 mb-1">{totalNeedsRepairInspections}</div>
                        <div className="text-xs lg:text-sm text-gray-600 font-medium">Perlu Perbaikan</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200">
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{totalInspections}</div>
                        <div className="text-xs lg:text-sm text-gray-600 font-medium">Total</div>
                    </div>
                </div>
            </div>
            )}

            {/* Bottom Section */}
            {user?.role !== 'teknisi' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="mb-5 lg:mb-6">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Aksi Cepat</h3>
                        <p className="text-xs lg:text-sm text-gray-500 leading-tight">Akses fitur utama dengan mudah</p>
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
                                <p className="font-semibold text-gray-900 mb-1 text-sm lg:text-base leading-tight">Inspeksi APAR Baru</p>
                                <p className="text-xs lg:text-sm text-gray-600 leading-tight">Mulai inspeksi APAR sekarang</p>
                            </div>
                        </Link>

                        {user?.role === 'admin' && (
                            <Link
                                to="/repair-approvals"
                                className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all duration-200 group hover:shadow-sm"
                            >
                                <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-200 flex-shrink-0">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 mb-1 text-sm lg:text-base leading-tight">Persetujuan Perbaikan</p>
                                    <p className="text-xs lg:text-sm text-gray-600 leading-tight">Tinjau dan setujui permintaan perbaikan</p>
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
                                <p className="font-semibold text-gray-900 mb-1 text-sm lg:text-base leading-tight">Perbaikan Saya</p>
                                <p className="text-xs lg:text-sm text-gray-600 leading-tight">Pantau status perbaikan yang diajukan</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Inspections */}
                <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="mb-5 lg:mb-6">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight">Inspeksi Terbaru</h3>
                        <p className="text-xs lg:text-sm text-gray-500 leading-tight">5 inspeksi terakhir yang dilakukan</p>
                    </div>
                    <div className="space-y-2.5 lg:space-y-3">
                        {recentInspections.length > 0 ? (
                            recentInspections.slice(0, 5).map((inspection) => (
                                <div key={inspection.id} className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300">
                                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                        <FireIcon className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate text-sm lg:text-base leading-tight">
                                            APAR {inspection.apar?.serial_number}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs lg:text-sm text-gray-600">{inspection.user?.name}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-xs lg:text-sm text-gray-500">
                                                {new Date(inspection.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/inspections/${inspection.id}`}
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
                                        <DocumentTextIcon className="h-6 h-6 lg:h-8 lg:w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium mb-1 text-sm lg:text-base">Belum ada inspeksi</p>
                                <p className="text-xs lg:text-sm text-gray-400 leading-tight">Mulai inspeksi pertama Anda</p>
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
