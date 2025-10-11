import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import StatsCard from '../components/StatsCard';
import FilterSection from '../components/FilterSection';
import UsersTable from '../components/UsersTable';
import UserModal from '../components/UserModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const UsersManagement = () => {
    const { user, apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const queryClient = useQueryClient();
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'teknisi',
        password: '',
        is_active: true
    });

    const { data: users = [], isLoading: loading, isError } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await apiClient.get('/api/users');
            return res.data;
        },
        throwOnError: false,
    });

    useEffect(() => {
        if (isError) {
            setError('Gagal memuat data pengguna');
        }
    }, [isError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await apiClient.put(`/api/users/${editingUser.id}`, formData);
                showSuccess('Pengguna berhasil diperbarui');
            } else {
                await apiClient.post('/api/users', formData);
                showSuccess('Pengguna berhasil ditambahkan');
            }
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error) {
            console.error('Error saving user:', error);
            showError('Gagal menyimpan data pengguna');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            password: '',
            is_active: user.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (userId) => {
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus',
            message: 'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.',
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
                showError('Gagal menghapus pengguna');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'teknisi',
            password: '',
            is_active: true
        });
    };

    const openCreateModal = () => {
        setEditingUser(null);
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        resetForm();
    };

    // Filter users based on search and filters
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.is_active === (statusFilter === 'active');

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Calculate statistics
    const totalUsers = users.length;
    const teknisiCount = users.filter(u => u.role === 'teknisi').length;
    const supervisorCount = users.filter(u => u.role === 'supervisor').length;
    const activeCount = users.filter(u => u.is_active).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner h-32 w-32 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Memuat data pengguna...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchUsers}
                        className="btn-primary"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8 animate-fade-in-up">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Manajemen Pengguna</h1>
                            <p className="text-gray-600 mt-2 text-lg">
                                Kelola pengguna teknisi dan supervisor
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="btn-primary"
                        >
                            <PlusIcon className="h-6 w-6 mr-2" />
                            Tambah Pengguna
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <StatsCard
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        )}
                        title="Total Pengguna"
                        value={totalUsers}
                        color="text-blue-600"
                        bgColor="bg-blue-100"
                        iconColor="text-blue-600"
                    />
                    
                    <StatsCard
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                        title="Teknisi"
                        value={teknisiCount}
                        color="text-green-600"
                        bgColor="bg-green-100"
                        iconColor="text-green-600"
                    />
                    
                    <StatsCard
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        )}
                        title="Supervisor"
                        value={supervisorCount}
                        color="text-blue-600"
                        bgColor="bg-blue-100"
                        iconColor="text-blue-600"
                    />
                    
                    <StatsCard
                        icon={({ className }) => (
                            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        title="Aktif"
                        value={activeCount}
                        color="text-green-600"
                        bgColor="bg-green-100"
                        iconColor="text-green-600"
                    />
                </div>

                {/* Filters */}
                <FilterSection
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                />

                {/* Users Table */}
                <UsersTable
                    users={filteredUsers}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* User Modal */}
            <UserModal
                isOpen={showModal}
                onClose={closeModal}
                editingUser={editingUser}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isOpen}
                config={config}
                onConfirm={confirm}
                onClose={close}
            />
        </div>
    );
};

export default UsersManagement; 
