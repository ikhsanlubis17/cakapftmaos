import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
    UserIcon,
    ArrowLeftIcon,
    ShieldCheckIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

const UserCreate = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
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
            const response = await axios.post('/api/users', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || null,
                role: formData.role,
                is_active: formData.is_active,
            });

            showSuccess('Pengguna berhasil dibuat!');
            navigate('/dashboard/users');
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.response?.data?.errors) {
                const serverErrors = {};
                Object.keys(error.response.data.errors).forEach(key => {
                    serverErrors[key] = error.response.data.errors[key][0];
                });
                setErrors(serverErrors);
            } else {
                showError(error.response?.data?.message || 'Gagal membuat pengguna. Silakan coba lagi.');
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
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center">
                    <Link
                        to="/dashboard/users"
                        className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Tambah Pengguna Baru
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Buat akun pengguna baru untuk sistem CAKAP FT MAOS
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Informasi Dasar
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.name
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.email
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="contoh@email.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Nomor Telepon
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.phone
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="081234567890"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label
                                    htmlFor="role"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Role *
                                </label>
                                <select
                                    name="role"
                                    id="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="teknisi">Teknisi</option>
                                    <option value="supervisor">
                                        Supervisor
                                    </option>
                                    <option value="admin">Administrator</option>
                                </select>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    {React.createElement(
                                        getRoleIcon(formData.role),
                                        { className: "h-4 w-4 mr-1" }
                                    )}
                                    {getRoleText(formData.role)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Password
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.password
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Minimal 8 karakter"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Konfirmasi Password *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                        errors.confirmPassword
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Ulangi password"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="is_active"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Akun aktif (dapat login)
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <Link
                            to="/dashboard/users"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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