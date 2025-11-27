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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat pengaturan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
                        <p className="text-gray-600 mt-1">
                            Konfigurasi sistem monitoring APAR
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CogIcon className="h-8 w-8 text-red-600" />
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
                <div className="flex justify-end space-x-3">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <PencilSquareIcon className="h-5 w-5 mr-2" />
                            Edit Pengaturan Default
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XMarkIcon className="h-5 w-5 mr-2" />
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="loading-spinner mr-2"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        Simpan Pengaturan
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