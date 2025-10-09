import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { QrCodeIcon, ArrowLeftIcon, ArrowPathIcon, CameraIcon } from '@heroicons/react/24/outline';

const QRScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const scannerRef = useRef(null);
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        // Delay initialization to ensure DOM is ready
        const timer = setTimeout(() => {
            if (!isInitialized) {
                startScanner();
                setIsInitialized(true);
            }
        }, 500);
        
        return () => {
            clearTimeout(timer);
            // Cleanup on unmount
            (async () => {
                await cleanupScanner();
            })();
        };
    }, [isInitialized]);

    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                // Stop the scanner and release camera
                await scannerRef.current.clear();
                scannerRef.current = null;
                
                // Stop all media tracks to release camera properly
                const stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (error) {
                console.log('Scanner cleanup error:', error);
            }
        }
        
        // Additional cleanup: stop any remaining video streams
        try {
            const videoElements = document.querySelectorAll('video');
            videoElements.forEach(video => {
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                    video.srcObject = null;
                }
            });
        } catch (error) {
            console.log('Video cleanup error:', error);
        }
    };

    const startScanner = async () => {
        try {
            // Clean up any existing scanner first
            cleanupScanner();
            
            setCameraError(null);
            setIsLoading(true);
            setScanning(true);

            // Check if camera permission is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Kamera tidak tersedia di browser ini');
            }

            // Check camera permissions
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (permissionError) {
                throw new Error('Izin kamera ditolak. Silakan aktifkan izin kamera di browser.');
            }

            // Ensure DOM element exists
            const qrReaderElement = document.getElementById('qr-reader');
            if (!qrReaderElement) {
                throw new Error('Element QR reader tidak ditemukan');
            }

            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 5,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    disableFlip: false,
                },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
            setIsLoading(false);

        } catch (error) {
            console.error('Error starting scanner:', error);
            setCameraError(error.message);
            setScanning(false);
            setIsLoading(false);
            showError(error.message);
        }
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        try {
            // Stop scanner immediately
            setScanning(false);
            await cleanupScanner();

            // Extract QR code from decoded text
            const qrCode = decodedText.trim();
            
            // Validate QR code format (assuming it contains APAR ID or serial number)
            if (qrCode && qrCode.length > 0) {
                showSuccess('QR Code berhasil di-scan! Mengarahkan ke form inspeksi...');
                
                // Navigate to inspection form with QR code
                setTimeout(() => {
                    navigate(`/dashboard/inspections/enhanced/${qrCode}`);
                }, 1500);
            } else {
                showError('QR Code tidak valid');
                // Restart scanner after error
                setTimeout(() => {
                    startScanner();
                }, 2000);
            }
        } catch (error) {
            console.error('Error handling scan success:', error);
            showError('Terjadi kesalahan saat memproses QR Code');
            // Restart scanner after error
            setTimeout(() => {
                startScanner();
            }, 2000);
        }
    };

    const onScanFailure = (error) => {
        // Handle scan failure silently (user might be moving camera)
        // Only log specific errors, not the common "no QR code detected' errors
        if (error && !error.message?.includes('No barcode') && !error.message?.includes('NotFoundException')) {
            console.log('QR scan failed:', error);
        }
    };

    const handleRetry = () => {
        setCameraError(null);
        setIsInitialized(false);
        setTimeout(() => {
            startScanner();
            setIsInitialized(true);
        }, 100);
    };

    const handleBack = async () => {
        await cleanupScanner();
        // Small delay to ensure cleanup completes
        setTimeout(() => {
            navigate("/dashboard");
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
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
                    </div>
                </div>

                {/* Camera Error Display */}
                {cameraError && (
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
                                    {cameraError}
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={handleRetry}
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
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div id="qr-reader" className="mb-4"></div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">
                                    Memulai kamera...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Scanner Status */}
                    {scanning && !isLoading && !cameraError && (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                Kamera aktif - Arahkan ke QR Code
                            </div>
                        </div>
                    )}
                </div>

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
                <div className="flex space-x-4">
                    <button
                        onClick={handleBack}
                        className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span>Kembali</span>
                    </button>
                    <button
                        onClick={handleRetry}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                        <span>Mulai Ulang</span>
                    </button>
                </div>

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