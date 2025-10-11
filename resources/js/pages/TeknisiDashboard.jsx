import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Toast from '../components/Toast';
import {
    CheckCircleIcon,
    ClockIcon,
    CalendarDaysIcon,
    ArrowPathIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

const TeknisiDashboard = () => {
    const { user, apiClient } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Teknisi dashboard state - hanya data yang relevan untuk teknisi
    const [teknisiStats, setTeknisiStats] = useState({
        totalAssignedSchedules: 0,
        completedInspections: 0,
        pendingInspections: 0,
        thisWeekSchedules: 0,
        nextWeekSchedules: 0
    });
    
    const [mySchedules, setMySchedules] = useState([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    
    // Toast state
    const [toast, setToast] = useState({
        isOpen: false,
        type: 'success',
        message: '',
        duration: 4000
    });

    const teknisiSchedulesQuery = useQuery({
        queryKey: ['schedules', 'my-schedules'],
        queryFn: async () => {
            const res = await apiClient.get('/api/schedules/my-schedules');
            // match earlier code which expected { success, data }
            return res.data;
        },
        enabled: Boolean(user && user.role === 'teknisi'),
        staleTime: 1000 * 30, // 30s
    });

    useEffect(() => {
        if (!user || user.role !== 'teknisi') return;

        if (teknisiSchedulesQuery.isLoading) {
            setLoading(true);
            return;
        }

        if (teknisiSchedulesQuery.isError) {
            console.error('Error fetching teknisi data:', teknisiSchedulesQuery.error);
            showToast('error', 'Gagal memuat data dashboard');
            setLoading(false);
            return;
        }

        if (teknisiSchedulesQuery.data) {
            const payload = teknisiSchedulesQuery.data;
            const schedules = payload.data || (Array.isArray(payload) ? payload : []);
            setMySchedules(schedules);

            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const thisWeekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
            const thisWeekEnd = new Date(thisWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

            const stats = {
                totalAssignedSchedules: schedules.length,
                completedInspections: schedules.filter(s => s.is_completed).length,
                pendingInspections: schedules.filter(s => !s.is_completed && new Date(s.scheduled_date) >= now).length,
                thisWeekSchedules: schedules.filter(s => {
                    const scheduleDate = new Date(s.scheduled_date);
                    return scheduleDate >= thisWeekStart && scheduleDate <= thisWeekEnd;
                }).length,
                nextWeekSchedules: schedules.filter(s => {
                    const scheduleDate = new Date(s.scheduled_date);
                    return scheduleDate > thisWeekEnd && scheduleDate <= nextWeek;
                }).length
            };
            setTeknisiStats(stats);

            const upcomingSchedules = schedules
                .filter(s => !s.is_completed && new Date(s.scheduled_date) >= now)
                .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
                .slice(0, 5);
            setUpcomingDeadlines(upcomingSchedules);
        }

        setLoading(false);
    }, [user, teknisiSchedulesQuery.data, teknisiSchedulesQuery.isLoading, teknisiSchedulesQuery.isError]);

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

    // Helper function untuk format tanggal
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Helper function untuk format waktu
    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
                    <span className="text-gray-600 font-medium">Memuat dashboard teknisi...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section - Khusus untuk teknisi */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="text-white">
                            <h1 className="text-3xl font-bold mb-2">Dashboard Teknisi</h1>
                            <p className="text-green-100 text-lg">
                                Selamat datang kembali, <span className="font-semibold">{user?.name}</span>
                            </p>
                            <p className="text-green-200 text-sm mt-1">
                                Kelola jadwal inspeksi dan pantau kinerja Anda
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={fetchTeknisiDashboardData}
                                className="bg-white/20 backdrop-blur text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                    Refresh
                            </button>
                            <Link
                                to="/inspections/new"
                                className="bg-white text-green-600 px-5 py-2.5 rounded-lg hover:bg-green-50 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Mulai Inspeksi
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics Overview - Hanya statistik yang relevan untuk teknisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Total Jadwal yang Ditugaskan */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-green-50/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 mb-3">Jadwal Ditugaskan</p>
                                <p className="text-3xl font-bold text-green-600">{teknisiStats.totalAssignedSchedules}</p>
                                <p className="text-xs text-gray-500 mt-1">Total jadwal untuk Anda</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors duration-300 flex-shrink-0">
                                <CalendarDaysIcon className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Inspeksi Selesai */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-emerald-50/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 mb-3">Sudah Selesai</p>
                                <p className="text-3xl font-bold text-emerald-600">{teknisiStats.completedInspections}</p>
                                <p className="text-xs text-gray-500 mt-1">Inspeksi berhasil</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors duration-300 flex-shrink-0">
                                <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Inspeksi Pending */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:shadow-amber-50/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 mb-3">Menunggu</p>
                                <p className="text-3xl font-bold text-amber-600">{teknisiStats.pendingInspections}</p>
                                <p className="text-xs text-gray-500 mt-1">Belum dikerjakan</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors duration-300 flex-shrink-0">
                                <ClockIcon className="h-8 w-8 text-amber-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid - Hanya konten yang relevan untuk teknisi */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Jadwal Inspeksi Saya */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Jadwal Inspeksi Saya</h3>
                                <p className="text-sm text-gray-500 mt-1">Jadwal yang ditugaskan kepada Anda</p>
                            </div>
                            <Link
                                to="/schedules"
                                className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                            >
                                Lihat Semua
                            </Link>
                        </div>
                        
                        <div className="space-y-4">
                            {mySchedules.length > 0 ? (
                                mySchedules.slice(0, 4).map((schedule) => (
                                    <div key={schedule.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                                                    <PlusIcon className="h-6 w-6 text-red-600" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 truncate">
                                                    {schedule.apar?.serial_number} - {schedule.apar?.location_name}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(schedule.scheduled_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4 text-gray-400" />
                                                        <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/inspections/new?schedule=${schedule.id}`}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all duration-200"
                                                >
                                                    <PlusIcon className="h-3 w-3" />
                                                    Mulai
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium mb-2">Belum ada jadwal inspeksi</p>
                                    <p className="text-sm text-gray-400 mb-4">Jadwal inspeksi akan muncul di sini setelah ditugaskan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Deadline Mendatang */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Deadline Mendatang</h3>
                                <p className="text-sm text-gray-500 mt-1">Jadwal yang perlu segera ditangani</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {upcomingDeadlines.length > 0 ? (
                                upcomingDeadlines.map((schedule) => (
                                    <div key={schedule.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <ClockIcon className="h-5 w-5 text-amber-600" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 truncate">
                                                    {schedule.apar?.serial_number}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {schedule.apar?.location_name}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-amber-700">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDaysIcon className="w-4 h-4" />
                                                        <span>{formatDate(schedule.scheduled_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4" />
                                                        <span>{formatTime(schedule.start_time)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/inspections/new?schedule=${schedule.id}`}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-all duration-200"
                                                >
                                                    <PlusIcon className="h-3 w-3" />
                                                    Mulai
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                                    </div>
                                    <p className="text-gray-500 font-medium mb-2">Tidak ada deadline mendatang</p>
                                    <p className="text-sm text-gray-400">Semua jadwal sudah terjadwal dengan baik</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Weekly Overview - Hanya overview yang relevan untuk teknisi */}
                <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Ringkasan Mingguan</h3>
                        <p className="text-sm text-gray-500 mt-1">Overview jadwal untuk minggu ini dan minggu depan</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{teknisiStats.thisWeekSchedules}</p>
                            <p className="text-sm text-gray-600 mt-1">Jadwal Minggu Ini</p>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ClockIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{teknisiStats.nextWeekSchedules}</p>
                            <p className="text-sm text-gray-600 mt-1">Jadwal Minggu Depan</p>
                        </div>
                    </div>
                </div>
            </div>

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

export default TeknisiDashboard;


