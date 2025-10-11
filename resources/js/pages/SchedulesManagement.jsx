import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
// replaced axios usage with apiClient from useAuth + react-query
import {
    BellIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    FireIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

const SchedulesManagement = () => {
    const { user, apiClient } = useAuth();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const [schedules, setSchedules] = useState([]);
    const [apars, setApars] = useState([]);
    const [teknisi, setTeknisi] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [showScheduleDetail, setShowScheduleDetail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [sendingNotifications, setSendingNotifications] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0
    });
    const [formData, setFormData] = useState({
        apar_id: '',
        assigned_user_id: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        frequency: 'weekly',
        is_active: true,
        notes: ''
    });
    const [errors, setErrors] = useState({});

    // Queries: apars, users (teknisi), schedules (with pagination/filters)
    const { data: aparData, isLoading: aparLoading, isError: aparError } = useQuery({
        queryKey: ['apars'],
        queryFn: async () => {
            const res = await apiClient.get('/api/apar');
            return res.data;
        },
        staleTime: 1000 * 60, // 1 minute
    });

    const { data: usersData, isLoading: usersLoading, isError: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await apiClient.get('/api/users');
            return res.data;
        },
        staleTime: 1000 * 60,
    });

    const {
        data: schedulesData,
        isLoading: schedulesLoading,
        isError: schedulesError,
        refetch: schedulesRefetch
    } = useQuery({
        queryKey: ['schedules', pagination.current_page, pagination.per_page, searchTerm, statusFilter, activeFilter],
        queryFn: async () => {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                _t: Date.now()
            };
            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter !== 'all') params.status = statusFilter;
            if (activeFilter !== 'all') params.active = activeFilter;

            const res = await apiClient.get('/api/schedules', { params });
            return res.data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 30,
    });

    // derive loading state from react-query hooks instead of local flag
    const combinedLoading = aparLoading || usersLoading || schedulesLoading;

    // Modal styles
    useEffect(() => {
        if (showModal || showScheduleDetail) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal, showScheduleDetail]);

    // Debounced search effect with improved logic
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim() || statusFilter !== 'all' || activeFilter !== 'all') {
                setSearchLoading(true);
                // reset to page 1
                setPagination(prev => ({ ...prev, current_page: 1 }));
                schedulesRefetch().finally(() => setSearchLoading(false));
            }
        }, 300); // Reduced debounce time for better responsiveness

        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, activeFilter]);

    // Immediate fetch when filters are reset to 'all'
    useEffect(() => {
        if (statusFilter === 'all' && activeFilter === 'all' && !searchTerm.trim()) {
            setPagination(prev => ({ ...prev, current_page: 1 }));
            if (schedulesRefetch) schedulesRefetch();
        }
    }, [statusFilter, activeFilter, searchTerm]);

    // Reset pagination when filters change
    useEffect(() => {
        if (pagination.current_page !== 1) {
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }
    }, [statusFilter, activeFilter]);

    // Update local state from queries when data arrives
    useEffect(() => {
        if (schedulesData) {
            try {
                const schedulesRes = schedulesData;
                const schedulesDataInner = schedulesRes.data || schedulesRes;
                let validSchedules = Array.isArray(schedulesData.data ? schedulesData.data : schedulesData)
                    ? (schedulesDataInner.data || schedulesDataInner).filter(schedule =>
                        schedule && schedule.id && schedule.apar_id && schedule.assigned_user_id && schedule.scheduled_date && schedule.start_time
                    ) : [];

                // Additional client-side validation to ensure filter consistency
                if (statusFilter !== 'all' || activeFilter !== 'all') {
                    validSchedules = validSchedules.filter(schedule => {
                        if (activeFilter !== 'all') {
                            if (activeFilter === 'active' && !schedule.is_active) return false;
                            if (activeFilter === 'inactive' && schedule.is_active) return false;
                        }

                        if (statusFilter !== 'all') {
                            const now = new Date();
                            const scheduledDate = schedule.scheduled_date.split('T')[0];
                            const scheduledDateTime = new Date(`${scheduledDate}T${schedule.start_time}`);
                            const today = now.toISOString().split('T')[0];

                            switch (statusFilter) {
                                case 'overdue':
                                    if (scheduledDateTime >= now) return false;
                                    break;
                                case 'today':
                                    if (scheduledDate !== today) return false;
                                    break;
                                case 'upcoming':
                                    if (scheduledDateTime <= now) return false;
                                    break;
                            }
                        }

                        return true;
                    });
                }

                setSchedules(validSchedules);

                // Update pagination
                const meta = schedulesRes.data || schedulesRes;
                setPagination(prev => ({
                    ...prev,
                    current_page: meta.current_page || prev.current_page,
                    last_page: meta.last_page || prev.last_page,
                    per_page: meta.per_page || prev.per_page,
                    total: meta.total || validSchedules.length,
                }));
            } catch (e) {
                console.error('Error processing schedules data', e);
            }
        }

        if (schedulesError) {
            showError('Gagal memuat data jadwal');
        }
    }, [schedulesData, schedulesError]);

    useEffect(() => {
        if (aparData) {
            const validApars = Array.isArray(aparData) ? aparData.filter(a => a && a.id) : [];
            setApars(validApars);
        }
    }, [aparData]);

    useEffect(() => {
        if (usersData) {
            const validTeknisi = Array.isArray(usersData)
                ? usersData.filter(u => u && u.id && u.role === 'teknisi')
                : [];
            setTeknisi(validTeknisi);
        }
    }, [usersData]);

    const scheduleMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            if (id) {
                const res = await apiClient.put(`/api/schedules/${id}`, payload);
                return res.data;
            }
            const res = await apiClient.post('/api/schedules', payload);
            return res.data;
        },
        onMutate: () => {
            setSubmitting(true);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setSubmitted(true);
            setTimeout(() => {
                setShowModal(false);
                setEditingSchedule(null);
                resetForm();
                setSubmitted(false);

                const action = variables.id ? 'diperbarui' : 'dibuat';
                const notificationText = variables.id ? 'dan notifikasi telah dikirim kembali ke teknisi' : 'dan notifikasi telah dikirim ke teknisi yang ditugaskan';
                showSuccess(`Jadwal berhasil ${action} ${notificationText}.`);
            }, 1000);
        },
        onError: (error) => {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                showError('Mohon periksa kembali data yang diisi');
            } else if (error.response?.data?.message) {
                showError(error.response.data.message);
            } else if (error.message) {
                showError(error.message);
            } else {
                showError('Gagal menyimpan jadwal');
            }
        },
        onSettled: () => {
            setSubmitting(false);
        }
    });

    // top-level mutation for sending notifications - accepts endpoint as variable
    const sendNotificationsMutation = useMutation({
        mutationFn: async (endpoint) => {
            const res = await apiClient.post(endpoint);
            return res.data;
        },
        onMutate: () => setSendingNotifications(true),
        onSuccess: (data) => showSuccess(`Berhasil mengirim ${data.sent_count} notifikasi`),
        onError: () => showError('Gagal mengirim notifikasi'),
        onSettled: () => setSendingNotifications(false)
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const payload = { ...formData };
        scheduleMutation.mutate({ id: editingSchedule?.id, payload });
    };

    // All other existing functions remain the same (validateForm, handleEdit, handleShow, handleDelete, etc.)
    const validateForm = () => {
        const newErrors = {};

        if (!formData.apar_id || formData.apar_id === '') {
            newErrors.apar_id = 'APAR wajib dipilih';
        }
        
        if (!formData.assigned_user_id || formData.assigned_user_id === '') {
            newErrors.assigned_user_id = 'Teknisi wajib dipilih';
        } else {
            const selectedUser = teknisi.find(user => user.id == formData.assigned_user_id);
            if (!selectedUser) {
                newErrors.assigned_user_id = 'Teknisi yang dipilih tidak ditemukan';
            } else if (selectedUser.role !== 'teknisi') {
                newErrors.assigned_user_id = 'User yang dipilih harus berperan sebagai teknisi';
            } else if (!selectedUser.email) {
                newErrors.assigned_user_id = 'Teknisi yang dipilih harus memiliki email';
            }
        }
        
        if (!formData.scheduled_date || formData.scheduled_date === '') {
            newErrors.scheduled_date = 'Tanggal wajib diisi';
        } else {
            if (!editingSchedule) {
                const selectedDate = new Date(formData.scheduled_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    newErrors.scheduled_date = 'Tanggal tidak boleh di masa lalu';
                }
            }
        }
        
        if (!formData.start_time || formData.start_time === '') {
            newErrors.start_time = 'Waktu mulai wajib diisi';
        }

        if (!formData.end_time || formData.end_time === '') {
            newErrors.end_time = 'Batas waktu wajib diisi';
        }
        
        if (!formData.frequency || !['weekly', 'monthly', 'quarterly', 'semiannual'].includes(formData.frequency)) {
            newErrors.frequency = 'Frekuensi wajib dipilih';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
            notes: schedule.notes || ''
        });
        setShowModal(true);
    };

    const handleShow = (schedule) => {
        setShowScheduleDetail(schedule);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.delete(`/api/schedules/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            showSuccess('Jadwal berhasil dihapus');
        },
        onError: (error) => {
            if (error.response?.status === 404) {
                showError('Jadwal tidak ditemukan atau sudah dihapus');
                if (schedulesRefetch) schedulesRefetch();
            } else {
                showError('Gagal menghapus jadwal');
            }
        }
    });

    const handleDelete = async (scheduleId) => {
        if (!scheduleId) {
            showError('ID jadwal tidak valid untuk dihapus');
            return;
        }
        
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus',
            message: 'Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.',
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (confirmed) {
            deleteMutation.mutate(scheduleId);
        }
    };

    const handleSendNotifications = async () => {
        // Show notification type selection modal
        setShowNotificationModal(true);
    };

    const sendNotificationByType = async (type) => {
        setShowNotificationModal(false);
        
        let message = '';
        let endpoint = '';
        
                    if (type === 'today') {
                message = 'Apakah Anda yakin ingin mengirim notifikasi reminder untuk jadwal yang sedang berlangsung?';
            endpoint = '/api/notifications/bulk';
        } else if (type === 'all') {
            message = 'Apakah Anda yakin ingin mengirim notifikasi reminder untuk semua jadwal aktif?';
            endpoint = '/api/notifications/bulk-all';
        }
        
        const confirmed = await confirm({
            title: 'Konfirmasi Kirim Notifikasi',
            message: message,
            type: 'info',
            confirmText: 'Ya, Kirim',
            cancelText: 'Batal',
            confirmButtonColor: 'blue'
        });

        if (confirmed) {
            // trigger top-level mutation with chosen endpoint
            sendNotificationsMutation.mutate(endpoint);
        }
    };

    const resetForm = () => {
        setFormData({
            apar_id: '',
            assigned_user_id: '',
            scheduled_date: '',
            start_time: '',
            end_time: '',
            frequency: 'weekly',
            is_active: true,
            notes: ''
        });
        setErrors({});
        setSubmitted(false);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setActiveFilter('all');
        // Force immediate data fetch without waiting for useEffect
        fetchData(1);
    };

    const clearSearch = () => {
        setSearchTerm('');
        fetchData(1);
    };

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

    const handleChange = React.useCallback((e) => {
        const { name, value, type, checked } = e.target;
        
        const safeValue = type === 'checkbox' ? checked : (value || '');
        
        setFormData(prev => ({
            ...prev,
            [name]: safeValue
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }, [errors]);

    const getFrequencyText = (frequency) => {
        switch (frequency) {
            case 'weekly':
                return 'Perminggu';
            case 'monthly':
                return 'Perbulan';
            case 'quarterly':
                return 'Per-3 Bulan';
            case 'semiannual':
                return 'Per-6 Bulan';
            default:
                return frequency;
        }
    };

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
            return CalendarIcon;
        }
        
        // Check if schedule is overdue (past start time) - THIRD PRIORITY
        if (scheduledDateTime < now) {
            return ExclamationTriangleIcon;
        }
        
        // Future schedule - LOWEST PRIORITY
        return CheckCircleIcon;
    };

    const handlePageChange = (page) => {
        fetchData(page);
    };

    // helper to change page and trigger refetch; schedulesQuery key depends on pagination
    const fetchData = (page = 1) => {
        setPagination(prev => ({ ...prev, current_page: page }));
        // calling refetch ensures immediate update for interactive actions
        if (schedulesRefetch) schedulesRefetch();
    };

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
                            <button
                                onClick={handleSendNotifications}
                                disabled={sendingNotifications}
                                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 disabled:opacity-50"
                            >
                                {sendingNotifications ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                        <span className="hidden sm:inline">Mengirim...</span>
                                        <span className="sm:hidden">Mengirim</span>
                                    </>
                                ) : (
                                    <>
                                        <BellIcon className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Kirim Notifikasi</span>
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="mb-4 sm:mb-6">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                Cari Jadwal
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {searchLoading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-red-500 border-t-transparent"></div>
                                    ) : (
                                        <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari berdasarkan APAR, lokasi, atau teknisi..."
                                    className="block w-full pl-9 sm:pl-10 pr-12 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                        title="Clear search"
                                    >
                                        <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                Filter Status Jadwal
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                            >
                                <option value="all">Semua Status</option>
                                <option value="overdue">Terlambat</option>
                                <option value="today">Hari ini</option>
                                <option value="upcoming">Akan Datang</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                Filter Status Aktif
                            </label>
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="block w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Filter Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <span>Filter aktif:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    Pencarian: "{searchTerm}"
                                    <button
                                        onClick={clearSearch}
                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                                    Status: {statusFilter === 'overdue' ? 'Terlambat' : statusFilter === 'today' ? 'Hari ini' : 'Akan Datang'}
                                </span>
                            )}
                            {activeFilter !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                    Aktif: {activeFilter === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            )}
                        </div>
                        
                        {(searchTerm || statusFilter !== 'all' || activeFilter !== 'all') && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                            >
                                Reset Semua Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedules List */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {combinedLoading ? (
                    <div className="text-center py-12 sm:py-16">
                        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-2 border-red-500 border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                        <p className="text-gray-600 font-medium">Memuat data...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                            {pagination.total === 0
                                ? "Tidak ada jadwal"
                                : "Tidak ada hasil"}
                        </h3>
                        <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                            {pagination.total === 0
                                ? "Belum ada jadwal inspeksi yang dibuat"
                                : searchTerm || statusFilter !== 'all' || activeFilter !== 'all'
                                    ? "Tidak ada jadwal yang sesuai dengan filter yang dipilih"
                                    : "Tidak ada jadwal yang tersedia"}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                            {pagination.total === 0 ? (
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                                >
                                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    <span className="hidden sm:inline">Buat Jadwal Pertama</span>
                                    <span className="sm:hidden">Buat Jadwal</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={resetFilters}
                                        className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-200"
                                    >
                                        Reset Semua Filter
                                    </button>
                                    <button
                                        onClick={openCreateModal}
                                        className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                                    >
                                        <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Buat Jadwal Baru
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="divide-y divide-gray-100">
                            {schedules
                                .filter(schedule => schedule && schedule.id)
                                .map((schedule) => {
                                const StatusIcon = getStatusIcon(schedule);
                                return (
                                    <div key={schedule.id} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                            <div className="flex gap-3 sm:gap-4 flex-1">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-lg sm:rounded-xl flex items-center justify-center">
                                                        <FireIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                                            {schedule.apar?.serial_number} - {schedule.apar?.location_name}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            {/* Status Aktif/Nonaktif */}
                                                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${
                                                                schedule.is_active 
                                                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                            }`}>
                                                                {schedule.is_active ? '🟢 Aktif' : '⚫ Nonaktif'}
                                                            </span>
                                                            {/* Status Jadwal */}
                                                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${getStatusColor(schedule)}`}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {getStatusText(schedule)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5 sm:space-y-1 text-xs sm:text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                                            <span className="truncate">{schedule.assigned_user?.name || "Teknisi tidak ditugaskan"}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
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
                                                                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                                                <span>{schedule.start_time} - {schedule.end_time}</span>
                                                            </div>
                                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full w-fit">
                                                                {getFrequencyText(schedule.frequency)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {schedule.notes && (
                                                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                                            <p className="text-xs sm:text-sm text-gray-700">
                                                                <span className="font-medium">Catatan:</span> {schedule.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-end sm:justify-start gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => handleShow(schedule)}
                                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                                                    title="Lihat Detail"
                                                >
                                                    <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(schedule)}
                                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.total > 0 && (
                            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                        <span>
                                            Menampilkan {(pagination.current_page - 1) * pagination.per_page + 1} sampai{' '}
                                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari{' '}
                                            {pagination.total} hasil
                                        </span>
                                        {(searchTerm || statusFilter !== 'all' || activeFilter !== 'all') && (
                                            <span className="text-blue-600 font-medium">
                                                (Filtered)
                                            </span>
                                        )}
                                    </div>
                                    {(searchTerm || statusFilter !== 'all' || activeFilter !== 'all') && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Gunakan tombol "Reset Semua Filter" untuk melihat semua jadwal
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    
                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.last_page <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.current_page >= pagination.last_page - 2) {
                                                pageNum = pagination.last_page - 4 + i;
                                            } else {
                                                pageNum = pagination.current_page - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                                                        pageNum === pagination.current_page
                                                            ? "bg-red-500 text-white"
                                                            : "text-gray-600 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                            {editingSchedule ? "Edit Jadwal" : "Buat Jadwal Baru"}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {editingSchedule ? "Perbarui informasi jadwal" : "Buat jadwal inspeksi baru"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                {/* APAR Selection */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        APAR <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="apar_id"
                                        value={formData.apar_id || ''}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                                            errors.apar_id ? "border-red-300 bg-red-50" : "border-gray-300"
                                        }`}
                                    >
                                        <option value="">Pilih APAR</option>
                                        {apars.map((apar) => (
                                            <option key={apar.id} value={apar.id}>
                                                {apar.serial_number} - {apar.location_name} ({(apar.aparType?.name || "N/A").toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.apar_id && (
                                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                                            <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.apar_id}
                                        </p>
                                    )}
                                </div>

                                {/* Teknisi Selection */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Teknisi <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="assigned_user_id"
                                        value={formData.assigned_user_id || ''}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                                            errors.assigned_user_id ? "border-red-300 bg-red-50" : "border-gray-300"
                                        }`}
                                    >
                                        <option value="">Pilih Teknisi</option>
                                        {teknisi.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} - {user.email || "No email"}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assigned_user_id && (
                                        <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                                            <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.assigned_user_id}
                                        </p>
                                    )}
                                </div>

                                {/* Date and Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Tanggal <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="scheduled_date"
                                            value={formData.scheduled_date || ''}
                                            onChange={handleChange}
                                            disabled={submitting}
                                            min={editingSchedule ? undefined : new Date().toISOString().split("T")[0]}
                                            className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                                                errors.scheduled_date ? "border-red-300 bg-red-50" : "border-gray-300"
                                            }`}
                                        />
                                        {errors.scheduled_date && (
                                            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                                                <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.scheduled_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Waktu Mulai <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            value={formData.start_time || ''}
                                            onChange={handleChange}
                                            disabled={submitting}
                                            className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                                                errors.start_time ? "border-red-300 bg-red-50" : "border-gray-300"
                                            }`}
                                        />
                                        {errors.start_time && (
                                            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                                                <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.start_time}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                            Waktu Selesai <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            name="end_time"
                                            value={formData.end_time || ''}
                                            onChange={handleChange}
                                            disabled={submitting}
                                            className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 ${
                                                errors.end_time ? "border-red-300 bg-red-50" : "border-gray-300"
                                            }`}
                                        />
                                        {errors.end_time && (
                                            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                                                <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.end_time}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Frequency */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Frekuensi
                                    </label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency || 'weekly'}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                                    >
                                        <option value="weekly">Perminggu</option>
                                        <option value="monthly">Perbulan</option>
                                        <option value="quarterly">Per-3 Bulan</option>
                                        <option value="semiannual">Per-6 Bulan</option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        Catatan
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={formData.notes || ''}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        placeholder="Catatan tambahan (opsional)"
                                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 resize-none"
                                    />
                                </div>

                                {/* Status */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        id="is_active"
                                        checked={Boolean(formData.is_active)}
                                        onChange={handleChange}
                                        disabled={submitting}
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-3 text-xs sm:text-sm font-medium text-gray-700">
                                        Jadwal aktif
                                    </label>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg sm:rounded-xl font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium focus:ring-2 focus:ring-red-500/20 transition-all duration-200 disabled:opacity-50 ${
                                            submitted
                                                ? "bg-emerald-600 text-white"
                                                : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                                        }`}
                                    >
                                        {submitting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                                <span className="hidden sm:inline">
                                                    {editingSchedule ? "Menyimpan..." : "Membuat..."}
                                                </span>
                                                <span className="sm:hidden">
                                                    {editingSchedule ? "Simpan..." : "Buat..."}
                                                </span>
                                            </div>
                                        ) : submitted ? (
                                            "Berhasil!"
                                        ) : (
                                            <>
                                                <span className="hidden sm:inline">
                                                    {editingSchedule ? "Simpan Perubahan" : "Buat Jadwal"}
                                                </span>
                                                <span className="sm:hidden">
                                                    {editingSchedule ? "Simpan" : "Buat"}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Detail Modal */}
            {showScheduleDetail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                                        <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Detail Jadwal</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Informasi lengkap jadwal inspeksi</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowScheduleDetail(null)}
                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
                            <div className="space-y-4 sm:space-y-6">
                                {/* APAR Information */}
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <FireIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                        Informasi APAR
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Serial Number</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{showScheduleDetail.apar?.serial_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lokasi</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{showScheduleDetail.apar?.location_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jenis</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{showScheduleDetail.apar?.aparType?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kapasitas</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{showScheduleDetail.apar?.capacity} kg</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Information */}
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        Informasi Jadwal
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tanggal</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                                {showScheduleDetail.scheduled_date ? 
                                                    new Date(showScheduleDetail.scheduled_date).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : 'Tanggal tidak valid'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waktu</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                                {showScheduleDetail.start_time || 'N/A'} - {showScheduleDetail.end_time || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frekuensi</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-1">{getFrequencyText(showScheduleDetail.frequency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status Jadwal</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(showScheduleDetail)}`}>
                                                {getStatusText(showScheduleDetail)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status Aktif</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium mt-1 ${
                                                showScheduleDetail.is_active 
                                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}>
                                                {showScheduleDetail.is_active ? '🟢 Aktif' : '⚫ Nonaktif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Technician Information */}
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                        Teknisi
                                    </h4>
                                    {showScheduleDetail.assigned_user ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nama</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1">{showScheduleDetail.assigned_user.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1">{showScheduleDetail.assigned_user.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3 sm:py-4">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-medium text-red-600">Teknisi tidak ditugaskan</p>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                {showScheduleDetail.notes && (
                                    <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                                            Catatan
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-700">{showScheduleDetail.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowScheduleDetail(null)}
                                className="px-3 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors duration-200"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => {
                                    setShowScheduleDetail(null);
                                    handleEdit(showScheduleDetail);
                                }}
                                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Type Selection Modal */}
            {showNotificationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                                        <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Pilih Jenis Notifikasi</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">Pilih jenis notifikasi yang akan dikirim</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6">
                            <div className="space-y-3 sm:space-y-4">
                                <button
                                    onClick={() => sendNotificationByType('today')}
                                    className="w-full p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Jadwal Sedang Berlangsung</span>
                                </button>
                                
                                <button
                                    onClick={() => sendNotificationByType('all')}
                                    className="w-full p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Semua Jadwal Aktif</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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