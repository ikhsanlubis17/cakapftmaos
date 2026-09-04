import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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
    const { approvalId } = useParams({ strict: false });
    const navigate = useNavigate();
    const beforeVideoRef = useRef(null);
    const beforeCanvasRef = useRef(null);
    const afterVideoRef = useRef(null);
    const afterCanvasRef = useRef(null);

    // Refs for per-damage camera
    const damageVideoRef = useRef(null);
    const damageCanvasRef = useRef(null);

    const [approval, setApproval] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const { showSuccess, showError } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        repair_description: '',
        before_photo: null,
        after_photo: null,
        repair_completed_at: new Date().toISOString().slice(0, 16),
    });

    // Per-damage photos state: { [damageId]: Blob }
    const [damageRepairPhotos, setDamageRepairPhotos] = useState({});

    // Camera state
    const [beforeCameraActive, setBeforeCameraActive] = useState(false);
    const [afterCameraActive, setAfterCameraActive] = useState(false);
    const [beforeCameraLoading, setBeforeCameraLoading] = useState(false);
    const [afterCameraLoading, setAfterCameraLoading] = useState(false);

    // Specific damage camera state
    const [activeDamageId, setActiveDamageId] = useState(null); // ID of damage being photographed
    const [damageCameraLoading, setDamageCameraLoading] = useState(false);

    const { apiClient } = useAuth();

    const { data: approvalData, isLoading: approvalLoading } = useQuery({
        queryKey: ['repairApproval', approvalId],
        queryFn: async () => {
            const res = await apiClient.get(`/api/repair-approvals/${approvalId}`);
            return res.data.data;
        },
        enabled: !!approvalId,
        throwOnError: false,
    });

    useEffect(() => {
        getCurrentLocation();

        return () => {
            stopAllCameras();
        };
    }, []);

    const stopAllCameras = () => {
        if (beforeVideoRef.current?.srcObject) {
            beforeVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (afterVideoRef.current?.srcObject) {
            afterVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (damageVideoRef.current?.srcObject) {
            damageVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        setLoading(approvalLoading);
    }, [approvalLoading]);

    useEffect(() => {
        if (approvalData) setApproval(approvalData);
        if (!approvalData && !approvalLoading && !loading) {
            navigate({ to: '/my-repairs' });
        }
    }, [approvalData, approvalLoading, navigate, loading]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ lat: latitude, lng: longitude });
            },
            (error) => console.error('Error getting location:', error)
        );
    };

    // --- Camera Handlers for General Photos --- 
    const startBeforeCamera = async () => {
        try {
            setBeforeCameraLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setBeforeCameraActive(true);
            setBeforeCameraLoading(false);
            if (beforeVideoRef.current) beforeVideoRef.current.srcObject = stream;
        } catch (error) {
            setBeforeCameraLoading(false);
            showError('Tidak dapat mengakses kamera');
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
                beforeVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }, 'image/jpeg', 0.8);
        }
    };

    const startAfterCamera = async () => {
        try {
            setAfterCameraLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setAfterCameraActive(true);
            setAfterCameraLoading(false);
            if (afterVideoRef.current) afterVideoRef.current.srcObject = stream;
        } catch (error) {
            setAfterCameraLoading(false);
            showError('Tidak dapat mengakses kamera');
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
                afterVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }, 'image/jpeg', 0.8);
        }
    };

    // --- Camera Handlers for Specific Damage Repair ---
    const startDamageCamera = async (damageId) => {
        try {
            setDamageCameraLoading(true);
            setActiveDamageId(damageId);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setDamageCameraLoading(false);

            // Give a small delay for the modal/video element to render
            setTimeout(() => {
                if (damageVideoRef.current) {
                    damageVideoRef.current.srcObject = stream;
                    damageVideoRef.current.play();
                }
            }, 100);
        } catch (error) {
            setDamageCameraLoading(false);
            setActiveDamageId(null);
            showError('Tidak dapat mengakses kamera');
        }
    };

    const captureDamagePhoto = () => {
        if (damageVideoRef.current && damageCanvasRef.current && activeDamageId) {
            const context = damageCanvasRef.current.getContext('2d');
            damageCanvasRef.current.width = damageVideoRef.current.videoWidth;
            damageCanvasRef.current.height = damageVideoRef.current.videoHeight;
            context.drawImage(damageVideoRef.current, 0, 0);

            damageCanvasRef.current.toBlob((blob) => {
                setDamageRepairPhotos(prev => ({ ...prev, [activeDamageId]: blob }));
                stopDamageCamera();
            }, 'image/jpeg', 0.8);
        }
    };

    const stopDamageCamera = () => {
        if (damageVideoRef.current?.srcObject) {
            damageVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setActiveDamageId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.repair_description.trim()) {
            showError('Deskripsi perbaikan wajib diisi');
            return;
        }

        if (!formData.before_photo) {
            showError('Foto umum sebelum perbaikan wajib diambil');
            return;
        }

        if (!formData.after_photo) {
            showError('Foto umum setelah perbaikan wajib diambil');
            return;
        }

        // Validate that all damages have a repair photo if any exist
        const damages = approval?.inspection?.inspection_damages || approval?.inspection?.inspectionDamages || [];
        if (damages.length > 0) {
            const missingPhotos = damages.filter(d => !damageRepairPhotos[d.id]);
            if (missingPhotos.length > 0) {
                showError(`Harap lengkapi foto perbaikan untuk semua ${damages.length} item kerusakan.`);
                return;
            }
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

            // Append specific damage photos
            Object.entries(damageRepairPhotos).forEach(([id, photoBlob]) => {
                submitData.append(`damage_photos[${id}]`, photoBlob);
            });

            await apiClient.post('/api/repair-reports', submitData, {
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
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-[#11468F]"></div>
            </div>
        );
    }

    if (!approval) return null;

    const damages = approval.inspection?.inspection_damages || approval.inspection?.inspectionDamages || [];

    return (
        <div className="min-h-screen bg-slate-50 py-6 pb-20">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-[6px] p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center shadow-sm">
                            <FireIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-slate-900 mb-1">Laporan Perbaikan APAR</h1>
                            <div className="flex items-center space-x-2 text-sm">
                                <p className="font-bold text-slate-800 font-mono">{approval.inspection?.apar?.serial_number}</p>
                                <span className="text-slate-400">•</span>
                                <p className="text-slate-600">{approval.inspection?.apar?.location_name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-[6px] p-6 space-y-6 border border-slate-200 shadow-sm">

                    {/* --- DAMAGE LIST SECTION --- */}
                    {damages.length > 0 && (
                        <div className="border border-slate-200 bg-slate-50/50 rounded-[6px] p-5">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span>🛠️</span> Daftar Kerusakan Yang Perlu Diperbaiki
                            </h3>
                            <div className="space-y-4">
                                {damages.map(damage => (
                                    <div key={damage.id} className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-sm relative">
                                        <div className="mb-3 flex justify-between items-start">
                                            <div>
                                                <span className="inline-block bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider mb-1.5">
                                                    {damage.damage_category?.name || 'Kerusakan'}
                                                </span>
                                                <p className="text-xs text-slate-600 italic">"{damage.notes || 'Tidak ada catatan'}"</p>
                                            </div>
                                            <span className="text-[11px] font-bold text-rose-700 uppercase px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-[3px]">
                                                Severity: {damage.severity}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Before Photo (Existing) */}
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Sebelum (Saat Inspeksi)</p>
                                                <div className="aspect-video rounded-[6px] overflow-hidden bg-slate-100 border border-slate-200">
                                                    <img src={damage.damage_photo_url} alt="Before" className="w-full h-full object-cover" />
                                                </div>
                                            </div>

                                            {/* After Photo (To Capture) */}
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Sesudah (Bukti Perbaikan)</p>
                                                {damageRepairPhotos[damage.id] ? (
                                                    <div className="relative group aspect-video rounded-[6px] overflow-hidden bg-emerald-50 border border-emerald-200">
                                                        <img src={URL.createObjectURL(damageRepairPhotos[damage.id])} alt="After" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setDamageRepairPhotos(prev => ({ ...prev, [damage.id]: null }))} className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-[4px] shadow opacity-90 hover:opacity-100">
                                                            <XMarkIcon className="h-4 w-4" />
                                                        </button>
                                                        <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-[3px] font-bold uppercase tracking-wider shadow">Selesai</div>
                                                    </div>
                                                ) : (
                                                    activeDamageId === damage.id ? (
                                                        <div className="relative aspect-video rounded-[6px] overflow-hidden bg-black">
                                                            <video ref={damageVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                                            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-3">
                                                                <button type="button" onClick={stopDamageCamera} className="bg-slate-700/80 text-white p-2 rounded-[4px]"><XMarkIcon className="h-5 w-5" /></button>
                                                                <button type="button" onClick={captureDamagePhoto} className="bg-[#11468F] text-white p-2 rounded-[4px] border border-transparent font-bold"><CameraIcon className="h-5 w-5" /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button type="button" onClick={() => startDamageCamera(damage.id)} className="w-full h-full aspect-video border-2 border-dashed border-slate-300 rounded-[6px] flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-500 hover:text-slate-800 transition-all">
                                                            <CameraIcon className="h-7 w-7 mb-1.5" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">Ambil Foto Perbaikan</span>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Before Photo General */}
                    <div>
                        <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                            📸 Foto Umum APAR Sebelum Perbaikan <span className="text-rose-500">*</span>
                        </label>
                        {!formData.before_photo && !beforeCameraActive && !beforeCameraLoading && (
                            <button type="button" onClick={startBeforeCamera} className="w-full h-36 border-2 border-dashed border-slate-300 rounded-[6px] flex items-center justify-center hover:border-slate-400 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-800 group">
                                <div className="text-center">
                                    <CameraIcon className="h-8 w-8 text-slate-400 group-hover:text-slate-700 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Ambil Foto</p>
                                </div>
                            </button>
                        )}
                        {beforeCameraActive && (
                            <div className="relative bg-black rounded-[6px] overflow-hidden aspect-video">
                                <video ref={beforeVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <button type="button" onClick={captureBeforePhoto} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2.5 bg-[#11468F] text-white rounded-[6px] border border-transparent font-bold shadow-md"><CameraIcon className="h-6 w-6" /></button>
                            </div>
                        )}
                        {formData.before_photo && (
                            <div className="relative aspect-video rounded-[6px] overflow-hidden border border-slate-200">
                                <img src={URL.createObjectURL(formData.before_photo)} alt="Before" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setFormData({ ...formData, before_photo: null })} className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-[4px] shadow"><XMarkIcon className="h-4 w-4" /></button>
                            </div>
                        )}
                    </div>

                    {/* After Photo General */}
                    <div>
                        <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                            📸 Foto Umum APAR Setelah Perbaikan <span className="text-rose-500">*</span>
                        </label>
                        {!formData.after_photo && !afterCameraActive && !afterCameraLoading && (
                            <button type="button" onClick={startAfterCamera} className="w-full h-36 border-2 border-dashed border-slate-300 rounded-[6px] flex items-center justify-center hover:border-slate-400 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-800 group">
                                <div className="text-center">
                                    <CameraIcon className="h-8 w-8 text-slate-400 group-hover:text-slate-700 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Ambil Foto</p>
                                </div>
                            </button>
                        )}
                        {afterCameraActive && (
                            <div className="relative bg-black rounded-[6px] overflow-hidden aspect-video">
                                <video ref={afterVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <button type="button" onClick={captureAfterPhoto} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2.5 bg-[#11468F] text-white rounded-[6px] border border-transparent font-bold shadow-md"><CameraIcon className="h-6 w-6" /></button>
                            </div>
                        )}
                        {formData.after_photo && (
                            <div className="relative aspect-video rounded-[6px] overflow-hidden border border-slate-200">
                                <img src={URL.createObjectURL(formData.after_photo)} alt="After" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setFormData({ ...formData, after_photo: null })} className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-[4px] shadow"><XMarkIcon className="h-4 w-4" /></button>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                            📝 Deskripsi Perbaikan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={formData.repair_description}
                            onChange={(e) => setFormData({ ...formData, repair_description: e.target.value })}
                            rows={4}
                            className="w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F] resize-none"
                            placeholder="Jelaskan detail perbaikan..."
                            required
                        />
                    </div>

                    {/* Completion Date */}
                    <div>
                        <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                            📅 Tanggal Selesai <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.repair_completed_at}
                            onChange={(e) => setFormData({ ...formData, repair_completed_at: e.target.value })}
                            className="w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F]"
                            required
                        />
                    </div>

                    {/* Info about supervisor review */}
                    <div className="bg-sky-50 border border-sky-200 rounded-[6px] p-4 text-xs text-sky-900 leading-relaxed">
                        <p>
                            <span className="font-bold">Catatan:</span> Setelah laporan disubmit, supervisor akan mereview hasil perbaikan.
                            Supervisor akan memutuskan apakah perbaikan sudah sesuai, perlu perbaikan ulang, atau APAR tidak dapat diperbaiki.
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent px-6 py-3 rounded-[6px] disabled:opacity-50 font-bold text-sm uppercase tracking-wider shadow-sm transition-all"
                        >
                            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate({ to: '/my-repairs' })}
                            className="px-6 py-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-[6px] transition-all"
                        >
                            Batal
                        </button>
                    </div>
                </form>

                <canvas ref={beforeCanvasRef} className="hidden" />
                <canvas ref={afterCanvasRef} className="hidden" />
                <canvas ref={damageCanvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default RepairReportForm;


