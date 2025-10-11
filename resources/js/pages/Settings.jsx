import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    CogIcon,
    MapPinIcon,
    BellIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
    const { user, apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        // GPS & Location Settings
        gps_radius_validation: 50, // meters
        inspection_time_window: 30, // minutes
        working_hours_start: '06:00',
        working_hours_end: '22:00',
        
        // Schedule & Interval Settings
        default_inspection_interval: 30, // days
        reminder_notification_days: 3,
        escalation_notification_days: 7,
        auto_schedule_generation: true,
        
        // Notification Settings
        notification_email: true,
        notification_interval: 24, // hours
        
        // Inspection Settings
        auto_block_inspection: true,
        require_photo: true,
        require_selfie: false,
        require_location_validation: true,
        max_photo_size: 5, // MB
        allowed_photo_types: ['jpg', 'jpeg', 'png'],
        
        // Security & Session Settings
        session_timeout: 60, // minutes
        max_login_attempts: 5,
        lockout_duration: 15, // minutes
        require_password_change: 90, // days
        
        // System Settings
        maintenance_mode: false,
        debug_mode: false,
        log_retention_days: 90,
        backup_frequency: 7, // days
    });

    const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await apiClient.get('/api/settings');
            return res.data;
        },
        throwOnError: false,
    });

    useEffect(() => {
        setLoading(settingsLoading);
    }, [settingsLoading]);

    useEffect(() => {
        if (settingsData) setSettings(settingsData);
    }, [settingsData]);

    const saveMutation = useMutation({
        mutationFn: async (newSettings) => {
            const res = await apiClient.put('/api/settings', newSettings);
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess('Pengaturan berhasil disimpan');
            refetchSettings();
        },
        onError: (error) => {
            console.error('Error saving settings:', error);
            showError('Gagal menyimpan pengaturan');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveMutation.mutateAsync(settings);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat pengaturan...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
                        <p className="text-gray-600 mt-1">
                            Konfigurasi sistem monitoring APAR
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CogIcon className="h-8 w-8 text-red-600" />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* GPS & Location Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Lokasi & GPS</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Radius Validasi GPS (meter)
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="1000"
                                value={settings.gps_radius_validation}
                                onChange={(e) => handleChange('gps_radius_validation', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Jarak maksimal dari lokasi APAR untuk validasi inspeksi
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jendela Waktu Inspeksi (menit)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="120"
                                value={settings.inspection_time_window}
                                onChange={(e) => handleChange('inspection_time_window', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Toleransi waktu sebelum/sesudah jadwal inspeksi
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jam Kerja Mulai
                            </label>
                            <input
                                type="time"
                                value={settings.working_hours_start}
                                onChange={(e) => handleChange('working_hours_start', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Jam mulai periode kerja untuk validasi inspeksi
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jam Kerja Selesai
                            </label>
                            <input
                                type="time"
                                value={settings.working_hours_end}
                                onChange={(e) => handleChange('working_hours_end', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Jam selesai periode kerja untuk validasi inspeksi
                            </p>
                        </div>
                    </div>
                </div>

                {/* Schedule & Interval Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <CogIcon className="h-6 w-6 text-green-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Jadwal & Interval</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Interval Inspeksi Default (hari)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={settings.default_inspection_interval}
                                onChange={(e) => handleChange('default_inspection_interval', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Interval default untuk jadwal inspeksi APAR
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hari Notifikasi Reminder
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={settings.reminder_notification_days}
                                onChange={(e) => handleChange('reminder_notification_days', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Berapa hari sebelum jadwal untuk kirim reminder
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hari Notifikasi Eskalasi
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="90"
                                value={settings.escalation_notification_days}
                                onChange={(e) => handleChange('escalation_notification_days', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Berapa hari setelah jadwal untuk notifikasi eskalasi
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Generate Jadwal Otomatis</h3>
                                <p className="text-sm text-gray-500">Buat jadwal inspeksi secara otomatis</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.auto_schedule_generation}
                                    onChange={(e) => handleChange('auto_schedule_generation', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <BellIcon className="h-6 w-6 text-green-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Notifikasi</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Notifikasi Email</h3>
                                <p className="text-sm text-gray-500">Kirim reminder inspeksi via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notification_email}
                                    onChange={(e) => handleChange('notification_email', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Interval Notifikasi (jam)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="168"
                                value={settings.notification_interval}
                                onChange={(e) => handleChange('notification_interval', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Interval pengiriman notifikasi reminder
                            </p>
                        </div>
                    </div>
                </div>

                {/* Inspection Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <ShieldCheckIcon className="h-6 w-6 text-purple-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Inspeksi</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Blokir Inspeksi Otomatis</h3>
                                    <p className="text-sm text-gray-500">Blokir inspeksi di luar jadwal</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.auto_block_inspection}
                                        onChange={(e) => handleChange('auto_block_inspection', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Wajib Foto APAR</h3>
                                    <p className="text-sm text-gray-500">Teknisi harus mengambil foto APAR</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.require_photo}
                                        onChange={(e) => handleChange('require_photo', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Wajib Selfie Teknisi</h3>
                                    <p className="text-sm text-gray-500">Teknisi harus mengambil selfie</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.require_selfie}
                                        onChange={(e) => handleChange('require_selfie', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Validasi Lokasi Wajib</h3>
                                    <p className="text-sm text-gray-500">Wajib validasi GPS saat inspeksi</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.require_location_validation}
                                        onChange={(e) => handleChange('require_location_validation', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ukuran Maksimal Foto (MB)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={settings.max_photo_size}
                                    onChange={(e) => handleChange('max_photo_size', parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Ukuran maksimal file foto yang diupload
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timeout Sesi (menit)
                                </label>
                                <input
                                    type="number"
                                    min="15"
                                    max="480"
                                    value={settings.session_timeout}
                                    onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Waktu timeout untuk sesi pengguna
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security & Session Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <ShieldCheckIcon className="h-6 w-6 text-orange-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Keamanan & Sesi</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Timeout Sesi (menit)
                            </label>
                            <input
                                type="number"
                                min="15"
                                max="480"
                                value={settings.session_timeout}
                                onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Waktu timeout untuk sesi pengguna
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maksimal Percobaan Login
                            </label>
                            <input
                                type="number"
                                min="3"
                                max="10"
                                value={settings.max_login_attempts}
                                onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Jumlah maksimal percobaan login sebelum blokir
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Durasi Blokir (menit)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="60"
                                value={settings.lockout_duration}
                                onChange={(e) => handleChange('lockout_duration', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Durasi blokir setelah melebihi maksimal percobaan
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ganti Password Wajib (hari)
                            </label>
                            <input
                                type="number"
                                min="30"
                                max="365"
                                value={settings.require_password_change}
                                onChange={(e) => handleChange('require_password_change', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Interval wajib ganti password untuk pengguna
                            </p>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                        <CogIcon className="h-6 w-6 text-gray-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Sistem</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Mode Maintenance</h3>
                                    <p className="text-sm text-gray-500">Aktifkan mode maintenance untuk perbaikan sistem</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenance_mode}
                                        onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Mode Debug</h3>
                                    <p className="text-sm text-gray-500">Aktifkan mode debug untuk troubleshooting</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.debug_mode}
                                        onChange={(e) => handleChange('debug_mode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Retensi Log (hari)
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    max="365"
                                    value={settings.log_retention_days}
                                    onChange={(e) => handleChange('log_retention_days', parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Berapa lama log sistem disimpan
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frekuensi Backup (hari)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={settings.backup_frequency}
                                    onChange={(e) => handleChange('backup_frequency', parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Interval backup otomatis database
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="loading-spinner mr-2"></div>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                Simpan Pengaturan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings; 