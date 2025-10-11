import React, { useState, useEffect, Fragment } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    UserIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    ShieldCheckIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

const UserList = () => {
    const { user, apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { data: users = [], isLoading: loading, isError } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await apiClient.get('/api/users');
            return res.data;
        },
        // Don't throw to console
        throwOnError: false,
    });

    // handle auth errors from query
    useEffect(() => {
        if (isError) {
            // Let the global interceptors handle 401/403 - optionally show a message
            showError('Gagal memuat data pengguna. Silakan coba lagi.');
        }
    }, [isError]);

    const handleDelete = async (userId, userName) => {
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus Pengguna',
            message: `Apakah Anda yakin ingin menghapus pengguna ${userName}? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/api/users/${userId}`);
                showSuccess('Pengguna berhasil dihapus');
                queryClient.invalidateQueries({ queryKey: ['users'] });
            } catch (error) {
                console.error('Error deleting user:', error);
                showError('Gagal menghapus pengguna. Silakan coba lagi.');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) {
            showError('Pilih pengguna yang akan dihapus terlebih dahulu');
            return;
        }

        const userList = selectedUsers.map(id => {
            const user = users.find(u => u.id === id);
            return `${user?.name || 'Unknown'} (${user?.email || 'Unknown'})`;
        }).join(', ');

        const confirmed = await confirm({
            title: 'Konfirmasi Hapus Massal',
            message: `Apakah Anda yakin ingin menghapus ${selectedUsers.length} pengguna sekaligus?\n\nPengguna yang akan dihapus:\n${userList}`,
            type: 'warning',
            confirmText: 'Ya, Hapus Semua',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (confirmed) {
            setDeleting(true);
            try {
                const deletePromises = selectedUsers.map(async (userId) => {
                    try {
                        await apiClient.delete(`/api/users/${userId}`);
                        return { success: true, id: userId };
                    } catch (error) {
                        console.error(`Error deleting user ${userId}:`, error);
                        return { success: false, id: userId, error: error?.response?.data?.message || 'Unknown error' };
                    }
                });

                const results = await Promise.all(deletePromises);
                const successful = results.filter(r => r.success);
                const failed = results.filter(r => !r.success);

                if (successful.length > 0) {
                    showSuccess(`${successful.length} pengguna berhasil dihapus${failed.length > 0 ? `, ${failed.length} gagal` : ''}`);
                } else {
                    showError('Gagal menghapus semua pengguna yang dipilih');
                }

                setSelectedUsers([]);
                setBulkDeleteMode(false);
                queryClient.invalidateQueries({ queryKey: ['users'] });
            } catch (error) {
                console.error('Error in bulk delete:', error);
                showError('Terjadi kesalahan saat menghapus pengguna');
            } finally {
                setDeleting(false);
            }
        }
    };

    const toggleBulkDeleteMode = () => {
        setBulkDeleteMode(!bulkDeleteMode);
        setSelectedUsers([]);
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(user => user.id));
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

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusText = (isActive) => {
        return isActive ? 'Aktif' : 'Nonaktif';
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data pengguna...</p>
                </div>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="space-y-4 sm:space-y-6">
                {/* Header - Responsive */}
                <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Kelola Pengguna
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Kelola data pengguna dan hak akses - CAKAP FT MAOS
                        </p>
                    </div>
                    
                    {/* Action Buttons - Responsive */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {bulkDeleteMode ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="flex items-center justify-center sm:justify-start px-3 py-2 bg-gray-50 rounded-md">
                                    <span className="text-sm text-gray-600">
                                        {selectedUsers.length} dipilih
                                    </span>
                                </div>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedUsers.length === 0 || deleting}
                                    className={`inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                        selectedUsers.length > 0 && !deleting
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                    {deleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            <span className="hidden sm:inline">Menghapus...</span>
                                            <span className="sm:hidden">Hapus</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrashIcon className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">Hapus ({selectedUsers.length})</span>
                                            <span className="sm:hidden">Hapus</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={toggleBulkDeleteMode}
                                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <XMarkIcon className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Batal</span>
                                    <span className="sm:hidden">Batal</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={toggleBulkDeleteMode}
                                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Hapus Multiple</span>
                                    <span className="sm:hidden">Hapus</span>
                                </button>
                                <Link
                                    to="/users/create"
                                    className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Tambah Pengguna</span>
                                    <span className="sm:hidden">Tambah</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters - Responsive */}
                <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Search */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                Cari Pengguna
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 pr-3 py-2 sm:py-3 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Nama, email, atau nomor telepon..."
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                Filter Role
                            </label>
                            <select
                                id="role"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="all">Semua Role</option>
                                <option value="admin">Administrator</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="teknisi">Teknisi</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users List - Responsive */}
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    {bulkDeleteMode && (
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center space-x-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            Pilih Semua ({filteredUsers.length})
                                        </span>
                                    </label>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {selectedUsers.length} dari {filteredUsers.length} dipilih
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <ul className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => {
                            const RoleIcon = getRoleIcon(user.role);
                            return (
                                <li key={user.id}>
                                    <div className={`px-4 py-4 sm:px-6 hover:bg-gray-50 ${
                                        bulkDeleteMode ? "cursor-pointer" : ""
                                    }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            {/* Main Content */}
                                            <div className="flex items-start sm:items-center min-w-0 flex-1">
                                                {bulkDeleteMode && (
                                                    <div className="mr-3 mt-1 sm:mt-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => handleSelectUser(user.id)}
                                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-gray-600" />
                                                    </div>
                                                </div>
                                                
                                                <div className="ml-4 min-w-0 flex-1">
                                                    {/* Name and Tags */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {user.name}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                                <span className="hidden sm:inline">{getRoleText(user.role)}</span>
                                                                <span className="sm:hidden">{getRoleText(user.role).substring(0, 3)}</span>
                                                            </span>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.is_active)}`}>
                                                                {getStatusText(user.is_active)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Contact Info */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-2 mb-1">
                                                        <span className="truncate">
                                                            {user.email}
                                                        </span>
                                                        {user.phone && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="truncate">
                                                                    {user.phone}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Join Date */}
                                                    <div className="text-xs text-gray-400">
                                                        Bergabung: {new Date(user.created_at).toLocaleDateString("id-ID")}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons - Always Horizontal */}
                                            <div className="flex items-center justify-start sm:justify-end gap-2 flex-shrink-0">
                                                {!bulkDeleteMode && (
                                                    <div className="flex flex-row gap-2">
                                                        {/* View Button */}
                                                        <Link
                                                            to={`/users/${user.id}`}
                                                            className="inline-flex items-center justify-center p-2 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                                                            title="Lihat Detail"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </Link>

                                                        {/* Edit Button */}
                                                        <Link
                                                            to={`/users/${user.id}/edit`}
                                                            className="inline-flex items-center justify-center p-2 border border-transparent text-xs font-medium rounded text-yellow-600 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                                                            title="Edit Pengguna"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Link>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDelete(user.id, user.name)}
                                                            className="inline-flex items-center justify-center p-2 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                                                            title="Hapus Pengguna"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Tidak ada pengguna
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || roleFilter !== "all"
                                ? "Coba ubah filter pencarian Anda."
                                : "Mulai dengan menambahkan pengguna pertama."}
                        </p>
                    </div>
                )}
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

export default UserList; 

