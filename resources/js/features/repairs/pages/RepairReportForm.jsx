import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    CameraIcon,
    CheckCircleIcon,
    XMarkIcon,
    MapPinIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    WrenchScrewdriverIcon,
    PhotoIcon,
    SparklesIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatStorageUrl } from '@/utils/imageUrl';
import { fetchCurrentCoordinates } from '@/utils/geolocation';
import { RepairCameraModal } from '../components/RepairCameraModal';
import { RepairDamageStep } from '../components/RepairDamageStep';

const QUICK_REPAIR_CHIPS = [
    'Pembersihan nozzle dan saluran corong lancar',
    'Penggantian pin pengaman & seal segel baru',
    'Pemeriksaan tekanan tabung (jarum indikator normal di area hijau)',
    'Pembersihan fisik tabung dan penempatan kembali di bracket',
    'Pengencangan selang (hose) dan konektor tabung',
    'Penghilangan karat ringan dan pelumasan tuas handle',
];

const RepairReportForm = () => {
    const { approvalId } = useParams({ strict: false });
    const navigate = useNavigate();
    const { apiClient } = useAuth();
    const { showSuccess, showError } = useToast();

    // Wizard Step State (1: Identitas & Foto Awal, 2: Bukti Perbaikan Kerusakan, 3: Finalisasi & Kirim)
    const [currentStep, setCurrentStep] = useState(1);

    // Camera Stream & Elements Refs
    const streamRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Camera Modal / Viewfinder State
    // target: { type: 'before' | 'after' | 'damage', damageId?: number, title: string }
    const [cameraTarget, setCameraTarget] = useState(null);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // 'environment' | 'user'

    // Selected photo modal preview state
    const [previewModalUrl, setPreviewModalUrl] = useState(null);

    // Form Data State
    const [formData, setFormData] = useState({
        repair_description: '',
        before_photo: null,
        after_photo: null,
        repair_completed_at: new Date().toISOString().slice(0, 16),
    });

    // Image preview URLs for local blobs
    const [beforePhotoPreview, setBeforePhotoPreview] = useState(null);
    const [afterPhotoPreview, setAfterPhotoPreview] = useState(null);
    const [isCopyingInspectionPhoto, setIsCopyingInspectionPhoto] = useState(false);
    const [beforePhotoSource, setBeforePhotoSource] = useState(null); // 'inspection' | 'camera'

    // Damage photos: { [damageId]: { blob: Blob, previewUrl: string } }
    const [damageRepairPhotos, setDamageRepairPhotos] = useState({});

    // GPS State
    const [currentLocation, setCurrentLocation] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    // Form Submitting State
    const [submitting, setSubmitting] = useState(false);

    // Fetch Approval Data
    const { data: approval, isLoading: approvalLoading } = useQuery({
        queryKey: ['repairApproval', approvalId],
        queryFn: async () => {
            const res = await apiClient.get(`/api/repair-approvals/${approvalId}`);
            return res.data.data;
        },
        enabled: !!approvalId,
        throwOnError: false,
    });

    // Cleanup camera streams on unmount
    useEffect(() => {
        getCurrentLocation();

        return () => {
            stopActiveStream();
        };
    }, []);

    // Redirect if approval not found
    useEffect(() => {
        if (!approvalLoading && !approval && approvalId) {
            showError('Data persetujuan perbaikan tidak ditemukan');
            navigate({ to: '/my-repairs' });
        }
    }, [approval, approvalLoading, approvalId, navigate]);

    // Safe stream attach helper ensuring autoplay & muted compatibility
    const attachStreamToVideo = (videoEl, stream) => {
        if (!videoEl || !stream) return;
        try {
            if (videoEl.srcObject !== stream) {
                videoEl.srcObject = stream;
            }
            videoEl.muted = true;
            videoEl.playsInline = true;

            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('Video auto-play caught:', err);
                });
            }

            videoEl.onloadedmetadata = () => {
                videoEl.play().catch((err) => console.warn('Play after metadata error:', err));
            };
        } catch (err) {
            console.error('attachStreamToVideo error:', err);
        }
    };

    // Attach stream to video whenever cameraTarget or cameraLoading changes
    useEffect(() => {
        if (cameraTarget && videoRef.current && streamRef.current) {
            attachStreamToVideo(videoRef.current, streamRef.current);
        }
    }, [cameraTarget, cameraLoading]);

    const getCurrentLocation = async () => {
        setGpsLoading(true);
        try {
            const coords = await fetchCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
            setCurrentLocation({
                lat: coords.latitude,
                lng: coords.longitude,
                accuracy: Math.round(coords.accuracy || 0),
            });
        } catch (error) {
            console.warn('GPS location detection warning:', error.message);
        } finally {
            setGpsLoading(false);
        }
    };

    // --- Safe Camera Lifecycle Functions ---
    const stopActiveStream = () => {
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach((track) => track.stop());
            } catch (err) {
                console.error('Error stopping tracks:', err);
            }
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const openCamera = async (target) => {
        stopActiveStream();
        setCameraLoading(true);
        setCameraTarget(target);

        try {
            const constraints = {
                video: {
                    facingMode: { ideal: cameraFacingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            };

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (primaryErr) {
                console.warn('Primary camera constraints failed, attempting fallback:', primaryErr);
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            streamRef.current = stream;
            setCameraLoading(false);

            if (videoRef.current) {
                attachStreamToVideo(videoRef.current, stream);
            }
        } catch (error) {
            console.error('Camera access error:', error);
            setCameraLoading(false);
            stopActiveStream();
            setCameraTarget(null);
            showError('Tidak dapat mengakses kamera perangkat. Pastikan izin kamera telah diberikan di peramban.');
        }
    };

    const toggleCameraFacingMode = async () => {
        const newMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
        setCameraFacingMode(newMode);
        if (cameraTarget) {
            stopActiveStream();
            setCameraLoading(true);
            try {
                let stream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: newMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
                        audio: false,
                    });
                } catch (flipErr) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                }
                streamRef.current = stream;
                setCameraLoading(false);
                if (videoRef.current) {
                    attachStreamToVideo(videoRef.current, stream);
                }
            } catch (err) {
                console.error('Flip camera error:', err);
                setCameraLoading(false);
                showError('Gagal membalik kamera pada perangkat ini.');
            }
        }
    };

    const closeCamera = () => {
        stopActiveStream();
        setCameraTarget(null);
        setCameraLoading(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !cameraTarget) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            showError('Kamera masih memproses sinyal gambar. Tunggu 1 detik lalu coba kembali.');
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    showError('Gagal mengambil gambar, silakan coba lagi.');
                    return;
                }

                const previewUrl = URL.createObjectURL(blob);

                if (cameraTarget.type === 'before') {
                    setFormData((prev) => ({ ...prev, before_photo: blob }));
                    setBeforePhotoPreview(previewUrl);
                    setBeforePhotoSource('camera');
                    showSuccess('Foto sebelum perbaikan berhasil diambil');
                } else if (cameraTarget.type === 'after') {
                    setFormData((prev) => ({ ...prev, after_photo: blob }));
                    setAfterPhotoPreview(previewUrl);
                    showSuccess('Foto selesai perbaikan berhasil diambil');
                } else if (cameraTarget.type === 'damage') {
                    setDamageRepairPhotos((prev) => ({
                        ...prev,
                        [cameraTarget.damageId]: { blob, previewUrl },
                    }));
                    showSuccess(`Foto bukti perbaikan berhasil disimpan`);
                }

                // Stop hardware stream safely
                stopActiveStream();
                setCameraTarget(null);
            },
            'image/jpeg',
            0.85
        );
    };

    // --- 1-Click Copy Inspection Photo for "Before Photo" ---
    const copyInspectionBeforePhoto = async () => {
        const inspectionPhotoUrl = approval?.inspection?.photo_url;
        if (!inspectionPhotoUrl) {
            showError('Foto inspeksi awal tidak tersedia.');
            return;
        }

        try {
            setIsCopyingInspectionPhoto(true);
            const normalizedUrl = formatStorageUrl(inspectionPhotoUrl);
            const response = await fetch(normalizedUrl);
            if (!response.ok) throw new Error('Gagal mengunduh file foto inspeksi');

            const blob = await response.blob();
            const file = new File([blob], 'before_photo_from_inspection.jpg', {
                type: blob.type || 'image/jpeg',
            });

            setFormData((prev) => ({ ...prev, before_photo: file }));
            setBeforePhotoPreview(URL.createObjectURL(file));
            setBeforePhotoSource('inspection');
            showSuccess('Foto inspeksi berhasil dijadikan foto awal perbaikan');
        } catch (error) {
            console.error('Error copying inspection photo:', error);
            showError('Gagal memuat foto inspeksi. Silakan gunakan kamera untuk mengambil foto baru.');
        } finally {
            setIsCopyingInspectionPhoto(false);
        }
    };

    // Remove photo handlers
    const removeBeforePhoto = () => {
        setFormData((prev) => ({ ...prev, before_photo: null }));
        setBeforePhotoPreview(null);
        setBeforePhotoSource(null);
    };

    const removeAfterPhoto = () => {
        setFormData((prev) => ({ ...prev, after_photo: null }));
        setAfterPhotoPreview(null);
    };

    const removeDamagePhoto = (damageId) => {
        setDamageRepairPhotos((prev) => {
            const next = { ...prev };
            delete next[damageId];
            return next;
        });
    };

    // Quick chip handler for description
    const addQuickChip = (text) => {
        setFormData((prev) => {
            const current = prev.repair_description.trim();
            if (!current) return { ...prev, repair_description: text };
            if (current.includes(text)) return prev;
            return { ...prev, repair_description: `${current}, ${text}` };
        });
    };

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.before_photo) {
            showError('Foto kondisi APAR sebelum perbaikan wajib disertakan (Langkah 1)');
            setCurrentStep(1);
            return;
        }

        const damages = approval?.inspection?.inspection_damages || approval?.inspection?.inspectionDamages || [];
        if (damages.length > 0) {
            const missingDamages = damages.filter((d) => !damageRepairPhotos[d.id]?.blob);
            if (missingDamages.length > 0) {
                showError(`Lengkapi foto bukti perbaikan untuk semua ${damages.length} item kerusakan (Langkah 2)`);
                setCurrentStep(2);
                return;
            }
        }

        if (!formData.after_photo) {
            showError('Foto kondisi APAR setelah perbaikan wajib diambil (Langkah 3)');
            setCurrentStep(3);
            return;
        }

        if (!formData.repair_description.trim()) {
            showError('Deskripsi tindakan perbaikan wajib diisi');
            setCurrentStep(3);
            return;
        }

        setSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('repair_approval_id', approvalId);
            submitData.append('repair_description', formData.repair_description.trim());
            submitData.append('before_photo', formData.before_photo, 'before_photo.jpg');
            submitData.append('after_photo', formData.after_photo, 'after_photo.jpg');
            submitData.append('repair_completed_at', formData.repair_completed_at);

            if (currentLocation) {
                submitData.append('repair_lat', currentLocation.lat);
                submitData.append('repair_lng', currentLocation.lng);
                if (currentLocation.accuracy) {
                    submitData.append('gps_accuracy', currentLocation.accuracy);
                }
            }

            // Append each damage photo with explicit filename
            Object.entries(damageRepairPhotos).forEach(([id, photoItem]) => {
                if (photoItem?.blob) {
                    submitData.append(`damage_photos[${id}]`, photoItem.blob, `damage_${id}.jpg`);
                }
            });

            await apiClient.post('/api/repair-reports', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showSuccess('Laporan perbaikan berhasil dikirim! Menunggu review supervisor.');
            setTimeout(() => {
                navigate({ to: '/my-repairs' });
            }, 1500);
        } catch (error) {
            console.error('Submit error:', error);
            showError(error.response?.data?.message || 'Gagal mengirim laporan perbaikan');
        } finally {
            setSubmitting(false);
        }
    };

    if (approvalLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#11468F]"></div>
                <p className="text-sm font-semibold text-slate-600">Memuat data perbaikan APAR...</p>
            </div>
        );
    }

    if (!approval) return null;

    const damages = approval.inspection?.inspection_damages || approval.inspection?.inspectionDamages || [];
    const completedDamagesCount = Object.keys(damageRepairPhotos).length;
    const isAllDamagesCompleted = damages.length === 0 || completedDamagesCount === damages.length;

    return (
        <div className="min-h-screen bg-slate-50 py-4 sm:py-8 pb-28">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

                {/* --- HEADER BANNER --- */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3.5">
                            <div className="h-12 w-12 rounded-lg bg-[#041562] text-white flex items-center justify-center shadow-sm flex-shrink-0">
                                <WrenchScrewdriverIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#11468F] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-1">
                                    Formulir Tindakan Teknisi
                                </span>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                    Laporan Perbaikan APAR
                                </h1>
                            </div>
                        </div>

                        {/* APAR Tag & Location */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 flex items-center justify-between sm:justify-end gap-3 text-sm">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nomor Seri</p>
                                <p className="font-mono font-bold text-slate-900 tracking-wider">
                                    {approval.inspection?.apar?.serial_number || 'N/A'}
                                </p>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lokasi</p>
                                <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                                    {approval.inspection?.apar?.location_name || 'Terminal'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Supervisor Notes if any */}
                    {approval.supervisor_notes && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                            <InformationCircleIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Arahan Supervisor: </span>
                                <span className="italic">"{approval.supervisor_notes}"</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- STEPPER PROGRESS BAR (3-Step Guided Wizard) --- */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 sm:p-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {/* Step 1 */}
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className={`flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 p-2 rounded-md transition-all text-left ${
                                currentStep === 1
                                    ? 'bg-blue-50/80 border border-[#11468F]/30 text-[#11468F]'
                                    : formData.before_photo
                                    ? 'text-slate-700 hover:bg-slate-50'
                                    : 'text-slate-400'
                            }`}
                        >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                                formData.before_photo
                                    ? 'bg-emerald-600 text-white'
                                    : currentStep === 1
                                    ? 'bg-[#11468F] text-white'
                                    : 'bg-slate-200 text-slate-600'
                            }`}>
                                {formData.before_photo ? <CheckIcon className="h-4 w-4" /> : '1'}
                            </span>
                            <div className="text-center sm:text-left overflow-hidden">
                                <p className="text-xs font-bold leading-tight">1. Kondisi Awal</p>
                                <p className="text-[10px] text-slate-500 hidden sm:block truncate">
                                    {formData.before_photo ? 'Foto siap' : 'Foto tabung awal'}
                                </p>
                            </div>
                        </button>

                        {/* Step 2 */}
                        <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className={`flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 p-2 rounded-md transition-all text-left ${
                                currentStep === 2
                                    ? 'bg-blue-50/80 border border-[#11468F]/30 text-[#11468F]'
                                    : isAllDamagesCompleted
                                    ? 'text-slate-700 hover:bg-slate-50'
                                    : 'text-slate-400'
                            }`}
                        >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                                isAllDamagesCompleted && damages.length > 0
                                    ? 'bg-emerald-600 text-white'
                                    : currentStep === 2
                                    ? 'bg-[#11468F] text-white'
                                    : 'bg-slate-200 text-slate-600'
                            }`}>
                                {isAllDamagesCompleted && damages.length > 0 ? (
                                    <CheckIcon className="h-4 w-4" />
                                ) : (
                                    '2'
                                )}
                            </span>
                            <div className="text-center sm:text-left overflow-hidden">
                                <p className="text-xs font-bold leading-tight">
                                    2. Perbaikan ({damages.length})
                                </p>
                                <p className="text-[10px] text-slate-500 hidden sm:block truncate">
                                    {completedDamagesCount}/{damages.length} bukti selesai
                                </p>
                            </div>
                        </button>

                        {/* Step 3 */}
                        <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className={`flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2.5 p-2 rounded-md transition-all text-left ${
                                currentStep === 3
                                    ? 'bg-blue-50/80 border border-[#11468F]/30 text-[#11468F]'
                                    : formData.after_photo && formData.repair_description
                                    ? 'text-slate-700 hover:bg-slate-50'
                                    : 'text-slate-400'
                            }`}
                        >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                                formData.after_photo && formData.repair_description
                                    ? 'bg-emerald-600 text-white'
                                    : currentStep === 3
                                    ? 'bg-[#11468F] text-white'
                                    : 'bg-slate-200 text-slate-600'
                            }`}>
                                3
                            </span>
                            <div className="text-center sm:text-left overflow-hidden">
                                <p className="text-xs font-bold leading-tight">3. Selesai</p>
                                <p className="text-[10px] text-slate-500 hidden sm:block truncate">
                                    Foto akhir & submit
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* --- MAIN FORM CONTAINER --- */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ============================================================== */}
                    {/* STEP 1: IDENTITAS & FOTO TABUNG SEBELUM PERBAIKAN              */}
                    {/* ============================================================== */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* APAR Details Bento Card */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                                    <InformationCircleIcon className="h-4 w-4 text-[#11468F]" />
                                    Data Fisik APAR Yang Diperbaiki
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                                        <span className="text-slate-500 block mb-0.5">Tipe Tabung</span>
                                        <span className="font-bold text-slate-800 uppercase">
                                            {approval.inspection?.apar?.apar_type?.name || 'DCP'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                                        <span className="text-slate-500 block mb-0.5">Kapasitas</span>
                                        <span className="font-bold text-slate-800">
                                            {approval.inspection?.apar?.capacity || '-'} Kg
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                                        <span className="text-slate-500 block mb-0.5">Inspektor Awal</span>
                                        <span className="font-bold text-slate-800 truncate block">
                                            {approval.inspection?.user?.name || 'Teknisi'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                                        <span className="text-slate-500 block mb-0.5">Jumlah Kerusakan</span>
                                        <span className="font-bold text-rose-600 font-mono">
                                            {damages.length} temuan
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Foto Tabung Sebelum Perbaikan Card */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div>
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <span>📸</span> Foto Umum APAR Sebelum Perbaikan
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Menunjukkan kondisi fisik tabung APAR secara menyeluruh sebelum tindakan perbaikan dimulai.
                                        </p>
                                    </div>

                                    {beforePhotoPreview && (
                                        <span className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded">
                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                            {beforePhotoSource === 'inspection' ? 'Dari Inspeksi' : 'Foto Baru'}
                                        </span>
                                    )}
                                </div>

                                {/* Display Selected / Captured Preview */}
                                {beforePhotoPreview ? (
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group">
                                        <div className="aspect-video w-full max-h-[360px] flex items-center justify-center bg-black">
                                            <img
                                                src={beforePhotoPreview}
                                                alt="Foto Sebelum Perbaikan"
                                                className="w-full h-full object-contain cursor-pointer"
                                                onClick={() => setPreviewModalUrl(beforePhotoPreview)}
                                            />
                                        </div>

                                        {/* Action Overlay */}
                                        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
                                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                                <PhotoIcon className="h-4 w-4 text-slate-400" />
                                                <span>Foto fisik tabung sebelum perbaikan siap dilampirkan.</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openCamera({ type: 'before', title: 'Foto Umum APAR Sebelum Perbaikan' })}
                                                    className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-all flex items-center gap-1"
                                                >
                                                    <CameraIcon className="h-3.5 w-3.5" />
                                                    Foto Ulang
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={removeBeforePhoto}
                                                    className="h-9 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-all flex items-center gap-1"
                                                >
                                                    <XMarkIcon className="h-3.5 w-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* No photo selected: Offer 2 smart field options */
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Option A: Use Inspection Photo if available */}
                                        {approval.inspection?.photo_url ? (
                                            <div className="border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white rounded-lg p-4 flex flex-col justify-between hover:border-[#11468F]/40 transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#11468F] uppercase tracking-wider mb-2">
                                                        <SparklesIcon className="h-4 w-4 text-[#11468F]" />
                                                        Paling Cepat & Efisien (1-Tap)
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                                                        Gunakan Foto Tabung dari Inspeksi Awal
                                                    </h4>
                                                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                                        Salin foto fisik yang sudah diambil oleh inspektor saat temuan kerusakan tercatat. Menghemat waktu Anda di lapangan.
                                                    </p>

                                                    {/* Inspection Photo Thumbnail */}
                                                    <div className="aspect-video rounded border border-slate-200 overflow-hidden bg-slate-100 mb-3 relative group">
                                                        <img
                                                            src={formatStorageUrl(approval.inspection.photo_url)}
                                                            alt="Foto Inspeksi"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                                                            Arsip Inspeksi
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={isCopyingInspectionPhoto}
                                                    onClick={copyInspectionBeforePhoto}
                                                    className="h-11 w-full bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    {isCopyingInspectionPhoto ? (
                                                        <>
                                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Memproses Foto...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircleIcon className="h-4 w-4" />
                                                            Gunakan Foto Ini
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : null}

                                        {/* Option B: Take fresh photo via Camera */}
                                        <div className={`border-2 border-dashed border-slate-300 rounded-lg p-5 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-all ${
                                            !approval.inspection?.photo_url ? 'col-span-full py-10' : ''
                                        }`}>
                                            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
                                                <CameraIcon className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1">
                                                Ambil Foto Baru Langsung
                                            </h4>
                                            <p className="text-xs text-slate-500 max-w-xs mb-4">
                                                Gunakan kamera jika tabung APAR telah dipindahkan posisinya atau kondisinya berubah sebelum diperbaiki.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => openCamera({ type: 'before', title: 'Foto Umum APAR Sebelum Perbaikan' })}
                                                className="h-11 px-5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <CameraIcon className="h-4 w-4 text-[#11468F]" />
                                                Buka Kamera Sekarang
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 1 Navigation Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.before_photo) {
                                            showError('Silakan pilih atau ambil foto kondisi awal APAR terlebih dahulu');
                                            return;
                                        }
                                        setCurrentStep(2);
                                    }}
                                    className="h-12 px-6 bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-2"
                                >
                                    <span>Lanjut ke Bukti Kerusakan ({damages.length})</span>
                                    <ArrowRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* STEP 2: TINDAKAN PERBAIKAN KERUSAKAN (PER ITEM)                */}
                    {/* ============================================================== */}
                    {currentStep === 2 && (
                        <RepairDamageStep
                            damages={damages}
                            damageRepairPhotos={damageRepairPhotos}
                            isAllDamagesCompleted={isAllDamagesCompleted}
                            completedDamagesCount={completedDamagesCount}
                            setPreviewModalUrl={setPreviewModalUrl}
                            openCamera={openCamera}
                            removeDamagePhoto={removeDamagePhoto}
                            setCurrentStep={setCurrentStep}
                            showError={showError}
                        />
                    )}

                    {/* ============================================================== */}
                    {/* STEP 3: HASIL AKHIR, CATATAN TEKNISI & SUBMIT                  */}
                    {/* ============================================================== */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Card: Foto Umum APAR Setelah Perbaikan */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div>
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <span>📸</span> Foto Umum APAR Setelah Perbaikan
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Ambil foto utuh seluruh badan APAR yang telah selesai diperbaiki dan siap digunakan kembali di titik lokasinya.
                                        </p>
                                    </div>

                                    {afterPhotoPreview && (
                                        <span className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded">
                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                            Foto Siap
                                        </span>
                                    )}
                                </div>

                                {afterPhotoPreview ? (
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                                        <div className="aspect-video w-full max-h-[360px] flex items-center justify-center bg-black">
                                            <img
                                                src={afterPhotoPreview}
                                                alt="Foto Selesai Perbaikan"
                                                className="w-full h-full object-contain cursor-pointer"
                                                onClick={() => setPreviewModalUrl(afterPhotoPreview)}
                                            />
                                        </div>

                                        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
                                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                                <PhotoIcon className="h-4 w-4 text-emerald-600" />
                                                <span>Kondisi akhir APAR siap dioperasikan.</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openCamera({ type: 'after', title: 'Foto Umum APAR Setelah Perbaikan' })}
                                                    className="h-9 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-all flex items-center gap-1"
                                                >
                                                    <CameraIcon className="h-3.5 w-3.5" />
                                                    Foto Ulang
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={removeAfterPhoto}
                                                    className="h-9 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-all flex items-center gap-1"
                                                >
                                                    <XMarkIcon className="h-3.5 w-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 text-[#11468F] flex items-center justify-center mb-3">
                                            <CameraIcon className="h-6 w-6" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-1">
                                            Ambil Foto Kondisi Siap Operasional
                                        </h4>
                                        <p className="text-xs text-slate-500 max-w-sm mb-4">
                                            Pastikan seluruh tabung, selang, nozzle, dan segel pengaman terlihat jelas dalam pencahayaan yang cukup.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => openCamera({ type: 'after', title: 'Foto Umum APAR Setelah Perbaikan' })}
                                            className="h-11 px-5 bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <CameraIcon className="h-4 w-4" />
                                            Buka Kamera Foto Akhir
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Card: Deskripsi & Quick Action Chips */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                            <span>📝</span> Deskripsi Tindakan Perbaikan
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            Minimal 10 karakter
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Jelaskan suku cadang yang diganti, metode perbaikan, atau penyesuaian yang telah dilakukan.
                                    </p>

                                    {/* Quick Chips for Field Ergonomics */}
                                    <div className="mb-2">
                                        <p className="text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                            <SparklesIcon className="h-3.5 w-3.5 text-[#11468F]" />
                                            Quick Chips (Tap untuk Menambahkan Teks):
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {QUICK_REPAIR_CHIPS.map((chip, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => addQuickChip(chip)}
                                                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#11468F] text-slate-700 border border-slate-200 transition-colors text-left"
                                                >
                                                    + {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <textarea
                                        value={formData.repair_description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, repair_description: e.target.value }))}
                                        rows={4}
                                        className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#11468F]/30 focus:border-[#11468F]"
                                        placeholder="Contoh: Telah dilakukan pembersihan nozzle corong yang tersumbat debu, pengujian hembusan lancar, serta pemasangan kembali pin pengaman baru..."
                                        required
                                    />
                                </div>

                                {/* Completion Datetime & GPS Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            📅 Waktu Selesai Perbaikan <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.repair_completed_at}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, repair_completed_at: e.target.value }))}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F]"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            📍 Verifikasi Titik Lokasi Lapangan
                                        </label>
                                        <div className="h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                                            {gpsLoading ? (
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <div className="h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                                    <span>Mendeteksi koordinat GPS...</span>
                                                </div>
                                            ) : currentLocation ? (
                                                <div className="flex items-center gap-1.5 text-emerald-700 font-mono font-medium truncate">
                                                    <MapPinIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                    <span>{currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}</span>
                                                    <span className="text-[10px] text-slate-400 font-sans">({currentLocation.accuracy}m)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-700">
                                                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                    <span>GPS belum terdeteksi</span>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={getCurrentLocation}
                                                className="text-[#11468F] hover:underline font-semibold flex-shrink-0 text-[11px]"
                                            >
                                                Perbarui
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Readiness Checklist Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
                                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                                    Ringkasan Kelengkapan Dokumen:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                            formData.before_photo ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}>✓</span>
                                        <span className={formData.before_photo ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                                            Foto Umum Sebelum Perbaikan
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                            isAllDamagesCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}>✓</span>
                                        <span className={isAllDamagesCompleted ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                                            Bukti Kerusakan ({completedDamagesCount}/{damages.length})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                            formData.after_photo ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}>✓</span>
                                        <span className={formData.after_photo ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                                            Foto Umum Setelah Perbaikan
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                            formData.repair_description.trim().length >= 10 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                                        }`}>✓</span>
                                        <span className={formData.repair_description.trim().length >= 10 ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                                            Deskripsi Tindakan ({formData.repair_description.trim().length}/10 kar.)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="h-12 px-5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <ArrowLeftIcon className="h-4 w-4" />
                                    <span>Kembali ke Kerusakan</span>
                                </button>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate({ to: '/my-repairs' })}
                                        className="h-12 px-5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs uppercase tracking-wider rounded-lg transition-all"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting || !formData.before_photo || !formData.after_photo || !formData.repair_description.trim() || !isAllDamagesCompleted}
                                        className="h-12 px-8 bg-[#11468F] hover:bg-[#0d3873] text-white disabled:opacity-50 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Mengirim Laporan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="h-5 w-5" />
                                                <span>Kirim Laporan Perbaikan</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* ============================================================== */}
                {/* DEDICATED FIELD CAMERA VIEWFINDER MODAL (BUG-FREE LIFECYCLE)   */}
                {/* ============================================================== */}
                <RepairCameraModal
                    cameraTarget={cameraTarget}
                    closeCamera={closeCamera}
                    videoRef={videoRef}
                    streamRef={streamRef}
                    attachStreamToVideo={attachStreamToVideo}
                    cameraLoading={cameraLoading}
                    capturePhoto={capturePhoto}
                    toggleCameraFacingMode={toggleCameraFacingMode}
                />

                {/* ============================================================== */}
                {/* PHOTO FULLSCREEN PREVIEW MODAL                                 */}
                {/* ============================================================== */}
                {previewModalUrl && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                        onClick={() => setPreviewModalUrl(null)}
                    >
                        <div className="relative max-w-2xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setPreviewModalUrl(null)}
                                className="absolute -top-10 right-0 text-white hover:text-slate-300 text-sm font-semibold flex items-center gap-1"
                            >
                                <XMarkIcon className="h-6 w-6" />
                                <span>Tutup</span>
                            </button>
                            <img
                                src={previewModalUrl}
                                alt="Preview"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/20"
                            />
                        </div>
                    </div>
                )}

                {/* Hidden processing canvas */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default RepairReportForm;
