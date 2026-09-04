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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-white rounded-[6px] border border-[#EEEEEE] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#EEEEEE] flex items-center justify-between bg-slate-50">
                    <h3 className="text-base font-bold text-[#041562] tracking-tight">
                        {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 rounded-[6px] p-1 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                            placeholder="Masukkan nama lengkap"
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                            placeholder="contoh@email.com"
                            required
                        />
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Nomor Telepon
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                            placeholder="081234567890"
                        />
                    </div>

                    {/* Role Field */}
                    <div>
                        <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Role
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                        >
                            <option value="teknisi">Teknisi</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    {/* Password Field - Only for new users */}
                    {/* Admin Password Confirmation - Required for creating new users */}
                    {!editingUser && (
                        <div>
                            <label htmlFor="admin_password" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Konfirmasi Password Admin
                            </label>
                            <input
                                type="password"
                                id="admin_password"
                                value={formData.admin_password}
                                onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                                className="block w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50/50 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                                placeholder="Masukkan password admin Anda untuk konfirmasi"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Diperlukan untuk validasi keamanan. User baru akan membuat password mereka sendiri saat aktivasi.
                            </p>
                        </div>
                    )}

                    {/* Password Reset - Only for editing users */}
                    {editingUser && (
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Reset Password (Opsional)
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                                placeholder="Kosongkan jika tidak ingin mengubah"
                                minLength={8}
                            />
                        </div>
                    )}

                    {/* Active Status */}
                    {editingUser ? (
                        <div className="flex items-center pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-slate-300 rounded-[3px]"
                            />
                            <label htmlFor="is_active" className="ml-2.5 block text-xs font-semibold text-slate-900">
                                Akun Aktif (Dapat Login)
                            </label>
                        </div>
                    ) : (
                        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-[6px]">
                            <p className="text-xs text-[#041562]">
                                Pengguna baru akan menerima email aktivasi. Akun belum dapat digunakan login sampai diaktivasi oleh pengguna.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-all flex items-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
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
