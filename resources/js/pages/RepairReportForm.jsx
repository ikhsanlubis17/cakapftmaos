import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
    CameraIcon,
    CheckCircleIcon,
    FireIcon,
    XMarkIcon,
    MapPinIcon,
    UserIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

const RepairReportForm = () => {
    const { approvalId } = useParams();
    const navigate = useNavigate();
    const beforeVideoRef = useRef(null);
    const beforeCanvasRef = useRef(null);
    const afterVideoRef = useRef(null);
    const afterCanvasRef = useRef(null);
    
    const [approval, setApproval] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const { showSuccess, showError } = useToast();
    
    // Form state
    const [formData, setFormData] = useState({
        repair_description: '',
        before_photo: null,
        after_photo: null,
        repair_completed_at: new Date().toISOString().slice(0, 16)
    });
    
    // Camera state
    const [beforeCameraActive, setBeforeCameraActive] = useState(false);
    const [afterCameraActive, setAfterCameraActive] = useState(false);
    const [beforeCameraLoading, setBeforeCameraLoading] = useState(false);
    const [afterCameraLoading, setAfterCameraLoading] = useState(false);

    useEffect(() => {
        fetchApprovalData();
        getCurrentLocation();
        
        return () => {
            if (beforeVideoRef.current && beforeVideoRef.current.srcObject) {
                beforeVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (afterVideoRef.current && afterVideoRef.current.srcObject) {
                afterVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [approvalId]);

    const fetchApprovalData = async () => {
        try {
            const response = await axios.get(`/api/repair-approvals/${approvalId}`);
            setApproval(response.data.data);
        } catch (error) {
            showError('Data persetujuan tidak ditemukan');
            navigate({ to: '/my-repairs' });
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ lat: latitude, lng: longitude });
            },
            (error) => {
                console.error('Error getting location:', error);
            }
        );
    };

    const startBeforeCamera = async () => {
        try {
            setBeforeCameraLoading(true);
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            setBeforeCameraActive(true);
            setBeforeCameraLoading(false);
            
            if (beforeVideoRef.current) {
                beforeVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            setBeforeCameraLoading(false);
            showError('Tidak dapat mengakses kamera untuk foto sebelum perbaikan');
        }
    };

    const captureBeforePhoto = () => {
        if (beforeVideoRef.current && beforeCanvasRef.current) {
            const context = beforeCanvasRef.current.getContext('2d');
            beforeCanvasRef.current.width = beforeVideoRef.current.videoWidth;
            beforeCanvasRef.current.height = beforeVideoRef.current.videoHeight;
            context.drawImage(beforeVideoRef.current, 0, 0);
            
            beforeCanvasRef.current.toBlob((blob) => {
                setFormData({ ...formData, before_photo: blob });
                setBeforeCameraActive(false);
                if (beforeVideoRef.current && beforeVideoRef.current.srcObject) {
                    beforeVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const startAfterCamera = async () => {
        try {
            setAfterCameraLoading(true);
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            setAfterCameraActive(true);
            setAfterCameraLoading(false);
            
            if (afterVideoRef.current) {
                afterVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            setAfterCameraLoading(false);
            showError('Tidak dapat mengakses kamera untuk foto setelah perbaikan');
        }
    };

    const captureAfterPhoto = () => {
        if (afterVideoRef.current && afterCanvasRef.current) {
            const context = afterCanvasRef.current.getContext('2d');
            afterCanvasRef.current.width = afterVideoRef.current.videoWidth;
            afterCanvasRef.current.height = afterVideoRef.current.videoHeight;
            context.drawImage(afterVideoRef.current, 0, 0);
            
            afterCanvasRef.current.toBlob((blob) => {
                setFormData({ ...formData, after_photo: blob });
                setAfterCameraActive(false);
                if (afterVideoRef.current && afterVideoRef.current.srcObject) {
                    afterVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.repair_description.trim()) {
            showError('Deskripsi perbaikan wajib diisi');
            return;
        }

        if (!formData.before_photo) {
            showError('Foto sebelum perbaikan wajib diambil');
            return;
        }

        if (!formData.after_photo) {
            showError('Foto setelah perbaikan wajib diambil');
            return;
        }

        setSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('repair_approval_id', approvalId);
            submitData.append('repair_description', formData.repair_description);
            submitData.append('before_photo', formData.before_photo);
            submitData.append('after_photo', formData.after_photo);
            submitData.append('repair_completed_at', formData.repair_completed_at);
            
            if (currentLocation) {
                submitData.append('repair_lat', currentLocation.lat);
                submitData.append('repair_lng', currentLocation.lng);
            }

            await axios.post('/api/repair-reports', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showSuccess('Laporan perbaikan berhasil dikirim!');
            setTimeout(() => {
                navigate({ to: '/my-repairs' });
            }, 2000);
        } catch (error) {
            showError(error.response?.data?.message || 'Gagal mengirim laporan perbaikan');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!approval) {
        return (
            <div className="text-center py-12">
                <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Data Tidak Ditemukan</h3>
                                            <p className="mt-1 text-sm text-gray-500">Persetujuan perbaikan tidak ditemukan.</p>
            </div>
        );
    }

    if (approval.status !== 'approved') {
        return (
            <div className="text-center py-12">
                <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Perbaikan Belum Disetujui</h3>
                <p className="mt-1 text-sm text-gray-500">Perbaikan harus disetujui admin terlebih dahulu.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <FireIcon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Laporan Perbaikan APAR</h1>
                            <div className="flex items-center space-x-3">
                                <p className="text-lg font-semibold text-gray-700">
                                    APAR {approval.inspection?.apar?.serial_number}
                                </p>
                                <span className="text-gray-400">•</span>
                                <p className="text-gray-600">{approval.inspection?.apar?.location_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Approval Info */}
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-800">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="font-medium">Perbaikan Disetujui</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            Silakan lakukan perbaikan dan kirim laporan dengan foto before/after
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-6 space-y-8 border border-gray-100">
                    {/* Before Photo */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📸 Foto Sebelum Perbaikan <span className="text-red-500">*</span>
                        </label>
                        
                        {!formData.before_photo && !beforeCameraActive && !beforeCameraLoading && (
                            <button
                                type="button"
                                onClick={startBeforeCamera}
                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all duration-200 group"
                            >
                                <div className="text-center">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                                        <CameraIcon className="h-8 w-8 text-red-600" />
                                    </div>
                                    <p className="mt-3 text-lg font-medium text-gray-700">Ambil Foto Sebelum Perbaikan</p>
                                    <p className="mt-1 text-sm text-gray-500">Foto kondisi APAR sebelum diperbaiki</p>
                                </div>
                            </button>
                        )}

                        {beforeCameraLoading && (
                            <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                                    <p className="text-lg font-medium text-gray-700">Memulai Kamera...</p>
                                </div>
                            </div>
                        )}

                        {beforeCameraActive && (
                            <div className="space-y-4">
                                <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                                    <video
                                        ref={beforeVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-64 object-cover rounded-xl"
                                    />
                                    <div className="absolute inset-0 border-4 border-red-500 border-dashed rounded-xl pointer-events-none"></div>
                                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        Sebelum Perbaikan
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={captureBeforePhoto}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
                                >
                                    Ambil Foto
                                </button>
                            </div>
                        )}

                        {formData.before_photo && (
                            <div className="relative group">
                                <img
                                    src={URL.createObjectURL(formData.before_photo)}
                                    alt="Before Repair"
                                    className="w-full rounded-xl shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl"></div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, before_photo: null })}
                                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200 shadow-lg"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    ✅ Sebelum Perbaikan
                                </div>
                            </div>
                        )}
                    </div>

                    {/* After Photo */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📸 Foto Setelah Perbaikan <span className="text-red-500">*</span>
                        </label>
                        
                        {!formData.after_photo && !afterCameraActive && !afterCameraLoading && (
                            <button
                                type="button"
                                onClick={startAfterCamera}
                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-all duration-200 group"
                            >
                                <div className="text-center">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                                        <CameraIcon className="h-8 w-8 text-green-600" />
                                    </div>
                                    <p className="mt-3 text-lg font-medium text-gray-700">Ambil Foto Setelah Perbaikan</p>
                                    <p className="mt-1 text-sm text-gray-500">Foto kondisi APAR setelah diperbaiki</p>
                                </div>
                            </button>
                        )}

                        {afterCameraLoading && (
                            <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-lg font-medium text-gray-700">Memulai Kamera...</p>
                                </div>
                            </div>
                        )}

                        {afterCameraActive && (
                            <div className="space-y-4">
                                <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                                    <video
                                        ref={afterVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-64 object-cover rounded-xl"
                                    />
                                    <div className="absolute inset-0 border-4 border-green-500 border-dashed rounded-xl pointer-events-none"></div>
                                    <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        Setelah Perbaikan
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={captureAfterPhoto}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg"
                                >
                                    Ambil Foto
                                </button>
                            </div>
                        )}

                        {formData.after_photo && (
                            <div className="relative group">
                                <img
                                    src={URL.createObjectURL(formData.after_photo)}
                                    alt="After Repair"
                                    className="w-full rounded-xl shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl"></div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, after_photo: null })}
                                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200 shadow-lg"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    ✅ Setelah Perbaikan
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Repair Description */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📝 Deskripsi Perbaikan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.repair_description}
                            onChange={(e) => setFormData({ ...formData, repair_description: e.target.value })}
                            rows={4}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg resize-none"
                            placeholder="Jelaskan detail perbaikan yang telah dilakukan..."
                            required
                        />
                    </div>

                    {/* Completion Date */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📅 Tanggal Selesai Perbaikan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.repair_completed_at}
                            onChange={(e) => setFormData({ ...formData, repair_completed_at: e.target.value })}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={submitting || !formData.before_photo || !formData.after_photo || !formData.repair_description.trim()}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
                        >
                            {submitting ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Mengirim...</span>
                                </div>
                            ) : (
                                'Kirim Laporan Perbaikan'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate({ to: '/my-repairs' })}
                            className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg"
                        >
                            Batal
                        </button>
                    </div>
                </form>

                {/* Hidden canvases */}
                <canvas ref={beforeCanvasRef} className="hidden" />
                <canvas ref={afterCanvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default RepairReportForm;


