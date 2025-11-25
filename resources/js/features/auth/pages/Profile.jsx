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
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Kelola informasi akun dan profil Anda
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Informasi Dasar
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email *
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`block w-full pl-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                            errors.email ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="contoh@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Nomor Telepon
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`block w-full pl-10 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                            errors.phone ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="081234567890"
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>

                            {/* Role (Read Only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Role
                                </label>
                                <div className="mt-1 flex items-center px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500">
                                    {React.createElement(getRoleIcon(user?.role), { className: "h-5 w-5 mr-2" })}
                                    {getRoleText(user?.role)}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Role tidak dapat diubah sendiri. Hubungi admin jika perlu perubahan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <KeyIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Ganti Password
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Kosongkan jika tidak ingin mengubah password
                        </p>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password Baru
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Minimal 8 karakter"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                    Konfirmasi Password Baru
                                </label>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    id="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Ulangi password baru"
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                saving
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
