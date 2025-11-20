import React from 'react';
import { useNavigate, getRouteApi } from '@tanstack/react-router';
import { FireIcon, MapPinIcon, TruckIcon } from '@heroicons/react/24/outline';
import { useInspectionForm } from '../hooks/useInspectionForm';
import { AparSelector } from '../components/AparSelector';
import { PhotoCapture } from '../components/PhotoCapture';
import { LocationDisplay } from '../components/LocationDisplay';
import { ConditionSelector } from '../components/ConditionSelector';

const InspectionForm: React.FC = () => {
    const route = getRouteApi('/authenticated/inspections/new/{-$qrCode}');
    const { qrCode } = route.useParams();
    const navigate = useNavigate();

    const {
        apar,
        submitting,
        searchTerm,
        setSearchTerm,
        filteredAparList,
        location,
        formData,
        setFormData,
        damageCategories,
        isLoading,
        getCurrentLocation,
        handlePhotoCapture,
        removePhoto,
        handleSubmit,
        handleAparSelect,
    } = useInspectionForm(qrCode);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    // APAR selection view
    if (!apar) {
        return (
            <AparSelector
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                aparList={filteredAparList}
                onAparSelect={handleAparSelect}
                isLoading={isLoading}
            />
        );
    }

    // Main inspection form
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Inspeksi APAR</h1>
                            <div className="flex items-center space-x-3">
                                <p className="text-lg font-semibold text-gray-700">
                                    {apar?.serial_number || 'N/A'}
                                </p>
                                <span className="text-gray-400">•</span>
                                <p className="text-gray-600">{apar?.location_name || 'N/A'}</p>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                {apar?.location_type === 'statis' ? (
                                    <MapPinIcon className="h-4 w-4 text-blue-600" />
                                ) : (
                                    <TruckIcon className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    {apar?.location_type === 'statis' ? 'APAR Statis' : 'APAR Mobil'}
                                </span>
                                {apar?.location_type === 'statis' && apar?.valid_radius && (
                                    <span className="text-xs text-gray-500">Radius: {apar.valid_radius}m</span>
                                )}
                            </div>

                            {/* APAR Details */}
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-gray-600">Tipe</div>
                                    <div className="font-medium text-gray-900 capitalize">
                                        {apar?.aparType?.name || 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-gray-600">Status</div>
                                    <div
                                        className={`font-medium ${
                                            apar?.status === 'active'
                                                ? 'text-green-600'
                                                : apar?.status === 'inactive'
                                                ? 'text-red-600'
                                                : apar?.status === 'needs_repair'
                                                ? 'text-yellow-600'
                                                : apar?.status === 'under_repair'
                                                ? 'text-blue-600'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {apar?.status === 'active'
                                            ? 'Aktif'
                                            : apar?.status === 'inactive'
                                            ? 'Nonaktif'
                                            : apar?.status === 'needs_repair'
                                            ? 'Perlu Perbaikan'
                                            : apar?.status === 'under_repair'
                                            ? 'Sedang Perbaikan'
                                            : apar?.status || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Validation (for static APARs) */}
                {apar?.location_type === 'statis' && (
                    <LocationDisplay
                        location={location}
                        aparLatitude={apar.latitude}
                        aparLongitude={apar.longitude}
                        onRefresh={getCurrentLocation}
                    />
                )}

                {/* Inspection Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo Capture */}
                    <PhotoCapture
                        photos={formData.photos}
                        onPhotoCapture={handlePhotoCapture}
                        onRemovePhoto={removePhoto}
                    />

                    {/* Condition Selector */}
                    <ConditionSelector
                        formData={formData}
                        onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                        damageCategories={damageCategories}
                    />

                    {/* Submit Buttons */}
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate({ to: '/dashboard' })}
                            className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg"
                            disabled={submitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || (apar?.location_type === 'statis' && !location.valid)}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Menyimpan...</span>
                                </div>
                            ) : (
                                'Simpan Inspeksi'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InspectionForm;
