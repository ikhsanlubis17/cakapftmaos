import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    FireIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const AparTypeManagement = () => {
    const [aparTypes, setAparTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });
    const [errors, setErrors] = useState({});
    
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();

    useEffect(() => {
        fetchAparTypes();
    }, []);

    const fetchAparTypes = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/apar-types');
            if (response.data.success) {
                setAparTypes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching APAR types:', error);
            showError('Gagal memuat data jenis APAR');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            if (editingType) {
                // Update existing type
                const response = await axios.put(`/api/apar-types/${editingType.id}`, formData);
                if (response.data.success) {
                    setAparTypes(aparTypes.map(type => 
                        type.id === editingType.id ? response.data.data : type
                    ));
                    showSuccess('Jenis APAR berhasil diperbarui');
                    closeModal();
                }
            } else {
                // Create new type
                const response = await axios.post('/api/apar-types', formData);
                if (response.data.success) {
                    setAparTypes([...aparTypes, response.data.data]);
                    showSuccess('Jenis APAR berhasil ditambahkan');
                    closeModal();
                }
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                showError('Gagal menyimpan jenis APAR');
            }
        }
    };

    const handleDelete = async (id, name) => {
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus',
            message: `Apakah Anda yakin ingin menghapus jenis APAR "${name}"? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (!confirmed) return;

        try {
            const response = await axios.delete(`/api/apar-types/${id}`);
            if (response.data.success) {
                setAparTypes(aparTypes.filter(type => type.id !== id));
                showSuccess('Jenis APAR berhasil dihapus');
            }
        } catch (error) {
            console.error('Error deleting APAR type:', error);
            showError(error.response?.data?.message || 'Gagal menghapus jenis APAR');
        }
    };

    const openModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || '',
                is_active: type.is_active
            });
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                description: '',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingType(null);
        setFormData({
            name: '',
            description: '',
            is_active: true
        });
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                            <FireIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Jenis APAR</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Manajemen jenis-jenis APAR dalam sistem
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Tambah Jenis APAR
                        </button>
                    </div>
                </div>
            </div>

            {/* APAR Types List */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                {/* List Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FireIcon className="h-5 w-5 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Daftar Jenis APAR ({aparTypes.length})
                            </h3>
                        </div>
                    </div>
                </div>

                {/* APAR Types Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Jenis
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
                            {aparTypes.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FireIcon className="h-12 w-12 text-gray-400" />
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    Tidak ada jenis APAR
                                                </h3>
                                                <p className="text-gray-500">
                                                    Belum ada jenis APAR yang dibuat
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => openModal()}
                                                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                Tambah Jenis APAR Pertama
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                aparTypes.map((type) => (
                                    <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                                                    <FireIcon className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 capitalize">
                                                    {type.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs">
                                                {type.description ? (
                                                    <span className="line-clamp-2">{type.description}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Tidak ada deskripsi</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                type.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {type.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openModal(type)}
                                                    className="inline-flex items-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(type.id, type.name)}
                                                    className="inline-flex items-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingType ? 'Edit Jenis APAR' : 'Tambah Jenis APAR Baru'}
                            </h3>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Jenis APAR *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Contoh: Powder, CO2, Foam"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                            errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Deskripsi jenis APAR..."
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Aktif</span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                    >
                                        {editingType ? 'Update' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
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
        </div>
    );
};

export default AparTypeManagement; 