import React, { useState, useEffect, Fragment } from 'react';
import { Link, useParams, useNavigate, getRouteApi } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    UserIcon,
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

const UserDetail = () => {
    const route = getRouteApi('/administrator/users/$id');
    const { id } = route.useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const { data: user, isLoading: loading, isError } = useQuery({
        queryKey: ['users', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/users/${id}`);
            return res.data;
        },
        enabled: !!id,
        throwOnError: false,
    });

    useEffect(() => {
        if (isError) {
            showError('Gagal memuat data pengguna');
        }
    }, [isError]);

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus Pengguna',
            message: `Apakah Anda yakin ingin menghapus pengguna ${user.name}? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/api/users/${id}`);
                showSuccess('Pengguna berhasil dihapus');
                queryClient.invalidateQueries({ queryKey: ['users'] });
                navigate({ to: '/users' });
            } catch (error) {
                console.error('Error deleting user:', error);
                showError(error?.response?.data?.message || 'Gagal menghapus pengguna');
            }
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

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'supervisor':
                return 'bg-blue-100 text-blue-800';
            case 'teknisi':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusText = (isActive) => {
        return isActive ? 'Aktif' : 'Nonaktif';
    };

    const getStatusIcon = (isActive) => {
        return isActive ? CheckCircleIcon : XCircleIcon;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pengguna tidak ditemukan</h3>
                <Link
                    to="/users"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                    Kembali ke Daftar Pengguna
                </Link>
            </div>
        );
    }

    const RoleIcon = getRoleIcon(user.role);
    const StatusIcon = getStatusIcon(user.is_active);

    return (
        <Fragment>
            <div className="space-y-6">
                {/* Header */}
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center">
                        <Link
                            to="/users"
                            className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Detail Pengguna</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Informasi lengkap pengguna {user.name}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                        <Link
                            to={`/users/${id}/edit`}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Hapus
                        </button>
                    </div>
                </div>

                {/* User Information */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <div className="flex items-center">
                            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="h-8 w-8 text-gray-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {user.name}
                                </h3>
                                <div className="mt-1 flex items-center space-x-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                        <RoleIcon className="h-3 w-3 mr-1" />
                                        {getRoleText(user.role)}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.is_active)}`}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {getStatusText(user.is_active)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500 flex items-center">
                                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                                    Email
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {user.email}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500 flex items-center">
                                    <PhoneIcon className="h-4 w-4 mr-2" />
                                    Nomor Telepon
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {user.phone || 'Tidak ada'}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500 flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    Tanggal Bergabung
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(user.created_at).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    ID Pengguna
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {user.id}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">
                                    Terakhir Diperbarui
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(user.updated_at).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Role Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Informasi Role
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <RoleIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {getRoleText(user.role)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {user.role === 'admin' && 'Memiliki akses penuh ke semua fitur sistem'}
                                        {user.role === 'supervisor' && 'Dapat mengelola APAR, mobil tangki, dan melihat laporan'}
                                        {user.role === 'teknisi' && 'Dapat melakukan inspeksi dan melihat data terbatas'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Status */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Status Akun
                        </h3>
                        <div className="flex items-center">
                            <StatusIcon className={`h-5 w-5 mr-3 ${user.is_active ? 'text-green-500' : 'text-red-500'}`} />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {getStatusText(user.is_active)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {user.is_active 
                                        ? 'Pengguna dapat login dan mengakses sistem'
                                        : 'Pengguna tidak dapat login ke sistem'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
        </Fragment>
    );
};

export default UserDetail; 

