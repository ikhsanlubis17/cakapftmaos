import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const UserModal = ({ 
    isOpen, 
    onClose, 
    editingUser, 
    formData, 
    setFormData, 
    onSubmit, 
    loading = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-2xl rounded-2xl bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="input-modern"
                            placeholder="Masukkan nama lengkap"
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="input-modern"
                            placeholder="contoh@email.com"
                            required
                        />
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                            Nomor Telepon
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="input-modern"
                            placeholder="081234567890"
                        />
                    </div>

                    {/* Role Field */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                            Role
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="input-modern"
                        >
                            <option value="teknisi">Teknisi</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    {/* Password Field - Only for new users */}
                    {!editingUser && (
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="input-modern"
                                placeholder="Minimal 8 karakter"
                                required
                                minLength={8}
                            />
                        </div>
                    )}

                    {/* Active Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-gray-900">
                            Akun Aktif
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {editingUser ? 'Menyimpan...' : 'Membuat...'}
                                </div>
                            ) : (
                                editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
