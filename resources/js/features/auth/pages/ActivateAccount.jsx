import React, { useEffect, useState } from 'react';
import { createApiClient } from '../../../services/api';
// Create a client instance
const api = createApiClient();
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ActivateAccount = () => {
    const [status, setStatus] = useState('input'); // input, submitting, success, error
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: ''
    });

    const token = new URLSearchParams(window.location.search).get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token aktivasi tidak ditemukan dalam URL.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.password_confirmation) {
            alert('Konfirmasi password tidak cocok.');
            return;
        }

        setStatus('submitting');
        setMessage('Sedang memproses aktivasi...');

        try {
            const response = await api.post('/api/activate', { 
                token,
                password: formData.password,
                password_confirmation: formData.password_confirmation
            });
            setStatus('success');
            setMessage(response.data.message || 'Akun berhasil diaktivasi!');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Gagal mengaktivasi akun. Silakan hubungi admin.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    
                    {/* Input Form State */}
                    {status === 'input' && (
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Aktivasi Akun</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Silakan buat password baru untuk mengaktifkan akun Anda.
                                </p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password Baru
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            minLength={8}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            placeholder="Minimal 8 karakter"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                        Konfirmasi Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                            required
                                            minLength={8}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                            placeholder="Ulangi password baru"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Aktifkan Akun
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Loading State */}
                    {status === 'submitting' && (
                        <div className="flex flex-col items-center py-6">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                            <p className="text-gray-600 font-medium">{message}</p>
                        </div>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center py-4">
                            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aktivasi Berhasil</h2>
                            <p className="text-gray-600 text-center mb-6">{message}</p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Ke Halaman Login
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center py-4">
                            <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aktivasi Gagal</h2>
                            <p className="text-gray-600 text-center mb-6">{message}</p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Kembali ke Beranda
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivateAccount;
