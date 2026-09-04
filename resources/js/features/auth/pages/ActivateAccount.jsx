import React, { useEffect, useState } from 'react';
import { createApiClient } from '../../../services/api';
import { CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const api = createApiClient();

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
        <div className="min-h-screen bg-[#041562] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Grid */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl rounded-[6px] border border-[#EEEEEE] sm:px-10">
                    
                    {/* Input Form State */}
                    {status === 'input' && (
                        <div>
                            <div className="text-center mb-6 pb-4 border-b border-slate-100">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[20px] bg-[#EEEEEE] border border-slate-200 text-xs font-semibold text-[#041562] uppercase tracking-wider mb-3">
                                    <ShieldCheckIcon className="w-4 h-4 text-[#11468F]" />
                                    <span>Aktivasi Akun</span>
                                </div>
                                <h2 className="text-xl font-bold text-[#041562] tracking-tight">Atur Kata Sandi Baru</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Silakan buat kata sandi baru untuk mengaktifkan akses Anda ke sistem.
                                </p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Password Baru
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={8}
                                        className="appearance-none block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-[6px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm transition-all duration-150"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        placeholder="Minimal 8 karakter"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Konfirmasi Password
                                    </label>
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        required
                                        minLength={8}
                                        className="appearance-none block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-[6px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm transition-all duration-150"
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                        placeholder="Ulangi password baru"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-3 px-4 rounded-[6px] text-sm font-semibold text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] transition-all duration-150"
                                    >
                                        Aktifkan Akun
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Loading State */}
                    {status === 'submitting' && (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-10 h-10 border-3 border-slate-200 border-t-[#11468F] rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-600 text-sm font-medium">{message}</p>
                        </div>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center py-6 text-center">
                            <CheckCircleIcon className="h-14 w-14 text-emerald-500 mb-4" />
                            <h2 className="text-xl font-bold text-[#041562] mb-2">Aktivasi Berhasil</h2>
                            <p className="text-sm text-slate-600 mb-6">{message}</p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full flex justify-center py-2.5 px-4 rounded-[6px] text-sm font-semibold text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-all duration-150"
                            >
                                Ke Halaman Login
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center py-6 text-center">
                            <XCircleIcon className="h-14 w-14 text-[#DA1212] mb-4" />
                            <h2 className="text-xl font-bold text-[#041562] mb-2">Aktivasi Gagal</h2>
                            <p className="text-sm text-slate-600 mb-6">{message}</p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full flex justify-center py-2.5 px-4 rounded-[6px] text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all duration-150"
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
