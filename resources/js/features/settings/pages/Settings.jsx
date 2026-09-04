import React, { useState } from 'react';
import { CogIcon, CheckCircleIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../hooks/useSettings';
import GpsSettingsForm from '../components/GpsSettingsForm';
import ScheduleSettingsForm from '../components/ScheduleSettingsForm';
import NotificationSettingsForm from '../components/NotificationSettingsForm';
import InspectionSettingsForm from '../components/InspectionSettingsForm';
import SecuritySettingsForm from '../components/SecuritySettingsForm';


const Settings = () => {
    const {
        settings,
        isLoading,
        saving,
        handleSubmit,
        handleChange,
        getFieldError,
        hasError,
    } = useSettings();

    const [isEditing, setIsEditing] = useState(false);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        await handleSubmit(e);
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F] mx-auto mb-4"></div>
                    <p className="text-sm font-semibold text-slate-500">Memuat konfigurasi sistem...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-black text-xl shadow-sm">
                        <CogIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Konfigurasi operasional, validasi GPS, jadwal inspeksi, dan keamanan platform
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* GPS & Location Settings */}
                <GpsSettingsForm
                    settings={settings}
                    onChange={handleChange}
                    getFieldError={getFieldError}
                    hasError={hasError}
                    disabled={!isEditing}
                />

                {/* Schedule & Interval Settings */}
                <ScheduleSettingsForm
                    settings={settings}
                    onChange={handleChange}
                    getFieldError={getFieldError}
                    hasError={hasError}
                    disabled={!isEditing}
                />

                {/* Notification Settings */}
                <NotificationSettingsForm
                    settings={settings}
                    onChange={handleChange}
                    getFieldError={getFieldError}
                    hasError={hasError}
                    disabled={!isEditing}
                />

                {/* Inspection Settings */}
                <InspectionSettingsForm
                    settings={settings}
                    onChange={handleChange}
                    getFieldError={getFieldError}
                    hasError={hasError}
                    disabled={!isEditing}
                />

                {/* Security & Session Settings */}
                <SecuritySettingsForm
                    settings={settings}
                    onChange={handleChange}
                    getFieldError={getFieldError}
                    hasError={hasError}
                    disabled={!isEditing}
                />

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-2">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-6 py-2.5 border border-slate-300 text-sm font-bold rounded-[6px] text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#11468F] shadow-sm transition-colors"
                        >
                            <PencilSquareIcon className="h-4 w-4 mr-2 text-slate-600" />
                            Ubah Pengaturan
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                                className="inline-flex items-center px-6 py-2.5 border border-slate-300 text-sm font-bold rounded-[6px] text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#11468F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XMarkIcon className="h-4 w-4 mr-2" />
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-[#11468F] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Settings;