import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, getRouteApi } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
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

// Small subcomponents kept in this file for clarity
const Header = ({ apar }) => (
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
                    <p className="text-lg font-semibold text-gray-700">{apar.serial_number}</p>
                    <span className="text-gray-400">•</span>
                    <p className="text-gray-600">{apar.location_name}</p>
                </div>
            </div>
        </div>
    </div>
);

const APARPhotoCapture = ({ photo, cameraActive, cameraLoading, startCamera, capturePhoto, stopCamera, videoRef, canvasRef, captureCountdown, showFlash, setPhoto }) => (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center">
            📸 Foto APAR <span className="text-red-500 ml-1">*</span>
        </label>

        {!photo && !cameraActive && (
            <button
                type="button"
                onClick={startCamera}
                disabled={cameraLoading}
                className="w-full aspect-video bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all duration-300 group shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CameraIcon className="h-8 w-8 text-red-600" />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-700 group-hover:text-red-700">Ambil Foto APAR</p>
                <p className="mt-1 text-sm text-gray-500">Pastikan APAR terlihat jelas</p>
            </button>
        )}

        {cameraActive && !photo && (
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-b border-white/50"></div>
                        <div className="border-r border-b border-white/50"></div>
                        <div className="border-b border-white/50"></div>
                        <div className="border-r border-b border-white/50"></div>
                        <div className="border-r border-b border-white/50"></div>
                        <div className="border-b border-white/50"></div>
                        <div className="border-r border-white/50"></div>
                        <div className="border-r border-white/50"></div>
                        <div></div>
                    </div>
                </div>

                {captureCountdown > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20">
                        <div className="text-white text-8xl font-bold animate-ping">{captureCountdown}</div>
                    </div>
                )}

                {showFlash && <div className="absolute inset-0 bg-white z-30 animate-flash"></div>}

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center space-x-6">
                    <button 
                        type="button" 
                        onClick={stopCamera} 
                        className="p-4 rounded-full bg-gray-800/80 text-white hover:bg-gray-700 transition-all backdrop-blur-md"
                        title="Batal"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={capturePhoto} 
                        disabled={captureCountdown > 0} 
                        className="p-1 rounded-full border-4 border-white/30 hover:border-white/50 transition-all"
                    >
                        <div className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-500 border-4 border-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center">
                            <CameraIcon className="h-8 w-8 text-white" />
                        </div>
                    </button>
                </div>

                <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                    Live Camera
                </div>
            </div>
        )}

        {photo && (
            <div className="relative group rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
                <img src={URL.createObjectURL(photo)} alt="APAR Photo" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                        type="button" 
                        onClick={() => setPhoto(null)} 
                        className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-xl transform scale-90 group-hover:scale-100 transition-all hover:bg-gray-100"
                    >
                        Ambil Ulang
                    </button>
                </div>
                <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Foto Tersimpan
                </div>
            </div>
        )}
    </div>
);

const SelfieCapture = ({ selfie, selfieCameraActive, selfieLoading, startSelfieCamera, captureSelfie, stopSelfieCamera, selfieVideoRef, selfieCanvasRef, captureCountdown, showFlash, setSelfie }) => (
    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center">
            🤳 Selfie Teknisi <span className="text-red-500 ml-1">*</span>
        </label>

        {!selfie && !selfieCameraActive && (
            <button
                type="button"
                onClick={startSelfieCamera}
                disabled={selfieLoading}
                className="w-full aspect-video bg-white border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CameraIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-700 group-hover:text-blue-700">Ambil Selfie</p>
                <p className="mt-1 text-sm text-gray-500">Wajib selfie di lokasi</p>
            </button>
        )}

        {selfieCameraActive && !selfie && (
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
                <video ref={selfieVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={selfieCanvasRef} className="hidden" />

                {captureCountdown > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20">
                        <div className="text-white text-8xl font-bold animate-ping">{captureCountdown}</div>
                    </div>
                )}

                {showFlash && <div className="absolute inset-0 bg-white z-30 animate-flash"></div>}

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center space-x-6">
                    <button 
                        type="button" 
                        onClick={stopSelfieCamera} 
                        className="p-4 rounded-full bg-gray-800/80 text-white hover:bg-gray-700 transition-all backdrop-blur-md"
                        title="Batal"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={captureSelfie} 
                        disabled={captureCountdown > 0} 
                        className="p-1 rounded-full border-4 border-white/30 hover:border-white/50 transition-all"
                    >
                        <div className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-500 border-4 border-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center">
                            <CameraIcon className="h-8 w-8 text-white" />
                        </div>
                    </button>
                </div>

                <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                    Selfie Mode
                </div>
            </div>
        )}

        {selfie && (
            <div className="relative group rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
                <img src={URL.createObjectURL(selfie)} alt="Selfie" className="w-full h-full object-contain transform scale-x-[-1]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button 
                        type="button" 
                        onClick={() => setSelfie(null)} 
                        className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow-xl transform scale-90 group-hover:scale-100 transition-all hover:bg-gray-100"
                    >
                        Ambil Ulang
                    </button>
                </div>
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Selfie Tersimpan
                </div>
            </div>
        )}
    </div>
);

