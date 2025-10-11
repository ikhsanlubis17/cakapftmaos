import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
    CameraIcon,
    MapPinIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon,
    TruckIcon,
    FireIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

const InspectionFormEnhanced = () => {
    const { qrCode } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const selfieVideoRef = useRef(null);
    const selfieCanvasRef = useRef(null);
    const damageVideoRef = useRef(null);
    const damageCanvasRef = useRef(null);

    const [apar, setApar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [damageCategories, setDamageCategories] = useState([]);
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    // Form state
    const [condition, setCondition] = useState('good');
    const [notes, setNotes] = useState('');
    const [photo, setPhoto] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationValid, setLocationValid] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [locationDistance, setLocationDistance] = useState(null);
    const [locationValidRadius, setLocationValidRadius] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationDirection, setLocationDirection] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [selfieCameraActive, setSelfieCameraActive] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [selfieLoading, setSelfieLoading] = useState(false);
    const [damageCameraActive, setDamageCameraActive] = useState(false);
    const [damageCameraLoading, setDamageCameraLoading] = useState(false);
    const [captureCountdown, setCaptureCountdown] = useState(0);
    const [showFlash, setShowFlash] = useState(false);

    // Damage categories state
    const [selectedDamages, setSelectedDamages] = useState([]);
    const [showDamageForm, setShowDamageForm] = useState(false);
    const [newDamage, setNewDamage] = useState({
        category_id: '',
        notes: '',
        severity: 'medium',
        damage_photo: null
    });

    useEffect(() => {
        // Only handle media cleanup on unmount
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (selfieVideoRef.current && selfieVideoRef.current.srcObject) {
                selfieVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (damageVideoRef.current && damageVideoRef.current.srcObject) {
                damageVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const aparQuery = useQuery({
        queryKey: ['apar', qrCode],
        queryFn: async () => {
            const resp = await apiClient.get(`/api/apar/qr/${qrCode}`);
            return resp.data; // server returns the apar object in data
        },
        staleTime: 1000 * 60 * 2,
        enabled: Boolean(qrCode),
    });

    const damageCategoriesQuery = useQuery({
        queryKey: ['damage-categories', 'active'],
        queryFn: async () => {
            const resp = await apiClient.get('/api/damage-categories/active');
            return resp.data.data;
        },
        staleTime: 1000 * 60 * 2,
    });

    useEffect(() => {
        if (aparQuery.data) {
            setApar(aparQuery.data);
        }
        if (aparQuery.isError) {
            showError('APAR tidak ditemukan atau QR Code tidak valid');
        }
    }, [aparQuery.data, aparQuery.isError]);

    useEffect(() => {
        if (damageCategoriesQuery.data) {
            setDamageCategories(damageCategoriesQuery.data);
        }
        if (damageCategoriesQuery.isError) {
            console.error('Error fetching damage categories');
        }
    }, [damageCategoriesQuery.data, damageCategoriesQuery.isError]);

    // Damage category management
    const addDamage = () => {
        if (!newDamage.category_id || !newDamage.damage_photo) {
            showError('Pilih kategori dan ambil foto kerusakan');
            return;
        }

        const category = damageCategories.find(cat => cat.id == newDamage.category_id);
        const damage = {
            ...newDamage,
            id: Date.now(), // Temporary ID
            category_name: category.name,
            category: category
        };

        setSelectedDamages([...selectedDamages, damage]);
        setNewDamage({
            category_id: '',
            notes: '',
            severity: 'medium',
            damage_photo: null
        });
        setShowDamageForm(false);
    };

    const removeDamage = (damageId) => {
        setSelectedDamages(selectedDamages.filter(d => d.id !== damageId));
    };

    const startDamageCamera = async () => {
        try {
            setDamageCameraLoading(true);

            if (damageVideoRef.current && damageVideoRef.current.srcObject) {
                damageVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
                damageVideoRef.current.srcObject = null;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setDamageCameraActive(true);
            setDamageCameraLoading(false);
            setCaptureCountdown(0);

            setTimeout(() => {
                if (damageVideoRef.current) {
                    damageVideoRef.current.srcObject = stream;

                    damageVideoRef.current.onloadedmetadata = () => {
                        damageVideoRef.current.play().catch(e => {
                            console.error('Error playing damage video:', e);
                        });
                    };

                    damageVideoRef.current.onerror = (e) => {
                        console.error('Damage video error:', e);
                        showError('Error pada video stream kamera kerusakan');
                    };
                }
            }, 200);
        } catch (error) {
            console.error('Error starting damage camera:', error);
            setDamageCameraLoading(false);
            showError('Tidak dapat mengakses kamera untuk foto kerusakan');
        }
    };

    const captureDamagePhoto = () => {
        if (damageVideoRef.current && damageCanvasRef.current) {
            setCaptureCountdown(3);

            const countdownInterval = setInterval(() => {
                setCaptureCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);

                        const video = damageVideoRef.current;
                        const canvas = damageCanvasRef.current;
                        const context = canvas.getContext('2d');

                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        context.drawImage(video, 0, 0);

                        setShowFlash(true);
                        setTimeout(() => setShowFlash(false), 200);

                        canvas.toBlob((blob) => {
                            setNewDamage(prevDamage => ({ ...prevDamage, damage_photo: blob }));
                            stopDamageCamera();
                        }, 'image/jpeg', 0.8);

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const stopDamageCamera = () => {
        if (damageVideoRef.current && damageVideoRef.current.srcObject) {
            damageVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            damageVideoRef.current.srcObject = null;
        }
        setDamageCameraActive(false);
        setDamageCameraLoading(false);
    };

    // Camera and location methods
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentLocation(location);

                    // Validate location if APAR has coordinates
                    if (apar?.latitude && apar?.longitude) {
                        const distance = calculateDistance(
                            location.lat, location.lng,
                            apar.latitude, apar.longitude
                        );
                        const valid = distance <= (apar.valid_radius || 30);
                        setLocationValid(valid);
                        setLocationDistance(Math.round(distance));
                        setLocationValidRadius(apar.valid_radius || 30);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    showError('Tidak dapat mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diizinkan.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            showError('Geolokasi tidak didukung di browser ini');
        }
    };

    const startCamera = async () => {
        try {
            setCameraLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setCameraActive(true);
            setCameraLoading(false);

            setTimeout(async () => {

                // Store stream for later use
                if (videoRef.current) {
                    console.log('Setting video stream for APAR camera');
                    videoRef.current.srcObject = stream;

                    // Wait for video to be ready before playing
                    videoRef.current.onloadedmetadata = () => {
                        console.log('Video metadata loaded, starting playback');
                        videoRef.current.play().catch(e => {
                            console.error('Error playing video:', e);
                        });
                    };

                    // Handle video errors
                    videoRef.current.onerror = (e) => {
                        console.error('Video error:', e);
                        showError('Error pada video stream kamera');
                    };

                    // Log video properties
                    videoRef.current.oncanplay = () => {
                        console.log('Video can play:', {
                            videoWidth: videoRef.current.videoWidth,
                            videoHeight: videoRef.current.videoHeight,
                            readyState: videoRef.current.readyState
                        });
                    };
                }
            }, 200)
        } catch (error) {
            console.error('Error starting camera:', error);
            setCameraLoading(false);
            showError('Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            // Start countdown
            setCaptureCountdown(3);

            const countdownInterval = setInterval(() => {
                setCaptureCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);

                        // Capture photo after countdown
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        const context = canvas.getContext('2d');

                        // Set canvas dimensions to match video
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        // Draw video frame to canvas
                        context.drawImage(video, 0, 0);

                        // Show flash effect
                        setShowFlash(true);
                        setTimeout(() => setShowFlash(false), 200);

                        // Convert to blob
                        canvas.toBlob((blob) => {
                            setPhoto(blob);
                            stopCamera();
                        }, 'image/jpeg', 0.8);

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setCameraLoading(false);
    };

    const startSelfieCamera = async () => {
        try {
            setSelfieLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Use front camera for selfie
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setSelfieCameraActive(true);
            setSelfieLoading(false);

            setTimeout(async () => {
                // Store stream for later use
                if (selfieVideoRef.current) {
                    console.log('Setting video stream for selfie camera');
                    selfieVideoRef.current.srcObject = stream;

                    // Wait for video to be ready before playing
                    selfieVideoRef.current.onloadedmetadata = () => {
                        console.log('Selfie video metadata loaded, starting playback');
                        selfieVideoRef.current.play().catch(e => {
                            console.error('Error playing selfie video:', e);
                        });
                    };

                    // Handle video errors
                    selfieVideoRef.current.onerror = (e) => {
                        console.error('Selfie video error:', e);
                        showError('Error pada video stream kamera depan');
                    };

                    // Log video properties
                    selfieVideoRef.current.oncanplay = () => {
                        console.log('Selfie video can play:', {
                            videoWidth: selfieVideoRef.current.videoWidth,
                            videoHeight: selfieVideoRef.current.videoHeight,
                            readyState: selfieVideoRef.current.readyState
                        });
                    };
                }
            }, 200)

        } catch (error) {
            console.error('Error starting selfie camera:', error);
            setSelfieLoading(false);
            showError('Tidak dapat mengakses kamera depan. Pastikan izin kamera diizinkan.');
        }
    };

    const captureSelfie = () => {
        if (selfieVideoRef.current && selfieCanvasRef.current) {
            // Start countdown
            setCaptureCountdown(3);

            const countdownInterval = setInterval(() => {
                setCaptureCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);

                        // Capture selfie after countdown
                        const video = selfieVideoRef.current;
                        const canvas = selfieCanvasRef.current;
                        const context = canvas.getContext('2d');

                        // Set canvas dimensions to match video
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        // Draw video frame to canvas
                        context.drawImage(video, 0, 0);

                        // Show flash effect
                        setShowFlash(true);
                        setTimeout(() => setShowFlash(false), 200);

                        // Convert to blob
                        canvas.toBlob((blob) => {
                            setSelfie(blob);
                            stopSelfieCamera();
                        }, 'image/jpeg', 0.8);

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    const stopSelfieCamera = () => {
        if (selfieVideoRef.current && selfieVideoRef.current.srcObject) {
            selfieVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            selfieVideoRef.current.srcObject = null;
        }
        setSelfieCameraActive(false);
        setSelfieLoading(false);
    };

    // Helper function to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const submitInspectionMutation = useMutation({
        mutationFn: async (payload) => {
            // payload is a FormData instance
            const res = await apiClient.post('/api/inspections', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: () => {
            showSuccess('Inspeksi berhasil disimpan!');
            queryClient.invalidateQueries({ queryKey: ['inspections'] });
            queryClient.invalidateQueries({ queryKey: ['apar'] });
            setTimeout(() => navigate({ to: '/apar' }), 2000);
        },
        onError: (error) => {
            console.error('Error submitting inspection:', error);

            if (error.response?.status === 422 && error.response?.data?.error) {
                showError(error.response.data.error);

                if (error.response.data.distance !== null) {
                    setLocationDistance(Math.round(error.response.data.distance));
                }
                if (error.response.data.valid_radius !== null) {
                    setLocationValidRadius(error.response.data.valid_radius);
                }
                setLocationValid(false);
                setLocationError(error.response.data.error);
            } else {
                showError(error.response?.data?.message || "Gagal menyimpan inspeksi");
            }
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!photo) {
            showError('Foto APAR wajib diambil');
            return;
        }

        if (!selfie) {
            showError('Foto selfie teknisi wajib diambil');
            return;
        }

        const fd = new FormData();
        fd.append('apar_id', apar.id);
        fd.append('condition', condition);
        fd.append('notes', notes);
        fd.append('photo', photo);
        fd.append('selfie', selfie);

        if (currentLocation) {
            fd.append('lat', currentLocation.lat);
            fd.append('lng', currentLocation.lng);
        }

        if (selectedDamages.length > 0) {
            selectedDamages.forEach((damage, index) => {
                fd.append(`damage_categories[${index}][category_id]`, damage.category_id);
                fd.append(`damage_categories[${index}][notes]`, damage.notes);
                fd.append(`damage_categories[${index}][severity]`, damage.severity);
                fd.append(`damage_categories[${index}][damage_photo]`, damage.damage_photo);
            });
        }

        submitInspectionMutation.mutate(fd);
    };

    if (aparQuery.isLoading || damageCategoriesQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!apar) {
        return (
            <div className="text-center py-12">
                <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">APAR Tidak Ditemukan</h3>
                <p className="mt-1 text-sm text-gray-500">QR Code tidak valid atau APAR tidak terdaftar.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
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
                                    {apar.serial_number}
                                </p>
                                <span className="text-gray-400">•</span>
                                <p className="text-gray-600">{apar.location_name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-6 space-y-8 border border-gray-100">
                    {/* Photo Capture - APAR */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📸 Foto APAR <span className="text-red-500">*</span>
                        </label>

                        {!photo && !cameraActive && (
                            <button
                                type="button"
                                onClick={startCamera}
                                disabled={cameraLoading}
                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-center">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                                        <CameraIcon className="h-8 w-8 text-red-600" />
                                    </div>
                                    <p className="mt-3 text-lg font-medium text-gray-700">
                                        {cameraLoading ? 'Memulai Kamera...' : 'Ambil Foto APAR'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">Foto wajib diambil dari kamera</p>
                                </div>
                            </button>
                        )}

                        {cameraActive && !photo && (
                            <div className="relative bg-black rounded-xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-40 object-cover"
                                    style={{ backgroundColor: 'transparent' }}
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Debug Info - Remove in production */}
                                <div className="absolute top-3 right-3 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                                    Debug: {videoRef.current?.readyState || 'N/A'}
                                </div>

                                {/* Camera Overlay */}
                                <div className="absolute inset-0 border-4 border-red-500 border-dashed opacity-50 pointer-events-none"></div>

                                {/* Countdown Display */}
                                {captureCountdown > 0 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="text-white text-6xl font-bold animate-pulse">
                                            {captureCountdown}
                                        </div>
                                    </div>
                                )}

                                {/* Flash Effect */}
                                {showFlash && (
                                    <div className="absolute inset-0 bg-white opacity-80 animate-pulse"></div>
                                )}

                                {/* Camera Controls */}
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={capturePhoto}
                                        disabled={captureCountdown > 0}
                                        className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors duration-200 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="text-lg">📸</span>
                                        <span>{captureCountdown > 0 ? 'Menunggu...' : 'Ambil Foto'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        disabled={captureCountdown > 0}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors duration-200 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>❌</span>
                                        <span>Batal</span>
                                    </button>
                                </div>

                                {/* Camera Status */}
                                <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    📹 Kamera Aktif
                                </div>

                                {/* Instructions */}
                                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-xs">
                                    Arahkan ke APAR
                                </div>
                            </div>
                        )}

                        {photo && (
                            <div className="relative group">
                                <img
                                    src={URL.createObjectURL(photo)}
                                    alt="APAR Photo"
                                    className="w-full rounded-xl shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl"></div>
                                <button
                                    type="button"
                                    onClick={() => setPhoto(null)}
                                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200 shadow-lg"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    ✅ Foto APAR
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Photo Capture - Selfie */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            🤳 Selfie Teknisi <span className="text-red-500">*</span>
                        </label>

                        {!selfie && !selfieCameraActive && (
                            <button
                                type="button"
                                onClick={startSelfieCamera}
                                disabled={selfieLoading}
                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-center">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                                        <CameraIcon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <p className="mt-3 text-lg font-medium text-gray-700">
                                        {selfieLoading ? 'Memulai Kamera...' : 'Ambil Selfie'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">Selfie wajib diambil dari kamera</p>
                                </div>
                            </button>
                        )}

                        {selfieCameraActive && !selfie && (
                            <div className="relative bg-black rounded-xl overflow-hidden">
                                <video
                                    ref={selfieVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-40 object-cover"
                                    style={{ backgroundColor: 'transparent' }}
                                />
                                <canvas ref={selfieCanvasRef} className="hidden" />

                                {/* Debug Info - Remove in production */}
                                <div className="absolute top-3 right-3 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                                    Debug: {selfieVideoRef.current?.readyState || 'N/A'}
                                </div>

                                {/* Camera Overlay */}
                                <div className="absolute inset-0 border-4 border-blue-500 border-dashed opacity-50 pointer-events-none"></div>

                                {/* Countdown Display */}
                                {captureCountdown > 0 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="text-white text-6xl font-bold animate-pulse">
                                            {captureCountdown}
                                        </div>
                                    </div>
                                )}

                                {/* Flash Effect */}
                                {showFlash && (
                                    <div className="absolute inset-0 bg-white opacity-80 animate-pulse"></div>
                                )}

                                {/* Camera Controls */}
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={captureSelfie}
                                        disabled={captureCountdown > 0}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="text-lg">📸</span>
                                        <span>{captureCountdown > 0 ? 'Menunggu...' : 'Ambil Selfie'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopSelfieCamera}
                                        disabled={captureCountdown > 0}
                                        className="bg-gray-600 text-white px-2 py-2 rounded-full hover:bg-gray-700 transition-colors duration-200 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>❌</span>
                                        <span>Batal</span>
                                    </button>
                                </div>

                                {/* Camera Status */}
                                <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    📹 Selfie Mode
                                </div>

                                {/* Instructions */}
                                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-xs">
                                    Lihat ke kamera
                                </div>
                            </div>
                        )}

                        {selfie && (
                            <div className="relative group">
                                <img
                                    src={URL.createObjectURL(selfie)}
                                    alt="Selfie"
                                    className="w-full rounded-xl shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl"></div>
                                <button
                                    type="button"
                                    onClick={() => setSelfie(null)}
                                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200 shadow-lg"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                                <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    ✅ Selfie Teknisi
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            🔍 Kondisi APAR <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-medium"
                            required
                        >
                            <option value="good">Baik</option>
                            <option value="needs_refill">Perlu Isi Ulang</option>
                            {/* <option value="expired">Kadaluwarsa</option> */}
                            <option value="damaged">Rusak</option>
                        </select>
                    </div>

                    {/* Damage Categories */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            🚨 Kategori Kerusakan
                        </label>

                        {selectedDamages.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {selectedDamages.map((damage) => (
                                    <div key={damage.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                                                    {damage.category_name}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${damage.severity === 'low' ? 'bg-green-100 text-green-800' :
                                                    damage.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        damage.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {damage.severity === 'low' ? 'Rendah' :
                                                        damage.severity === 'medium' ? 'Sedang' :
                                                            damage.severity === 'high' ? 'Tinggi' : 'Kritis'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeDamage(damage.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {damage.notes && (
                                            <p className="text-sm text-gray-700 mb-3">{damage.notes}</p>
                                        )}

                                        {damage.damage_photo && (
                                            <div className="relative">
                                                <img
                                                    src={URL.createObjectURL(damage.damage_photo)}
                                                    alt="Damage Photo"
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                                    Foto Kerusakan
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!showDamageForm ? (
                            <button
                                type="button"
                                onClick={() => setShowDamageForm(true)}
                                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-red-400 hover:bg-red-50 transition-all duration-200 group"
                            >
                                <div className="text-center">
                                    <PlusIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
                                    <p className="mt-2 text-sm font-medium text-gray-700 group-hover:text-red-700">
                                        Tambah Kategori Kerusakan
                                    </p>
                                    <p className="text-xs text-gray-500">Klik untuk menambah detail kerusakan</p>
                                </div>
                            </button>
                        ) : (
                            <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
                                <h4 className="font-medium text-gray-900 mb-4">Tambah Kategori Kerusakan</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kategori Kerusakan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newDamage.category_id}
                                            onChange={(e) => setNewDamage({ ...newDamage, category_id: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            required
                                        >
                                            <option value="">Pilih kategori kerusakan</option>
                                            {damageCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tingkat Keparahan
                                        </label>
                                        <select
                                            value={newDamage.severity}
                                            onChange={(e) => setNewDamage({ ...newDamage, severity: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        >
                                            <option value="low">Rendah</option>
                                            <option value="medium">Sedang</option>
                                            <option value="high">Tinggi</option>
                                            <option value="critical">Kritis</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Catatan Tambahan
                                        </label>
                                        <textarea
                                            value={newDamage.notes}
                                            onChange={(e) => setNewDamage({ ...newDamage, notes: e.target.value })}
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                            placeholder="Jelaskan detail kerusakan..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Foto Kerusakan <span className="text-red-500">*</span>
                                        </label>

                                        {!newDamage.damage_photo && !damageCameraActive && (
                                            <button
                                                type="button"
                                                onClick={startDamageCamera}
                                                disabled={damageCameraLoading}
                                                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="text-center">
                                                    <div className="mx-auto h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                                                        <CameraIcon className="h-6 w-6 text-red-600" />
                                                    </div>
                                                    <p className="mt-2 text-sm font-medium text-gray-700">
                                                        {damageCameraLoading ? 'Memulai Kamera...' : 'Ambil Foto Kerusakan'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Foto wajib diambil dari kamera</p>
                                                </div>
                                            </button>
                                        )}

                                        {damageCameraActive && !newDamage.damage_photo && (
                                            <div className="relative bg-black rounded-lg overflow-hidden">
                                                <video
                                                    ref={damageVideoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-32 object-cover"
                                                    style={{ backgroundColor: 'transparent' }}
                                                />
                                                <canvas ref={damageCanvasRef} className="hidden" />

                                                <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                                                    Debug: {damageVideoRef.current?.readyState || 'N/A'}
                                                </div>

                                                <div className="absolute inset-0 border-4 border-red-500 border-dashed opacity-50 pointer-events-none"></div>

                                                {captureCountdown > 0 && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                        <div className="text-white text-4xl font-bold animate-pulse">
                                                            {captureCountdown}
                                                        </div>
                                                    </div>
                                                )}

                                                {showFlash && (
                                                    <div className="absolute inset-0 bg-white opacity-80 animate-pulse"></div>
                                                )}

                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={captureDamagePhoto}
                                                        disabled={captureCountdown > 0}
                                                        className="bg-red-600 text-white px-4 py-1.5 rounded-full hover:bg-red-700 transition-colors duration-200 shadow-lg flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span>📸</span>
                                                        <span>{captureCountdown > 0 ? 'Menunggu...' : 'Ambil Foto'}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={stopDamageCamera}
                                                        disabled={captureCountdown > 0}
                                                        className="bg-gray-600 text-white px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors duration-200 shadow-lg flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span>❌</span>
                                                        <span>Batal</span>
                                                    </button>
                                                </div>

                                                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                    📹 Kamera Kerusakan
                                                </div>

                                                <div className="absolute top-2 right-2 translate-y-8 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-[10px]">
                                                    Fokuskan pada area rusak
                                                </div>
                                            </div>
                                        )}

                                        {newDamage.damage_photo && (
                                            <div className="relative group">
                                                <img
                                                    src={URL.createObjectURL(newDamage.damage_photo)}
                                                    alt="Damage Photo"
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewDamage({ ...newDamage, damage_photo: null })}
                                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                                <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                    ✅ Foto Kerusakan
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={addDamage}
                                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        >
                                            Tambah Kerusakan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                stopDamageCamera();
                                                setShowDamageForm(false);
                                                setNewDamage({
                                                    category_id: '',
                                                    notes: '',
                                                    severity: 'medium',
                                                    damage_photo: null
                                                });
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📝 Catatan
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg resize-none"
                            placeholder="Tambahkan catatan inspeksi (opsional)..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={submitting || !photo || !selfie}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg"
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
                        <button
                            type="button"
                            onClick={() => navigate({ to: '/apar' })}
                            className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InspectionFormEnhanced;


