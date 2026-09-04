import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { AxiosError } from 'axios';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const { login, isLoading } = useAuth();
    const { showSuccess, showError } = useToast();
    const { settings } = useSiteSettings();

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            showError('Masukkan alamat email Anda terlebih dahulu.');
            return;
        }
        setForgotLoading(true);
        try {
            await axios.post('/api/forgot-password', { email: forgotEmail });
            showSuccess(`Instruksi pemulihan kata sandi telah dikirim ke ${forgotEmail}. Periksa kotak masuk email Anda.`);
            setShowForgotPassword(false);
            setForgotEmail('');
        } catch (error) {
            const msg =
                error?.response?.data?.errors?.email?.[0] ||
                error?.response?.data?.message ||
                'Gagal mengirim email pemulihan. Silakan coba lagi atau hubungi Admin HSSE.';
            showError(msg);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await login({ email: email, password: password });
            showSuccess('Login berhasil. Selamat datang kembali!');
        } catch (error) {
            if (error instanceof AxiosError) {
                showError(error.response?.data?.message || 'Gagal melakukan login. Silakan coba lagi.');
            } else {
                showError('Gagal melakukan login. Silakan coba lagi.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#041562] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Grid & Ambient Highlights */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#11468F] rounded-full blur-3xl opacity-30"></div>
            </div>


            <div className="relative max-w-md w-full mx-auto space-y-6">
                {/* Header Branding */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-[6px] bg-white p-2 shadow-md mb-4 border border-white/20">
                        <img
                            src={settings.site_logo}
                            alt={`${settings.site_name} Logo`}
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            {settings.site_name}
                        </h2>
                        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-[#11468F] text-white uppercase tracking-wider">
                            CMMS
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                        {settings.site_tagline} &bull; {settings.organization_name}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[6px] shadow-xl p-8 border border-[#EEEEEE]">
                    <div className="mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#11468F] mb-1">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>Portal Autentikasi</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#041562] tracking-tight">
                            Masuk ke Akun Anda
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Masukkan kredensial resmi untuk mengakses terminal inspeksi
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                            >
                                Alamat Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-4 py-2.5 bg-white border border-slate-300 placeholder-slate-400 text-slate-900 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm transition-all duration-150"
                                    placeholder="nama@pertamina.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                            >
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-2.5 pr-12 bg-white border border-slate-300 placeholder-slate-400 text-slate-900 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm transition-all duration-150"
                                    placeholder="Masukkan kata sandi"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Memverifikasi...
                                    </div>
                                ) : (
                                    <span className="flex items-center">
                                        Masuk ke Sistem
                                        <svg
                                            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-150"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="pt-1 text-center">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(!showForgotPassword)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11468F] hover:text-[#0d3873] hover:underline transition-colors duration-150"
                            >
                                <KeyIcon className="w-3.5 h-3.5" />
                                Lupa Kata Sandi?
                            </button>
                        </div>

                        {/* Back to Landing Page Button */}
                        <div className="pt-2">
                            <Link
                                to="/welcome"
                                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-[6px] text-[#11468F] bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all duration-150"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Kembali ke Halaman Depan
                            </Link>
                        </div>
                    </form>

                    {/* Forgot Password Modal/Panel */}
                    {showForgotPassword && (
                        <div className="mt-4 p-4 rounded-[6px] bg-blue-50 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <KeyIcon className="w-4 h-4 text-[#11468F]" />
                                <h4 className="text-sm font-bold text-[#041562]">Pemulihan Kata Sandi</h4>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">
                                Masukkan alamat email Anda. Kami akan mengirimkan instruksi untuk mengatur ulang kata sandi.
                            </p>
                            <form onSubmit={handleForgotPassword} className="space-y-3">
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="nama@pertamina.com"
                                    required
                                    className="appearance-none block w-full px-4 py-2.5 bg-white border border-slate-300 placeholder-slate-400 text-slate-900 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm transition-all duration-150"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                                    >
                                        {forgotLoading ? 'Mengirim...' : 'Kirim Instruksi'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-[6px] text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-all duration-150"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Support note */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">
                            Kendala akses akun? Hubungi Admin HSSE {settings.organization_name}.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-300">
                    <p>
                        &copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;