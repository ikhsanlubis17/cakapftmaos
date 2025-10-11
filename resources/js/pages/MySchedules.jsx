import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
    getScheduleWindow,
    formatScheduleDate,
    formatScheduleTime,
    getDaysUntilSchedule,
} from '../utils/scheduleTime';
import {
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    FireIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    BellIcon,
    UserIcon,
    CalendarDaysIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

const MySchedules = () => {
    const { user, apiClient } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    const { data: schedulesData, isLoading: schedulesLoading, refetch } = useQuery({
        queryKey: ['mySchedules'],
        queryFn: async () => {
            const res = await apiClient.get('/api/schedules/my-schedules');
            return res.data;
        },
        keepPreviousData: true,
        refetchInterval: 30000, // auto-refresh every 30s
        throwOnError: false,
    });

    useEffect(() => {
        setLoading(schedulesLoading);
    }, [schedulesLoading]);

    useEffect(() => {
        if (schedulesData) {
            console.log('Fetched schedules:', schedulesData);
            setSchedules(schedulesData);
            setError(null);
        }
    }, [schedulesData]);

    // handle errors from the query via the error state if needed

    const getStatusColor = (schedule) => {
        const { start } = getScheduleWindow(schedule);
        if (!start) return 'bg-gray-100 text-gray-800';

        const now = new Date();

        if (!schedule.is_active) {
            return 'bg-gray-100 text-gray-800';
        }

        if (schedule.is_completed) {
            return 'bg-green-100 text-green-800';
        }

        if (start < now) {
            return 'bg-red-100 text-red-800';
        }

        if (start.toDateString() === now.toDateString()) {
            return 'bg-yellow-100 text-yellow-800';
        }

        return 'bg-blue-100 text-blue-800';
    };

    const getStatusText = (schedule) => {
        const { start, end } = getScheduleWindow(schedule);
        const now = new Date();

        if (!start) {
            return 'Tidak diketahui';
        }

        if (!schedule.is_active) {
            return 'Nonaktif';
        }

        const endTime = end || new Date(start.getTime() + 60 * 60 * 1000);

        if (now >= start && now <= endTime) {
            return 'Hari ini (sedang berlangsung)';
        }

        if (start.toDateString() === now.toDateString() && now < start) {
            return 'Hari ini (belum dimulai)';
        }

        if (start < now) {
            return 'Terlambat';
        }

        return 'Akan datang';
    };


    const getStatusIcon = (schedule) => {
        const { start } = getScheduleWindow(schedule);
        if (!start) return <XCircleIcon className="h-5 w-5" />;

        const now = new Date();

        if (!schedule.is_active) {
            return <XCircleIcon className="h-5 w-5" />;
        }

        if (schedule.is_completed) {
            return <CheckCircleIcon className="h-5 w-5" />;
        }

        if (start < now) {
            return <ExclamationTriangleIcon className="h-5 w-5" />;
        }

        if (start.toDateString() === now.toDateString()) {
            return <BellIcon className="h-5 w-5" />;
        }

        return <CalendarIcon className="h-5 w-5" />;
    };

    const getFrequencyText = (frequency) => {
        switch (frequency) {
            case 'daily':
                return 'Harian';
            case 'weekly':
                return 'Mingguan';
            case 'monthly':
                return 'Bulanan';
            default:
                return frequency;
        }
    };

    const formatDate = (schedule) => formatScheduleDate(schedule);

    const formatTime = (schedule) => formatScheduleTime(schedule);

    const getDaysUntil = (schedule) => getDaysUntilSchedule(schedule);

    // Perbaiki logika summary cards untuk konsisten dengan status
    const todaySchedules = schedules.filter(schedule => {
        const { start } = getScheduleWindow(schedule);
        if (!start) return false;

        const now = new Date();
        return start.toDateString() === now.toDateString() && schedule.is_active && !schedule.is_completed;
    });

    const upcomingSchedules = schedules.filter(schedule => {
        const { start } = getScheduleWindow(schedule);
        if (!start) return false;

        const now = new Date();
        return start > now && schedule.is_active && !schedule.is_completed;
    });

    const overdueSchedules = schedules.filter(schedule => {
        const { start } = getScheduleWindow(schedule);
        if (!start) return false;

        const now = new Date();
        return start < now && !schedule.is_completed && schedule.is_active;
    });

    const completedSchedules = schedules.filter(schedule => schedule.is_completed);

    // Debug logging
    console.log('Summary cards calculation:', {
        totalSchedules: schedules.length,
        todaySchedules: todaySchedules.length,
        upcomingSchedules: upcomingSchedules.length,
        overdueSchedules: overdueSchedules.length,
        completedSchedules: completedSchedules.length,
        currentTime: new Date().toISOString(),
        sampleSchedule: schedules[0] ? {
            start_at: schedules[0].start_at,
            end_at: schedules[0].end_at,
            processed: getScheduleWindow(schedules[0])
        } : null
    });

    // Debug: Periksa duplikasi
    const allCategorizedSchedules = [
        ...todaySchedules.map(s => ({ id: s.id, category: 'today' })),
        ...upcomingSchedules.map(s => ({ id: s.id, category: 'upcoming' })),
        ...overdueSchedules.map(s => ({ id: s.id, category: 'overdue' })),
        ...completedSchedules.map(s => ({ id: s.id, category: 'completed' }))
    ];

    const scheduleIds = allCategorizedSchedules.map(s => s.id);
    const uniqueIds = [...new Set(scheduleIds)];

    console.log('Duplication check:', {
        totalCategorized: allCategorizedSchedules.length,
        uniqueIds: uniqueIds.length,
        hasDuplication: allCategorizedSchedules.length !== uniqueIds.length,
        categorizedSchedules: allCategorizedSchedules
    });

    // Perbaiki logika filter agar konsisten dengan summary cards
    const filteredSchedules = schedules.filter(schedule => {
        const matchesSearch = schedule.apar?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.apar?.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const { start } = getScheduleWindow(schedule);
        if (!start) return false;

        const now = new Date();

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'today' && start.toDateString() === now.toDateString() && schedule.is_active && !schedule.is_completed) ||
            (statusFilter === 'upcoming' && start > now && schedule.is_active && !schedule.is_completed) ||
            (statusFilter === 'overdue' && start < now && !schedule.is_completed && schedule.is_active) ||
            (statusFilter === 'completed' && schedule.is_completed);

        let matchesDate = true;
        if (dateFilter === 'this_week') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            matchesDate = start >= weekStart && start <= weekEnd;
        } else if (dateFilter === 'this_month') {
            const monthStart = new Date();
            monthStart.setDate(1);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
            matchesDate = start >= monthStart && start <= monthEnd;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat jadwal tugas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchMySchedules}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Jadwal Tugas Saya</h1>
                        <p className="text-gray-600 mt-1">
                            Daftar jadwal inspeksi APAR yang telah ditugaskan kepada Anda
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CalendarDaysIcon className="h-8 w-8 text-red-600" />
                        <span className="text-lg font-semibold text-gray-900">
                            {schedules.length} Jadwal
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BellIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Hari Ini</p>
                            <p className="text-2xl font-bold text-gray-900">{todaySchedules.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CalendarIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Akan Datang</p>
                            <p className="text-2xl font-bold text-gray-900">{upcomingSchedules.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Terlambat</p>
                            <p className="text-2xl font-bold text-gray-900">{overdueSchedules.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Selesai</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {completedSchedules.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Search */}
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                            Cari Jadwal
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="APAR, lokasi, atau catatan..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                            Filter Status
                        </label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        >
                            <option value="all">Semua Status</option>
                            <option value="today">Hari Ini</option>
                            <option value="upcoming">Akan Datang</option>
                            <option value="overdue">Terlambat</option>
                            <option value="completed">Selesai</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
                            Filter Periode
                        </label>
                        <select
                            id="date-filter"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        >
                            <option value="all">Semua Periode</option>
                            <option value="this_week">Minggu Ini</option>
                            <option value="this_month">Bulan Ini</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Schedules List */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                {filteredSchedules.length === 0 ? (
                    <div className="text-center py-12">
                        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada jadwal</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                ? 'Tidak ada jadwal yang sesuai dengan filter yang dipilih.'
                                : 'Anda belum memiliki jadwal tugas inspeksi APAR.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredSchedules.map((schedule) => (
                            <div key={schedule.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <FireIcon className="h-5 w-5 text-red-600" />
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {schedule.apar?.serial_number || 'APAR Tidak Diketahui'}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule)}`}>
                                                {getStatusIcon(schedule)}
                                                <span className="ml-1">{getStatusText(schedule)}</span>
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {schedule.apar?.location_name || 'Lokasi tidak diketahui'}
                                                    </span>
                                                    {schedule.apar?.location_type === 'mobile' ? (
                                                        <TruckIcon className="h-4 w-4 text-purple-500" />
                                                    ) : (
                                                        <MapPinIcon className="h-4 w-4 text-blue-500" />
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(schedule)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <ClockIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatTime(schedule)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <UserIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {getFrequencyText(schedule.frequency)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Jarak waktu:</span> {getDaysUntil(schedule)}
                                                </div>

                                                {schedule.notes && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Catatan:</span> {schedule.notes}
                                                    </div>
                                                )}

                                                {schedule.apar?.tank_truck && (
                                                    <div className="flex items-center space-x-2">
                                                        <TruckIcon className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-600">
                                                            Mobil Tangki: {schedule.apar.tank_truck.plate_number}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex flex-col items-end space-y-2">
                                        <button
                                            onClick={() => window.location.href = `/scan`}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <FireIcon className="h-4 w-4 mr-1" />
                                            Mulai Inspeksi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MySchedules; 