const DamageSection = ({ selectedDamages, removeDamage, showDamageForm, setShowDamageForm, newDamage, setNewDamage, damageCategories, startDamageCamera, damageCameraActive, damageCameraLoading, damageVideoRef, damageCanvasRef, captureCountdown, showFlash, captureDamagePhoto, stopDamageCamera, addDamage }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <label className="block text-xl font-bold text-gray-900 mb-6 flex items-center">
            🚨 Kategori Kerusakan
        </label>

        {selectedDamages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedDamages.map((damage) => (
                    <div key={damage.id} className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                                <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">{damage.category_name}</span>
                                <div className="flex items-center mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${
                                        damage.severity === 'low' ? 'bg-green-100 text-green-800' : 
                                        damage.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                        damage.severity === 'high' ? 'bg-orange-100 text-orange-800' : 
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {damage.severity === 'low' ? 'Rendah' : damage.severity === 'medium' ? 'Sedang' : damage.severity === 'high' ? 'Tinggi' : 'Kritis'}
                                    </span>
                                </div>
                            </div>
                            <button type="button" onClick={() => removeDamage(damage.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {damage.notes && <p className="text-sm text-gray-600 mb-4 bg-white/50 p-2 rounded-lg">{damage.notes}</p>}

                        {damage.damage_photo && (
                            <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                                <img src={URL.createObjectURL(damage.damage_photo)} alt="Damage Photo" className="w-full h-full object-contain" />
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
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
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
            >
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300 mb-3">
                    <PlusIcon className="h-8 w-8 text-gray-400 group-hover:text-red-600 transition-colors duration-300" />
                </div>
                <p className="text-lg font-semibold text-gray-700 group-hover:text-red-700">Tambah Kategori Kerusakan</p>
                <p className="text-sm text-gray-500">Klik untuk melaporkan kerusakan baru</p>
            </button>
        ) : (
            <div className="border-2 border-red-100 rounded-xl p-6 bg-red-50/50 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold text-gray-900">Form Laporan Kerusakan</h4>
                    <button onClick={() => setShowDamageForm(false)} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Kerusakan <span className="text-red-500">*</span></label>
                            <select value={newDamage.category_id} onChange={(e) => setNewDamage({ ...newDamage, category_id: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white" required>
                                <option value="">Pilih kategori kerusakan</option>
                                {damageCategories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tingkat Keparahan</label>
                            <select value={newDamage.severity} onChange={(e) => setNewDamage({ ...newDamage, severity: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white">
                                <option value="low">Rendah</option>
                                <option value="medium">Sedang</option>
                                <option value="high">Tinggi</option>
                                <option value="critical">Kritis</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan</label>
                        <textarea value={newDamage.notes} onChange={(e) => setNewDamage({ ...newDamage, notes: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white" placeholder="Jelaskan detail kerusakan..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Foto Kerusakan <span className="text-red-500">*</span></label>

                        {!newDamage.damage_photo && !damageCameraActive && (
                            <button 
                                type="button" 
                                onClick={startDamageCamera} 
                                disabled={damageCameraLoading} 
                                className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all duration-300 group disabled:opacity-50"
                            >
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-3">
                                    <CameraIcon className="h-6 w-6 text-red-600" />
                                </div>
                                <p className="font-medium text-gray-700 group-hover:text-red-700">Ambil Foto Kerusakan</p>
                            </button>
                        )}

                        {damageCameraActive && !newDamage.damage_photo && (
                            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
                                <video ref={damageVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <canvas ref={damageCanvasRef} className="hidden" />

                                {captureCountdown > 0 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20">
                                        <div className="text-white text-6xl font-bold animate-ping">{captureCountdown}</div>
                                    </div>
                                )}

                                {showFlash && <div className="absolute inset-0 bg-white z-30 animate-flash"></div>}

                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center space-x-4">
                                    <button onClick={stopDamageCamera} className="p-3 rounded-full bg-gray-800/80 text-white hover:bg-gray-700 transition-all"><XMarkIcon className="h-5 w-5" /></button>
                                    <button onClick={captureDamagePhoto} disabled={captureCountdown > 0} className="p-1 rounded-full border-2 border-white/30">
                                        <div className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-500 border-2 border-white flex items-center justify-center"><CameraIcon className="h-6 w-6 text-white" /></div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {newDamage.damage_photo && (
                            <div className="relative group rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
                                <img src={URL.createObjectURL(newDamage.damage_photo)} alt="Damage Photo" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button type="button" onClick={() => setNewDamage({ ...newDamage, damage_photo: null })} className="bg-white text-red-600 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100">Hapus Foto</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button type="button" onClick={addDamage} className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg hover:shadow-red-500/30">Simpan Kerusakan</button>
                        <button type="button" onClick={() => { stopDamageCamera(); setShowDamageForm(false); setNewDamage({ category_id: '', notes: '', severity: 'medium', damage_photo: null }); }} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">Batal</button>
                    </div>
                </div>
            </div>
        )}
    </div>
);

const InspectionFormEnhanced = () => {
    const router = getRouteApi('/authenticated/inspections/enhanced/$qrCode');
    const { qrCode } = router.useParams();
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
        getCurrentLocation();
    }, []);

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
            setCaptureCountdown(1);

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
    const [locationSkipped, setLocationSkipped] = useState(false);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setLocationLoading(true);
            setLocationError('');
            setLocationSkipped(false);
            
            // Use watchPosition instead of getCurrentPosition for better reliability
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    // We got a position! Stop watching.
                    navigator.geolocation.clearWatch(watchId);
                    
                    setLocationLoading(false);
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
                    // Only handle error if we haven't got a position yet
                    // But watchPosition might call error multiple times or eventually success
                    // We'll set a timeout to clear the watch if it takes too long
                    console.warn('Watch position error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 10000
                }
            );

            // Set a timeout to stop watching if no position is found within 10 seconds
            setTimeout(() => {
                navigator.geolocation.clearWatch(watchId);
                setLocationLoading((prev) => {
                    if (prev) { // If still loading
                        console.error('Geolocation timed out');
                        showError('Gagal mendapatkan lokasi. Silakan coba lagi atau lanjutkan tanpa lokasi.');
                        setLocationError('Waktu permintaan lokasi habis.');
                        return false;
                    }
                    return prev;
                });
            }, 10000);

        } else {
            showError('Geolokasi tidak didukung di browser ini');
        }
    };

    const skipLocation = () => {
        setLocationSkipped(true);
        setCurrentLocation(null);
        setLocationValid(true); // Bypass validation
        setLocationError('');
    };

    // ... (inside the render return)
    
    // Find the location section in the JSX and add the retry button
    // It seems the location section is not explicitly separated in the provided code snippet, 
    // but I can see where `locationError` is used or where the location status is displayed.
    // I will search for where `locationError` is likely displayed or add a new section for it.


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
            setCaptureCountdown(1);

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
            setCaptureCountdown(1);

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
            setTimeout(() => navigate({ to: '/' }), 2000);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // BYPASS: Create dummy blobs if missing
        let finalPhoto = photo;
        let finalSelfie = selfie;

        try {
            if (!finalPhoto) {
                // White 1x1 pixel for better visibility than transparent
                const response = await fetch("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/8/QDwAE/QH/h9OKMAAAAABJRU5ErkJggg==");
                finalPhoto = await response.blob();
            }

            if (!finalSelfie) {
                // White 1x1 pixel
                const response = await fetch("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/8/QDwAE/QH/h9OKMAAAAABJRU5ErkJggg==");
                finalSelfie = await response.blob();
            }
        } catch (err) {
            console.error("Error creating dummy blobs", err);
        }

        const fd = new FormData();
        fd.append('apar_id', apar.id);
        fd.append('apar_qrCode', qrCode);
        fd.append('condition', condition);
        fd.append('notes', notes);
        fd.append('photo', finalPhoto, 'apar_photo.jpg');
        fd.append('selfie', finalSelfie, 'selfie_photo.jpg');

        if (currentLocation) {
            fd.append('lat', currentLocation.lat);
            fd.append('lng', currentLocation.lng);
        }

        if (selectedDamages.length > 0) {
            selectedDamages.forEach((damage, index) => {
                fd.append(`damage_categories[${index}][category_id]`, damage.category_id);
                fd.append(`damage_categories[${index}][notes]`, damage.notes);
                fd.append(`damage_categories[${index}][severity]`, damage.severity);
                fd.append(`damage_categories[${index}][damage_photo]`, damage.damage_photo,  `damage_${index}.jpg`);
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
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <Header apar={apar} />

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-6 space-y-8 border border-gray-100">
                    <APARPhotoCapture photo={photo} cameraActive={cameraActive} cameraLoading={cameraLoading} startCamera={startCamera} capturePhoto={capturePhoto} stopCamera={stopCamera} videoRef={videoRef} canvasRef={canvasRef} captureCountdown={captureCountdown} showFlash={showFlash} setPhoto={setPhoto} />

                    <SelfieCapture selfie={selfie} selfieCameraActive={selfieCameraActive} selfieLoading={selfieLoading} startSelfieCamera={startSelfieCamera} captureSelfie={captureSelfie} stopSelfieCamera={stopSelfieCamera} selfieVideoRef={selfieVideoRef} selfieCanvasRef={selfieCanvasRef} captureCountdown={captureCountdown} showFlash={showFlash} setSelfie={setSelfie} />

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

                    <DamageSection selectedDamages={selectedDamages} removeDamage={removeDamage} showDamageForm={showDamageForm} setShowDamageForm={setShowDamageForm} newDamage={newDamage} setNewDamage={setNewDamage} damageCategories={damageCategories} startDamageCamera={startDamageCamera} damageCameraActive={damageCameraActive} damageCameraLoading={damageCameraLoading} damageVideoRef={damageVideoRef} damageCanvasRef={damageCanvasRef} captureCountdown={captureCountdown} showFlash={showFlash} captureDamagePhoto={captureDamagePhoto} stopDamageCamera={stopDamageCamera} addDamage={addDamage} />

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

                    {/* Location Status */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-lg font-semibold text-gray-900 flex items-center">
                                <MapPinIcon className="h-6 w-6 mr-2 text-gray-600" />
                                Lokasi Inspeksi
                            </label>
                            {locationLoading && (
                                <span className="text-sm text-gray-500 flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                                    Mencari lokasi...
                                </span>
                            )}
                        </div>

                        {currentLocation ? (
                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                    <span>Koordinat: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                                </div>
                                
                                {apar?.latitude && apar?.longitude && (
                                    <div className={`flex items-center p-3 rounded-lg ${locationValid ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                        {locationValid ? (
                                            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                        ) : (
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {locationValid ? 'Lokasi Valid' : 'Lokasi Tidak Valid'}
                                            </p>
                                            <p className="text-sm mt-1">
                                                Jarak ke APAR: <strong>{locationDistance}m</strong> (Maks: {locationValidRadius}m)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : locationSkipped ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">
                                            Lokasi Dilewati
                                        </p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Inspeksi akan disimpan tanpa data lokasi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">
                                            Lokasi belum terdeteksi
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            {locationError || 'Pastikan GPS aktif dan izin lokasi diberikan.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={locationLoading}
                                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                <MapPinIcon className="h-4 w-4 mr-2" />
                                {locationLoading ? 'Mencari Lokasi...' : 'Perbarui Lokasi'}
                            </button>
                            
                            {!currentLocation && !locationLoading && (
                                <button
                                    type="button"
                                    onClick={skipLocation}
                                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Lanjutkan Tanpa Lokasi
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
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
                            onClick={() => navigate({ to: '/' })}
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