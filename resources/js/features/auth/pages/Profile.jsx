import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    UserIcon,
    ArrowLeftIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    KeyIcon,
    EnvelopeIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';

const Profile = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient, user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    
    // Fetch fresh user data
    const { data: user, isLoading: loading, isError } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await apiClient.get('/api/user');
            return res.data;
        },
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            }));
        }

        if (isError) {
            showError('Gagal memuat data profil');
        }
    }, [user, isError]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama wajib diisi';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email wajib diisi';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        // Password validation only if password is being changed
        if (formData.password) {
            if (formData.password.length < 8) {
                newErrors.password = 'Password minimal 8 karakter';
            }
            if (formData.password !== formData.password_confirmation) {
                newErrors.password_confirmation = 'Konfirmasi password tidak cocok';
            }
        }

        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'Format nomor telepon tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
            };

            if (formData.password) {
                updateData.password = formData.password;
                updateData.password_confirmation = formData.password_confirmation;
            }

            const res = await apiClient.put('/api/user/profile', updateData);

            showSuccess('Profil berhasil diperbarui!');
            
            // Update auth context by invalidating user query
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            
            // Clear password fields
            setFormData(prev => ({
                ...prev,
                password: '',
                password_confirmation: ''
            }));

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate({ to: '/' });
            }, 1500);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error?.response?.data?.errors) {
                const serverErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    serverErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(serverErrors);
            } else {
                showError(error?.response?.data?.message || 'Gagal memperbarui profil. Silakan coba lagi.');
            }
        } finally {
            setSaving(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return ShieldCheckIcon;
            case 'supervisor':
                return UserGroupIcon;
            case 'teknisi':
                return UserIcon;
            default:
                return UserIcon;
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'supervisor':
                return 'Supervisor';
            case 'teknisi':
                return 'Teknisi';
            default:
                return role;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-[#EEEEEE] rounded-[6px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                        <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#041562] tracking-tight">Profil Saya</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola informasi akun dan preferensi kredensial Anda
                        </p>
                    </div>
                </div>
                {user?.role && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEEEEE] border border-slate-200 rounded-[3px] text-xs font-bold text-[#041562] uppercase tracking-wider self-start md:self-auto">
                        <ShieldCheckIcon className="w-4 h-4 text-[#11468F]" />
                        {getRoleText(user.role)}
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="bg-white border border-[#EEEEEE] rounded-[6px] shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-base font-bold text-[#041562] mb-4 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-[#11468F]" />
                            Informasi Dasar
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] ${
                                        errors.name ? 'border-[#DA1212] bg-red-50/20' : 'border-slate-300 bg-white'
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-[#DA1212] font-semibold">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Email *
                                </label>
                                <div className="relative rounded-[6px]">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`block w-full pl-10 border rounded-[6px] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] ${
                                            errors.email ? 'border-[#DA1212] bg-red-50/20' : 'border-slate-300 bg-white'
                                        }`}
                                        placeholder="contoh@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-xs text-[#DA1212] font-semibold">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Nomor Telepon
                                </label>
                                <div className="relative rounded-[6px]">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`block w-full pl-10 border rounded-[6px] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] ${
                                            errors.phone ? 'border-[#DA1212] bg-red-50/20' : 'border-slate-300 bg-white'
                                        }`}
                                        placeholder="081234567890"
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-[#DA1212] font-semibold">{errors.phone}</p>
                                )}
                            </div>

                            {/* Role (Read Only) */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Hak Akses Sistem (Role)
                                </label>
                                <div className="flex items-center px-3.5 py-2.5 border border-slate-200 bg-[#EEEEEE]/50 rounded-[6px] text-slate-700 text-sm font-medium">
                                    {React.createElement(getRoleIcon(user?.role), { className: "h-5 w-5 mr-2 text-[#041562]" })}
                                    <span className="font-bold text-[#041562]">{getRoleText(user?.role)}</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Role ditentukan oleh Administrator dan tidak dapat diedit secara mandiri.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="pt-6 border-t border-[#EEEEEE]">
                        <h3 className="text-base font-bold text-[#041562] mb-1 flex items-center">
                            <KeyIcon className="h-5 w-5 mr-2 text-[#11468F]" />
                            Ganti Password
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Kosongkan kedua kolom di bawah jika Anda tidak ingin mengubah password saat ini.
                        </p>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Password Baru
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] ${
                                        errors.password ? 'border-[#DA1212] bg-red-50/20' : 'border-slate-300 bg-white'
                                    }`}
                                    placeholder="Minimal 8 karakter"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-[#DA1212] font-semibold">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirmation" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Konfirmasi Password Baru
                                </label>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    id="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] ${
                                        errors.password_confirmation ? 'border-[#DA1212] bg-red-50/20' : 'border-slate-300 bg-white'
                                    }`}
                                    placeholder="Ulangi password baru"
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-xs text-[#DA1212] font-semibold">{errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end pt-6 border-t border-[#EEEEEE]">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex items-center px-6 py-2.5 rounded-[6px] shadow-sm text-sm font-semibold transition-colors ${
                                saving
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-[#11468F] hover:bg-[#0d3873] text-white'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Perubahan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
