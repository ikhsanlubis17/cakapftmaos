import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon,
    FireIcon,
} from '@heroicons/react/24/outline';

const DamageCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });
    const { showSuccess, showError } = useToast();
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        confirmText: '',
        cancelText: '',
        confirmButtonColor: 'red',
        onConfirm: () => {},
    });

    const closeConfirmDialog = () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
    };

    const { apiClient } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['damage-categories'],
        queryFn: async () => {
            const res = await apiClient.get('/api/damage-categories');
            return res.data.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    useEffect(() => {
        if (isError) showError('Gagal memuat kategori kerusakan');
        if (data) setCategories(data);
    }, [data, isError]);

    const createCategoryMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await apiClient.post('/api/damage-categories', payload);
            return res.data;
        },
        onSuccess: () => {
            showSuccess('Kategori berhasil dibuat');
            queryClient.invalidateQueries({ queryKey: ['damage-categories'] });
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', is_active: true });
        },
        onError: (error) => {
            showError(error.response?.data?.message || 'Gagal menyimpan kategori');
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await apiClient.put(`/api/damage-categories/${id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            showSuccess('Kategori berhasil diperbarui');
            queryClient.invalidateQueries({ queryKey: ['damage-categories'] });
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', is_active: true });
        },
        onError: (error) => {
            showError(error.response?.data?.message || 'Gagal menyimpan kategori');
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showError('Nama kategori wajib diisi');
            return;
        }

        if (editingCategory) {
            updateCategoryMutation.mutate({ id: editingCategory.id, payload: formData });
        } else {
            createCategoryMutation.mutate(formData);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            is_active: category.is_active
        });
        setShowForm(true);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.delete(`/api/damage-categories/${id}`);
            return res.data;
        },
        onSuccess: () => {
            showSuccess('Kategori berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['damage-categories'] });
        },
        onError: (error) => {
            showError(error.response?.data?.message || 'Gagal menghapus kategori');
        },
    });

    const handleDelete = (category) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Konfirmasi Hapus Kategori',
            message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red',
            onConfirm: async () => deleteMutation.mutate(category.id),
        });
    };

    const toggleStatusMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.patch(`/api/damage-categories/${id}/toggle-status`);
            return res.data;
        },
        onSuccess: () => {
            showSuccess('Status kategori berhasil diubah');
            queryClient.invalidateQueries({ queryKey: ['damage-categories'] });
        },
        onError: () => showError('Gagal mengubah status kategori'),
    });

    const toggleStatus = (category) => {
        toggleStatusMutation.mutate(category.id);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', is_active: true });
        setEditingCategory(null);
        setShowForm(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Manajemen Kategori Kerusakan</h1>
                                <p className="text-gray-600">Kelola kategori kerusakan APAR untuk inspeksi</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Tambah Kategori
                        </button>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3 mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">
                                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Kategori <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Contoh: Cat tabung rusak/pudar"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                        placeholder="Jelaskan detail kategori kerusakan..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                                        Kategori aktif
                                    </label>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        {editingCategory ? 'Update' : 'Simpan'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Categories List */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Daftar Kategori Kerusakan ({categories.length})
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kategori
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Deskripsi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {category.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 max-w-xs truncate">
                                                {category.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                category.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {category.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(category)}
                                                    className={`p-1 rounded hover:bg-gray-50 ${
                                                        category.is_active 
                                                            ? 'text-yellow-600 hover:text-yellow-900' 
                                                            : 'text-green-600 hover:text-green-900'
                                                    }`}
                                                    title={category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                >
                                                    {category.is_active ? (
                                                        <EyeSlashIcon className="h-4 w-4" />
                                                    ) : (
                                                        <EyeIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {categories.length === 0 && (
                        <div className="text-center py-12">
                            <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada kategori</h3>
                            <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan kategori kerusakan pertama.</p>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-gray-600 text-lg">💡</div>
                        <div className="text-sm text-gray-800">
                            <div className="font-medium mb-1">Tips Manajemen Kategori Kerusakan:</div>
                            <ul className="space-y-1">
                                <li>• Kategori yang nonaktif tidak akan muncul di form inspeksi</li>
                                <li>• Pastikan nama kategori jelas dan mudah dipahami teknisi</li>
                                <li>• Deskripsi membantu teknisi memahami jenis kerusakan</li>
                                <li>• Kategori yang sudah digunakan dalam inspeksi tidak dapat dihapus</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                confirmButtonColor={confirmDialog.confirmButtonColor}
                onConfirm={confirmDialog.onConfirm}
                onClose={closeConfirmDialog}
            />
        </div>
    );
};

export default DamageCategoryManagement;
