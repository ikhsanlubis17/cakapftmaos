import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface LocationState {
    current: { lat: number; lng: number } | null;
    loading: boolean;
    valid: boolean;
    error: string;
    distance: number | null;
    validRadius: number | null;
    direction: number | null;
}

interface LocationDisplayProps {
    location: LocationState;
    aparLatitude?: number;
    aparLongitude?: number;
    onRefresh: () => void;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
    location,
    aparLatitude,
    aparLongitude,
    onRefresh,
}) => {
    const { current, loading, valid, error, distance, validRadius, direction } = location;

    return (
        <div
            className={`bg-white shadow-xl rounded-2xl p-6 border border-gray-100 ${
                loading
                    ? 'border-l-4 border-blue-400 bg-blue-50'
                    : valid
                    ? 'border-l-4 border-green-400 bg-green-50'
                    : 'border-l-4 border-red-400 bg-red-50'
            }`}
        >
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                    {loading ? (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : valid ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Validasi Lokasi</h3>
                    <p className="text-gray-600">
                        {loading
                            ? 'Mendapatkan lokasi...'
                            : valid
                            ? 'Lokasi valid. Anda berada di lokasi APAR.'
                            : error || 'Lokasi tidak valid.'}
                    </p>
                    {current && (
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500 font-mono">
                                Lokasi Anda: {current.lat.toFixed(6)}, {current.lng.toFixed(6)}
                            </p>
                            {aparLatitude && aparLongitude && (
                                <p className="text-sm text-gray-500 font-mono">
                                    🎯 APAR: {aparLatitude}, {aparLongitude}
                                </p>
                            )}
                            {distance !== null && validRadius !== null && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-4">
                                            <span
                                                className={`px-2 py-1 rounded-full font-medium ${
                                                    valid
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                Jarak: {distance}m
                                            </span>
                                            <span className="text-gray-600">Maksimal: {validRadius}m</span>
                                        </div>
                                        {!valid && !loading && (
                                            <button
                                                type="button"
                                                onClick={onRefresh}
                                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Refresh
                                            </button>
                                        )}
                                    </div>

                                    {/* Distance Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                valid ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                            style={{
                                                width: `${Math.min((distance / validRadius) * 100, 100)}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>0m</span>
                                        <span>{validRadius}m</span>
                                    </div>

                                    {/* Status Text */}
                                    <div className="text-center">
                                        <div className={`text-xs font-medium ${valid ? 'text-green-600' : 'text-red-600'}`}>
                                            {valid ? 'Dalam radius valid' : 'Di luar radius valid'}
                                        </div>
                                        {!valid && distance > validRadius && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Perlu mendekat {distance - validRadius}m lagi
                                            </div>
                                        )}
                                    </div>

                                    {/* Direction Compass */}
                                    {direction !== null && !valid && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-gray-700 mb-2">Arah ke APAR</div>
                                                <div className="relative w-24 h-24 mx-auto">
                                                    <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
                                                    <MapPinIcon
                                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-red-600 transition-transform"
                                                        style={{ transform: `translate(-50%, -50%) rotate(${direction}deg)` }}
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-500 mt-2">{Math.round(direction)}°</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
