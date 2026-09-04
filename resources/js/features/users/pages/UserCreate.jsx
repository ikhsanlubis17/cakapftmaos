import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    UserIcon,
    ArrowLeftIcon,
    ShieldCheckIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

const UserCreate = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'teknisi',
        is_active: true,
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

        if (!formData.password) {
            newErrors.password = 'Password wajib diisi';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password minimal 8 karakter';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
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

        setLoading(true);
        try {
            await apiClient.post('/api/users', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || null,
                role: formData.role,
                is_active: formData.is_active,
            });

            showSuccess('Pengguna berhasil dibuat!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            navigate({ to: '/users' });
        } catch (error) {
            console.error('Error creating user:', error);
            if (error?.response?.data?.errors) {
                const serverErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    serverErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(serverErrors);
            } else {
                showError(error?.response?.data?.message || 'Gagal membuat pengguna. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] p-6 flex items-center">
                <Link
                    to="/users"
                    className="mr-4 p-2 rounded-[6px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#041562] tracking-tight">
                        Tambah Pengguna Baru
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Buat akun pengguna baru untuk sistem CAKAP FT MAOS
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow-sm rounded-[6px] border border-[#EEEEEE]">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-base font-bold text-[#041562] tracking-tight mb-4">
                            Informasi Dasar
                        </h3>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                                >
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all ${
                                        errors.name
                                            ? "border-[#DA1212]"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-[#DA1212]">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                                >
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all ${
                                        errors.email
                                            ? "border-[#DA1212]"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="contoh@email.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-[#DA1212]">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                                >
                                    Nomor Telepon
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all ${
                                        errors.phone
                                            ? "border-[#DA1212]"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="081234567890"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-[#DA1212]">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label
                                    htmlFor="role"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                                >
                                    Role *
                                </label>
                                <select
                                    name="role"
                                    id="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="block w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                                >
                                    <option value="teknisi">Teknisi</option>
                                    <option value="supervisor">
                                        Supervisor
                                    </option>
                                    <option value="admin">Administrator</option>
                                </select>
                                <div className="mt-2 flex items-center text-xs font-semibold text-slate-500">
                                    {React.createElement(
                                        getRoleIcon(formData.role),
                                        { className: "h-4 w-4 mr-1 text-slate-700" }
                                    )}
                                    {getRoleText(formData.role)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="pt-4 border-t border-slate-200">
                        <h3 className="text-base font-bold text-[#041562] tracking-tight mb-4">
                            Password Akun
                        </h3>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                                >
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all ${
                                        errors.password
                                            ? "border-[#DA1212]"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="Minimal 8 karakter"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-[#DA1212]">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
                                >
                                    Konfirmasi Password *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all ${
                                        errors.confirmPassword
                                            ? "border-[#DA1212]"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="Ulangi password"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-[#DA1212]">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-slate-300 rounded-[3px]"
                            />
                            <label
                                htmlFor="is_active"
                                className="ml-2.5 block text-xs font-semibold text-slate-900"
                            >
                                Akun aktif (dapat login langsung)
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                        <Link
                            to="/users"
                            className="px-4 py-2 border border-slate-300 rounded-[6px] shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex items-center px-4 py-2 rounded-[6px] shadow-sm text-xs font-bold uppercase tracking-wider text-white transition-all ${
                                loading
                                    ? "bg-slate-300 cursor-not-allowed"
                                    : "bg-[#11468F] hover:bg-[#0d3873]"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                                    Membuat...
                                </>
                            ) : (
                                "Buat Pengguna"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCreate; 

