import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    ClipboardDocumentCheckIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    EyeIcon,
    ChevronRightIcon,
    MapPinIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { formatScheduleDate, formatScheduleTime, getScheduleWindow } from '@/utils/scheduleTime';

interface DashboardStats {
    pending_reviews: number;
    today_inspections: number;
    upcoming_inspections: number;
}

interface InspectionPreview {
    id: number;
    condition: string;
    created_at: string;
    apar: {
        id: number;
        serial_number: string;
        location_name: string;
        apar_type?: {
            name: string;
        };
    };
    user: {
        id: number;
        name: string;
    };
    inspection_damages?: Array<{
        id: number;
        damage_category?: {
            name: string;
        };
    }>;
}

interface SchedulePreview {
    id: number;
    start_at: string;
    end_at?: string;
    is_completed: boolean;
    apar: {
        id: number;
        serial_number: string;
        location_name: string;
        apar_type?: {
            name: string;
        };
    };
    assigned_user?: {
        id: number;
        name: string;
    };
}

interface DashboardData {
    stats: DashboardStats;
    pending_reviews: InspectionPreview[];
    today_inspections: SchedulePreview[];
    upcoming_inspections: SchedulePreview[];
    recently_completed: InspectionPreview[];
}

const CheckerDashboard: React.FC = () => {
    const { apiClient, user } = useAuth();
    const { showError } = useToast();

    // Fetch checker dashboard data
    const {
        data: dashboardData,
        isLoading,
        error,
        refetch,
    } = useQuery<DashboardData>({
        queryKey: ['checker', 'dashboard'],
        queryFn: async () => {
            const res = await apiClient.get('/api/checker/dashboard');
            return res.data?.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 10000,
    });

    if (!user || user.role !== 'checker') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Akses Ditolak</h2>
                    <p className="text-gray-500 mt-2">Halaman ini hanya untuk Checker</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ArrowPathIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Error</h2>
                    <p className="text-gray-500 mt-2">Gagal memuat data dashboard</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    const stats = dashboardData?.stats || { pending_reviews: 0, today_inspections: 0, upcoming_inspections: 0 };
    const pendingReviews = dashboardData?.pending_reviews || [];
    const todayInspections = dashboardData?.today_inspections || [];
    const upcomingInspections = dashboardData?.upcoming_inspections || [];
    const recentlyCompleted = dashboardData?.recently_completed || [];

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Selamat Datang, {user?.name}
                    </h1>
                    <p className="text-gray-600 mt-1">Dashboard Checker - Review Inspeksi APAR</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <ClipboardDocumentCheckIcon className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Menunggu Review</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.pending_reviews}</p>
                            </div>
                        </div>
                        {stats.pending_reviews > 0 && (
                            <Link
                                to="/checker/pending-review"
                                className="mt-4 flex items-center text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                            >
                                Lihat semua
                                <ChevronRightIcon className="h-4 w-4 ml-1" />
                            </Link>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Inspeksi Hari Ini</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.today_inspections}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ClockIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Akan Datang</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.upcoming_inspections}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Reviews Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Inspeksi Menunggu Review
                                </h2>
                                {pendingReviews.length > 0 && (
                                    <span className="px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                        {pendingReviews.length} inspeksi
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {pendingReviews.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-3" />
                                    <p className="text-gray-500">Tidak ada inspeksi yang perlu direview</p>
                                </div>
                            ) : (
                                pendingReviews.slice(0, 5).map((inspection) => (
                                    <div
                                        key={inspection.id}
                                        className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => window.location.href = `/checker/review/${inspection.id}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <span className="font-medium text-gray-900">
                                                        {inspection.apar?.serial_number}
                                                    </span>
                                                    <span
                                                        className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                                            inspection.condition === 'good'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {inspection.condition === 'good' ? 'Baik' : 'Rusak'}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500 flex items-center">
                                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                                    {inspection.apar?.location_name}
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500 flex items-center">
                                                    <UserIcon className="h-4 w-4 mr-1" />
                                                    {inspection.user?.name}
                                                </div>
                                                {inspection.inspection_damages && inspection.inspection_damages.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {inspection.inspection_damages.slice(0, 3).map((damage) => (
                                                            <span
                                                                key={damage.id}
                                                                className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded"
                                                            >
                                                                {damage.damage_category?.name}
                                                            </span>
                                                        ))}
                                                        {inspection.inspection_damages.length > 3 && (
                                                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                                                +{inspection.inspection_damages.length - 3} lainnya
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <button className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {pendingReviews.length > 5 && (
                            <div className="px-6 py-4 border-t border-gray-100">
                                <Link
                                    to="/checker/pending-review"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
                                >
                                    Lihat semua ({pendingReviews.length} inspeksi)
                                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Today's Inspections Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Jadwal Inspeksi Hari Ini
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {todayInspections.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Tidak ada jadwal inspeksi hari ini</p>
                                </div>
                            ) : (
                                todayInspections.map((schedule) => {
                                    const { start, end } = getScheduleWindow(schedule);
                                    return (
                                        <div key={schedule.id} className="px-6 py-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {schedule.apar?.serial_number}
                                                    </div>
                                                    <div className="mt-1 text-sm text-gray-500 flex items-center">
                                                        <MapPinIcon className="h-4 w-4 mr-1" />
                                                        {schedule.apar?.location_name}
                                                    </div>
                                                    <div className="mt-1 text-sm text-gray-500 flex items-center">
                                                        <UserIcon className="h-4 w-4 mr-1" />
                                                        Teknisi: {schedule.assigned_user?.name || 'Belum ditugaskan'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-blue-600">
                                                        {formatScheduleTime(schedule)}
                                                    </div>
                                                    <div
                                                        className={`mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                                            schedule.is_completed
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {schedule.is_completed ? 'Selesai' : 'Menunggu'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Upcoming Inspections */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Inspeksi Akan Datang
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {upcomingInspections.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Tidak ada jadwal inspeksi mendatang</p>
                                </div>
                            ) : (
                                upcomingInspections.slice(0, 5).map((schedule) => (
                                    <div key={schedule.id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {schedule.apar?.serial_number}
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500 flex items-center">
                                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                                    {schedule.apar?.location_name}
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500 flex items-center">
                                                    <UserIcon className="h-4 w-4 mr-1" />
                                                    Teknisi: {schedule.assigned_user?.name || 'Belum ditugaskan'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-700">
                                                    {formatScheduleDate(schedule)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatScheduleTime(schedule)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recently Completed Reviews */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Review Terbaru
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentlyCompleted.length === 0 ? (
                                <div className="px-6 py-8 text-center">
                                    <CheckCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Belum ada review yang diselesaikan</p>
                                </div>
                            ) : (
                                recentlyCompleted.map((inspection) => (
                                    <div key={inspection.id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center">
                                                    <span className="font-medium text-gray-900">
                                                        {inspection.apar?.serial_number}
                                                    </span>
                                                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    {inspection.apar?.location_name}
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    Teknisi: {inspection.user?.name}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(inspection.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/checker/pending-review"
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                            Review Inspeksi
                        </Link>
                        <Link
                            to="/checker/schedules"
                            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <CalendarDaysIcon className="h-5 w-5 mr-2" />
                            Jadwal Saya
                        </Link>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckerDashboard;
