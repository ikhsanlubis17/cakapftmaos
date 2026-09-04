import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useToast } from '@/contexts/ToastContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import {
    EyeIcon,
    EyeSlashIcon,
    ArrowLeftIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const ResetPassword = () => {
    const { settings } = useSiteSettings();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    // @ts-ignore
    const search = useSearch({ strict: false });

    const token = search?.token || '';
    const email = search?.email || '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Validate token presence
    const isTokenValid = Boolean(token && email);

    // Password strength check
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 1) return { level: score, label: 'Sangat Lemah', color: '#ef4444' };
        if (score === 2) return { level: score, label: 'Lemah', color: '#f97316' };
        if (score === 3) return { level: score, label: 'Cukup', color: '#eab308' };
        if (score === 4) return { level: score, label: 'Kuat', color: '#22c55e' };
        return { level: score, label: 'Sangat Kuat', color: '#16a34a' };
    };

    const strength = getPasswordStrength(password);
    const passwordsMatch = password && passwordConfirmation && password === passwordConfirmation;
    const passwordMismatch = password && passwordConfirmation && password !== passwordConfirmation;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== passwordConfirmation) {
            setErrorMsg('Konfirmasi kata sandi tidak cocok.');
            return;
        }
        if (password.length < 8) {
            setErrorMsg('Kata sandi minimal 8 karakter.');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/reset-password', {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setIsSuccess(true);
            showSuccess('Kata sandi berhasil diperbarui. Silakan login.');
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.errors?.token?.[0] ||
                error?.response?.data?.errors?.email?.[0] ||
                error?.response?.data?.errors?.password?.[0] ||
                'Gagal mengatur ulang kata sandi. Silakan coba lagi.';
            setErrorMsg(msg);
            showError(msg);
        } finally {
            setIsLoading(false);
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
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#11468F] rounded-full blur-3xl opacity-30" />
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
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            {settings.site_name}
                        </h1>
                        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-[#11468F] text-white uppercase tracking-wider">
                            CMMS
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                        {settings.site_tagline} &bull; {settings.organization_name}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[6px] shadow-xl p-6 sm:p-8 border border-[#EEEEEE]">
                    {/* Card Header */}
                    <div className="mb-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#11468F] mb-1">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>Atur Ulang Kata Sandi</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#041562] tracking-tight">
                            Buat Kata Sandi Baru
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {email ? (
                                <>
                                    Mengatur ulang kata sandi untuk{' '}
                                    <span className="font-semibold text-[#11468F] break-all">{email}</span>
                                </>
                            ) : (
                                'Masukkan kata sandi baru Anda.'
                            )}
                        </p>
                    </div>

                    {/* Token invalid state */}
                    {!isTokenValid && (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#041562] mb-1">Link Tidak Valid</h3>
                                <p className="text-xs text-slate-500">
                                    Link reset kata sandi tidak valid atau sudah kedaluwarsa. Silakan minta link baru.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#11468F] hover:underline"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                Kembali ke Halaman Login
                            </Link>
                        </div>
                    )}

                    {/* Success state */}
                    {isTokenValid && isSuccess && (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#041562] mb-1">Kata Sandi Diperbarui!</h3>
                                <p className="text-xs text-slate-500">
                                    Kata sandi Anda berhasil diubah. Silakan login menggunakan kata sandi baru.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] transition-all duration-150"
                            >
                                Masuk ke Sistem
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    )}

                    {/* Form */}
                    {isTokenValid && !isSuccess && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error alert */}
                            {errorMsg && (
                                <div className="flex items-start gap-2.5 p-3 rounded-[6px] bg-red-50 border border-red-100 text-red-700 text-xs">
                                    <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Password Field */}
                            <div>
                                <label
                                    htmlFor="new-password"
                                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                                >
                                    Kata Sandi Baru
                                </label>
                                <div className="relative">
                                    <input
                                        id="new-password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-2.5 pr-12 bg-white border border-slate-300 placeholder-slate-400 text-slate-900 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm transition-all duration-150"
                                        placeholder="Minimal 8 karakter"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Password Strength Bar */}
                                {password && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className="h-1 flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        backgroundColor: i <= strength.level ? strength.color : '#e2e8f0',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-medium" style={{ color: strength.color }}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label
                                    htmlFor="confirm-password"
                                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                                >
                                    Konfirmasi Kata Sandi
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirm-password"
                                        name="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className={`appearance-none block w-full px-4 py-2.5 pr-12 bg-white border placeholder-slate-400 text-slate-900 rounded-[6px] focus:outline-none focus:ring-2 text-sm transition-all duration-150 ${
                                            passwordMismatch
                                                ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
                                                : passwordsMatch
                                                ? 'border-green-300 focus:ring-green-400 focus:border-green-400'
                                                : 'border-slate-300 focus:ring-[#11468F] focus:border-[#11468F]'
                                        }`}
                                        placeholder="Ulangi kata sandi baru"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                {passwordMismatch && (
                                    <p className="mt-1 text-[11px] text-red-500 font-medium">
                                        Kata sandi tidak cocok.
                                    </p>
                                )}
                                {passwordsMatch && (
                                    <p className="mt-1 text-[11px] text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        Kata sandi cocok.
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isLoading || !!passwordMismatch}
                                    className="group relative w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Menyimpan...
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Simpan Kata Sandi Baru
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </span>
                                    )}
                                </button>

                                {/* Back to Login */}
                                <Link
                                    to="/login"
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-[6px] text-[#11468F] bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all duration-150"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                    Kembali ke Halaman Login
                                </Link>
                            </div>
                        </form>
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
                    <p>&copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
