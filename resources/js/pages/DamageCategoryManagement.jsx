import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
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
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/damage-categories');
            setCategories(response.data.data);
        } catch (error) {
            showError('Gagal memuat kategori kerusakan');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            showError('Nama kategori wajib diisi');
            return;
        }

        try {
            if (editingCategory) {
                await axios.put(`/api/damage-categories/${editingCategory.id}`, formData);
                showSuccess('Kategori berhasil diperbarui');
            } else {
                await axios.post('/api/damage-categories', formData);
                showSuccess('Kategori berhasil dibuat');
            }
            
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', is_active: true });
            fetchCategories();
        } catch (error) {
            showError(error.response?.data?.message || 'Gagal menyimpan kategori');
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

    const handleDelete = async (category) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Konfirmasi Hapus Kategori',
            message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red',
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/damage-categories/${category.id}`);
                    showSuccess('Kategori berhasil dihapus');
                    fetchCategories();
                } catch (error) {
                    showError(error.response?.data?.message || 'Gagal menghapus kategori');
                }
            },
        });
    };

    const toggleStatus = async (category) => {
        try {
            await axios.patch(`/api/damage-categories/${category.id}/toggle-status`);
            showSuccess('Status kategori berhasil diubah');
            fetchCategories();
        } catch (error) {
            showError('Gagal mengubah status kategori');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', is_active: true });
        setEditingCategory(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
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
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg flex items-center space-x-2"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Tambah Kategori</span>
                        </button>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
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
                <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
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
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-blue-600 text-lg">💡</div>
                        <div className="text-sm text-blue-800">
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
