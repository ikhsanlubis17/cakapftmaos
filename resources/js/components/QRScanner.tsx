import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '../contexts/ToastContext';
import { QrCodeIcon, ArrowLongUpIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline';
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';

interface QRScannerState {
    state: 'initial' | 'scanning' | 'barcodeDetected' | 'cameraError';
}

function scannerReducer(state: QRScannerState, action: { type: 'start' | 'barcodeDetected' | 'cameraError' | 'reset' }): QRScannerState {
    switch (action.type) {
        case 'start':
            return { ...state, state: 'scanning' };
        case 'barcodeDetected':
            return { ...state, state: 'barcodeDetected' };
        case 'cameraError':
            return { ...state, state: 'cameraError' };
        case 'reset':
            return { ...state, state: 'initial' };
        default:
            return state;
    }
}

const QRScanner = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [scannerState, dispatch] = useReducer(scannerReducer, { state: 'initial' });
    const { apiClient } = useAuth();

    const validateMutation = useMutation({
        mutationFn: async (qrCode: string) => {
            const resp = await apiClient.post('/api/inspections/validate', { apar_qrCode: qrCode });
            return resp.data;
        },
        throwOnError: false,
    });

    const onScanSuccess = async (barcode: IDetectedBarcode[]) => {
        try {
            console.log("QR Code detected:", barcode[0].rawValue);

            // Pause scanner to prevent multiple scans
            dispatch({ type: 'barcodeDetected' });

            // Extract QR code from decoded text
            const qrCode = barcode[0].rawValue.trim();

            // Validate QR code format (assuming it contains APAR ID or serial number)
            if (qrCode && qrCode.length > 0) {
                try {
                    const data = await validateMutation.mutateAsync(qrCode);

                    if (data?.valid) {
                        showSuccess('QR Code berhasil di-scan! Mengarahkan ke form inspeksi...');

                        // Navigate to inspection form with QR code and schedule info
                        setTimeout(() => {
                            const scheduleId = data.schedule?.id;
                            const navigationPath = scheduleId
                                ? `/inspections/enhanced/${qrCode}?schedule_id=${scheduleId}`
                                : `/inspections/enhanced/${qrCode}`;
                            // Use router navigate instead of window.location
                            // Cast to any to avoid strict typed `search` requirements here
                            navigate({ to: navigationPath } as any);
                        }, 1500);
                    } else {
                        showError(data?.message || 'QR Code tidak valid');
                        // Reset scanner after error
                        setTimeout(() => {
                            dispatch({ type: 'reset' });
                        }, 2000);
                    }
                } catch (error: any) {
                    console.error('Error validating QR code:', error);

                    const errorMessage = error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat memvalidasi QR Code';

                    showError(errorMessage);

                    // Reset scanner after error
                    setTimeout(() => {
                        dispatch({ type: 'reset' });
                    }, 2000);
                }
            } else {
                showError('QR Code tidak valid');
                // Reset scanner after error
                setTimeout(() => {
                    dispatch({ type: 'reset' });
                }, 2000);
            }
        } catch (error) {
            console.error('Error handling scan success:', error);
            showError('Terjadi kesalahan saat memproses QR Code');
            // Reset scanner after error
            setTimeout(() => {
                dispatch({ type: 'reset' });
            }, 2000);
        }
    };

    const onScanFailure = (error: unknown) => {
        // Handle scan failure silently (user might be moving camera)
        console.log('QR scan failed:', error);
    };


    return (
        <div className="min-h-screen">
            <div className="max-w-lg mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-red-600 mb-4 shadow-lg">
                            <QrCodeIcon className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Scan QR Code APAR
                        </h1>
                        <p className="text-lg text-gray-600">
                            Arahkan kamera ke QR Code yang terpasang pada APAR
                        </p>
                        {scannerState.state === 'initial' && (
                            <button
                                onClick={() => dispatch({ type: 'start' })
                                }
                                className="mx-auto mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                            >
                                <ArrowLongUpIcon className="h-5 w-5" />
                                <span>Mulai Scan</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Camera Error Display */}
                {scannerState.state === 'cameraError' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-red-800">
                                    Error Kamera
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    Tidak dapat mengakses kamera. Pastikan izin kamera diberikan dan perangkat Anda memiliki kamera yang berfungsi.
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'reset' })}
                                        className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-200 hover:shadow-md"
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Scanner Container */}
                {scannerState.state != 'initial' && scannerState.state != 'cameraError' && (
                    <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                        <Scanner
                            onScan={(result) => onScanSuccess(result)}
                            onError={onScanFailure}
                            scanDelay={500}
                            paused={scannerState.state === 'barcodeDetected' || validateMutation.status === 'pending'}
                        />

                        {/* Scanner Status */}
                        <div className="mt-4 text-center">
                            {scannerState.state === 'scanning' && (
                                <p className="text-sm text-blue-600 font-medium">
                                    🔍 Scanning... Arahkan kamera ke QR Code
                                </p>
                            )}
                            {scannerState.state === 'barcodeDetected' && (
                                <p className="text-sm text-green-600 font-medium">
                                    ✓ QR Code terdeteksi! Memvalidasi...
                                </p>
                            )}
                           {validateMutation.status === 'pending' && (
                               <p className="text-sm text-gray-600 font-medium">Memvalidasi QR Code...</p>
                           )}
                        </div>

                        {/* Restart Scanner Button */}
                        {scannerState.state === 'scanning' && (
                            <button
                                onClick={() => dispatch({ type: 'reset' })}
                                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                            >
                                <ArrowPathIcon className="h-5 w-5" />
                                <span>Mulai Ulang</span>
                            </button>
                        )}
                    </div>
                )}


                {/* Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <CameraIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900">
                            Petunjuk Penggunaan
                        </h3>
                    </div>
                    <ul className="text-blue-800 space-y-3">
                        <li className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                                1
                            </span>
                            <span>
                                Pastikan QR Code APAR terlihat jelas dan tidak
                                rusak
                            </span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                                2
                            </span>
                            <span>
                                Jaga kamera tetap stabil dan tidak bergerak
                            </span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                                3
                            </span>
                            <span>
                                Pastikan pencahayaan cukup dan tidak ada
                                bayangan
                            </span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-800">
                                4
                            </span>
                            <span>
                                QR Code akan otomatis ter-scan saat terdeteksi
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                {/* <div className="flex space-x-4">
                    <button
                        onClick={() => dispatch({ type: 'reset' })}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                        <span>Mulai Ulang</span>
                    </button>
                </div> */}

                {/* Footer */}
                <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2">
                        <img
                            src="/images/logo2.svg"
                            alt="CAKAP FT MAOS Logo"
                            className="h-5 w-5"
                        />
                        <p className="text-sm text-gray-500 font-medium">
                            CAKAP FT MAOS - Sistem Monitoring APAR
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
