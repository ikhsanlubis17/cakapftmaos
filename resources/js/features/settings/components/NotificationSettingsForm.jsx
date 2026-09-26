import React, { useState } from 'react';
import { 
    BellIcon, 
    EnvelopeIcon, 
    PaperAirplaneIcon, 
    ShieldExclamationIcon, 
    WrenchScrewdriverIcon, 
    CalendarDaysIcon, 
    ClockIcon,
    CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const NotificationSettingsForm = ({ settings, onChange, getFieldError, hasError, disabled }) => {
    const { apiClient, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [testEmail, setTestEmail] = useState(user?.email || '');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testSentMessage, setTestSentMessage] = useState(null);

    const handleSendTestEmail = async (e) => {
        e.preventDefault();
        if (!testEmail) {
            showError('Masukkan alamat email tujuan pengujian');
            return;
        }

        setIsSendingTest(true);
        setTestSentMessage(null);
        try {
            const res = await apiClient.post('/api/settings/test-email', { email: testEmail });
            if (res.data.success) {
                showSuccess(res.data.message || 'Email uji coba berhasil dikirim!');
                setTestSentMessage(res.data.message);
            } else {
                showError(res.data.message || 'Gagal mengirim email uji coba.');
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Terjadi kesalahan saat menghubungi server SMTP.';
            showError(errMsg);
        } finally {
            setIsSendingTest(false);
        }
    };

    const isMasterEnabled = settings.mail_notification_enabled !== false;

    return (
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded bg-[#041562]/10 flex items-center justify-center mr-3">
                        <BellIcon className="h-5 w-5 text-[#041562]" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[#041562]">Pengaturan Notifikasi & Gmail SMTP</h2>
                        <p className="text-xs text-slate-500">Konfigurasi automasi pengiriman email operasional dan peringatan HSSE</p>
                    </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    isMasterEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                    {isMasterEnabled ? 'SMTP Aktif' : 'SMTP Nonaktif'}
                </span>
            </div>
            
            {/* Master Switch */}
            <div className={`p-4 rounded-[6px] border transition-colors ${
                isMasterEnabled 
                    ? 'bg-blue-50/50 border-[#11468F]/20' 
                    : 'bg-slate-50 border-slate-200'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <EnvelopeIcon className={`w-5 h-5 mt-0.5 ${isMasterEnabled ? 'text-[#11468F]' : 'text-slate-400'}`} />
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Master Switch Notifikasi Email (SMTP)</h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                                Mengaktifkan/menonaktifkan seluruh antrean pengiriman email background queue di sistem.
                            </p>
                        </div>
                    </div>
                    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={isMasterEnabled}
                            onChange={(e) => onChange('mail_notification_enabled', e.target.checked)}
                            disabled={disabled}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#11468F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11468F]"></div>
                    </label>
                </div>
            </div>

            {/* Event Specific Notification Rules */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Trigger Notifikasi Lapangan & Otomatisasi</h3>

                {/* 1. Critical Damaged APAR -> Supervisors Only */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-[6px] hover:border-slate-300 transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded bg-rose-50 text-[#DA1212] mt-0.5">
                            <ShieldExclamationIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                Peringatan APAR Rusak Kritis (Supervisor Only)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Dikirim instan ke email seluruh akun Supervisor saat teknisi mendeteksi kerusakan tabung berat di lapangan.
                            </p>
                        </div>
                    </div>
                    <label className={`relative inline-flex items-center ${disabled || !isMasterEnabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={settings.notify_on_damaged_apar !== false}
                            onChange={(e) => onChange('notify_on_damaged_apar', e.target.checked)}
                            disabled={disabled || !isMasterEnabled}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#041562]"></div>
                    </label>
                </div>

                {/* 2. Repair Assignment -> Assigned Technician */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-[6px] hover:border-slate-300 transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded bg-blue-50 text-[#11468F] mt-0.5">
                            <WrenchScrewdriverIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                Penugasan Tiket Perbaikan ke Teknisi
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Dikirim ke teknisi yang ditunjuk segera setelah Supervisor menyetujui jadwal perbaikan.
                            </p>
                        </div>
                    </div>
                    <label className={`relative inline-flex items-center ${disabled || !isMasterEnabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={settings.notify_on_repair_assignment !== false}
                            onChange={(e) => onChange('notify_on_repair_assignment', e.target.checked)}
                            disabled={disabled || !isMasterEnabled}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#041562]"></div>
                    </label>
                </div>

                {/* 3. Daily Shift Reminder at 07:00 WIB */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-[6px] hover:border-slate-300 transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded bg-indigo-50 text-indigo-700 mt-0.5">
                            <CalendarDaysIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                Pengingat Shift Pagi Harian (07:00 WIB)
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Dikirim setiap pukul 07:00 WIB berisi rekap seluruh target inspeksi APAR teknisi untuk hari berjalan.
                            </p>
                        </div>
                    </div>
                    <label className={`relative inline-flex items-center ${disabled || !isMasterEnabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={settings.notify_daily_schedule !== false}
                            onChange={(e) => onChange('notify_daily_schedule', e.target.checked)}
                            disabled={disabled || !isMasterEnabled}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#041562]"></div>
                    </label>
                </div>
            </div>

            {/* Threshold Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4 text-slate-400" />
                        Peringatan Kedaluwarsa APAR (Hari)
                    </label>
                    <input
                        type="number"
                        min="7"
                        max="90"
                        value={settings.notify_apar_expiry_days ?? 30}
                        onChange={(e) => onChange('notify_apar_expiry_days', parseInt(e.target.value) || 30)}
                        disabled={disabled || !isMasterEnabled}
                        className={`w-full border ${hasError('notify_apar_expiry_days') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('notify_apar_expiry_days') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('notify_apar_expiry_days')}
                        </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                        Kirim digest berkala ke Supervisor untuk tabung yang akan expired dalam X hari.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4 text-slate-400" />
                        Interval Notifikasi Rutin (Jam)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="168"
                        value={settings.notification_interval ?? 24}
                        onChange={(e) => onChange('notification_interval', parseInt(e.target.value) || 24)}
                        disabled={disabled || !isMasterEnabled}
                        className={`w-full border ${hasError('notification_interval') ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 bg-white'} rounded-[6px] px-3.5 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                    />
                    {hasError('notification_interval') && (
                        <p className="text-xs text-[#DA1212] font-semibold mt-1">
                            {getFieldError('notification_interval')}
                        </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                        Frekuensi jeda waktu antar pengingat jadwal tertunda.
                    </p>
                </div>
            </div>

            {/* SMTP Test Connection Panel */}
            <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <PaperAirplaneIcon className="w-4 h-4 text-[#11468F]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Uji Konektivitas Gmail SMTP</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                        Kirim email uji coba langsung untuk memastikan kredensial App Password Gmail dan server SMTP terhubung dengan lancar.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="Alamat email penerima uji coba..."
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            disabled={isSendingTest}
                            className="flex-1 border border-slate-300 rounded-[6px] px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] bg-white disabled:bg-slate-100"
                        />
                        <button
                            type="button"
                            onClick={handleSendTestEmail}
                            disabled={isSendingTest || !testEmail}
                            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#041562] hover:bg-[#11468F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                        >
                            {isSendingTest ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2"></div>
                                    Menguji Koneksi...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Kirim Email Tes
                                </>
                            )}
                        </button>
                    </div>
                    {testSentMessage && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                            <CheckCircleIcon className="w-4 h-4 shrink-0" />
                            <span>{testSentMessage}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsForm;
