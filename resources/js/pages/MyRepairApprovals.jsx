import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { usePusher, useRepairApprovalUpdates } from '../hooks/usePusher';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    FireIcon,
    MapPinIcon,
    UserIcon,
    WrenchScrewdriverIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    SignalIcon,
} from '@heroicons/react/24/outline';

const MyRepairApprovals = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasShownInitialAlert, setHasShownInitialAlert] = useState(false);
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();

    // Pusher connection for real-time updates
    const { isConnected: pusherConnected, error: pusherError } = usePusher({
        appKey: 'your-pusher-key', // Replace with your actual Pusher key
        cluster: 'ap1', // Replace with your actual cluster
        onMessage: (data) => {
            console.log('Real-time update received:', data);
            // Refresh data immediately when status changes
            fetchMyApprovals(true);
            showSuccess(`Status perbaikan APAR ${data.apar_serial} telah berubah: ${data.message}`);
        }
    });

    // Listen for repair approval updates
    useRepairApprovalUpdates((updateData) => {
        console.log('Repair approval update received:', updateData);
        // Refresh data immediately
        fetchMyApprovals(true);
    });

    // Auto-refresh interval (reduced to 15 seconds for better responsiveness)
    const AUTO_REFRESH_INTERVAL = 15000;

    useEffect(() => {
        fetchMyApprovals();
        setIsInitialized(true);
        
        // Set up auto-refresh interval
        const intervalId = setInterval(() => {
            console.log('Auto-refreshing repair approvals...');
            fetchMyApprovals(true); // Silent refresh
        }, AUTO_REFRESH_INTERVAL);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, []); // Remove filter dependency to prevent unnecessary re-renders

    // Separate effect for filter changes - but only after initial load
    useEffect(() => {
        if (isInitialized && approvals.length > 0) { // Only fetch if component is already initialized and has data
            fetchMyApprovals();
        }
    }, [filter, isInitialized]);

    const fetchMyApprovals = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            
            const url = filter === 'all' ? '/api/repair-approvals' : `/api/repair-approvals?status=${filter}`;
            console.log('Fetching repair approvals from:', url);
            
            const response = await axios.get(url);
            console.log('API Response:', response.data);
            
            if (response.data && response.data.data) {
                // Filter only approvals for current user
                const currentUser = JSON.parse(localStorage.getItem('user'));
                const myApprovals = response.data.data.filter(approval => 
                    approval.inspection?.user?.id === currentUser?.id
                );
                
                console.log('Filtered approvals for user:', myApprovals.length);
                console.log('User ID from localStorage:', currentUser?.id);
                
                // Check for status changes and prepare notification message
                let statusChangeMessage = '';
                if (!silent && approvals.length > 0) {
                    const statusChanges = [];
                    myApprovals.forEach(newApproval => {
                        const oldApproval = approvals.find(old => old.id === newApproval.id);
                        if (oldApproval && oldApproval.status !== newApproval.status) {
                            const statusText = {
                                'pending': 'Menunggu',
                                'approved': 'Disetujui',
                                'rejected': 'Ditolak',
                                'completed': 'Selesai'
                            };
                            
                            statusChanges.push(`APAR ${newApproval.inspection?.apar?.serial_number}: ${statusText[newApproval.status] || newApproval.status}`);
                        }
                    });
                    
                    if (statusChanges.length > 0) {
                        statusChangeMessage = `Status berubah: ${statusChanges.join(', ')}. `;
                    }
                }
                
                setApprovals(myApprovals);
                setLastUpdate(new Date());
                
                // Show combined success message
                if (!silent && !refreshing && isInitialized && !hasShownInitialAlert) {
                    const message = statusChangeMessage + `Berhasil memuat ${myApprovals.length} data perbaikan`;
                    showSuccess(message);
                    setHasShownInitialAlert(true);
                }
            } else {
                console.warn('No data property in response:', response.data);
                setApprovals([]);
            }
        } catch (error) {
            console.error('Error fetching repair approvals:', error);
            if (!silent) {
                showError('Gagal memuat daftar perbaikan');
            }
            setApprovals([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter, showError, showSuccess]);

    // Manual refresh function
    const handleManualRefresh = async () => {
        if (refreshing) return; // Prevent multiple simultaneous refreshes
        setRefreshing(true);
        setHasShownInitialAlert(false); // Reset flag to allow showing refresh alert
        await fetchMyApprovals();
    };

    // Get current user ID safely
    const getCurrentUserId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.id;
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            return null;
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Menunggu' },
            approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Disetujui' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Ditolak' },
            completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, text: 'Selesai' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const getConditionBadge = (condition) => {
        const conditionConfig = {
            good: { color: 'bg-green-100 text-green-800', text: 'Baik' },
            needs_repair: { color: 'bg-yellow-100 text-yellow-800', text: 'Perlu Perbaikan' }
        };

        const config = conditionConfig[condition] || conditionConfig.good;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getActionButton = (approval) => {
        switch (approval.status) {
            case 'pending':
                return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-yellow-800">
                            <ClockIcon className="h-5 w-5" />
                            <span className="font-medium">Menunggu Persetujuan Admin</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                            Permintaan perbaikan sedang ditinjau oleh admin
                        </p>
                    </div>
                );
            
            case 'approved':
                return (
                    <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2 text-green-800">
                                <CheckCircleIcon className="h-5 w-5" />
                                <span className="font-medium">Perbaikan Disetujui</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                                Silakan lakukan perbaikan dan kirim laporan
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/repair-report/${approval.id}`)}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                        >
                            <WrenchScrewdriverIcon className="h-5 w-5" />
                            <span>Kirim Laporan Perbaikan</span>
                        </button>
                    </div>
                );
            
            case 'rejected':
                return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-red-800">
                            <XCircleIcon className="h-5 w-5" />
                            <span className="font-medium">Perbaikan Ditolak</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                            {approval.admin_notes || 'Perbaikan tidak disetujui oleh admin'}
                        </p>
                    </div>
                );
            
            case 'completed':
                return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-blue-800">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="font-medium">Perbaikan Selesai</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                            APAR telah diperbaiki dan siap digunakan
                        </p>
                    </div>
                );
            
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Perbaikan APAR Saya</h1>
                                <p className="text-gray-600">Kelola dan pantau status perbaikan APAR yang Anda lakukan</p>
                                {lastUpdate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {/* Pusher Status Indicator */}
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${pusherConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-600">
                                    {pusherConnected ? 'Real-time Aktif' : 'Real-time Offline'}
                                </span>
                            </div>
                            
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Memperbarui...' : 'Perbarui'}
                            </button>
                            <div className="text-xs text-gray-500 text-center">
                                <div>Auto-refresh setiap</div>
                                <div className="font-medium">{AUTO_REFRESH_INTERVAL / 1000}s</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">Filter Status:</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                            <option value="completed">Selesai</option>
                        </select>
                    </div>
                </div>

                {/* Approvals List */}
                <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Daftar Perbaikan ({approvals.length})
                        </h3>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {approvals.map((approval) => (
                            <div key={approval.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                APAR {approval.inspection?.apar?.serial_number}
                                            </h4>
                                            {getStatusBadge(approval.status)}
                                            {getConditionBadge(approval.inspection?.condition)}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <MapPinIcon className="h-4 w-4" />
                                                    <span>{approval.inspection?.apar?.location_name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <UserIcon className="h-4 w-4" />
                                                    <span>Anda</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Tanggal Inspeksi:</span>{' '}
                                                    {new Date(approval.inspection?.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {approval.inspection?.notes && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Catatan Inspeksi:</span>{' '}
                                                        {approval.inspection.notes}
                                                    </div>
                                                )}
                                                {approval.admin_notes && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Catatan Admin:</span>{' '}
                                                        {approval.admin_notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Damage Categories */}
                                        {approval.inspection?.inspectionDamages && approval.inspection.inspectionDamages.length > 0 && (
                                            <div className="mb-4">
                                                <h5 className="text-sm font-medium text-gray-700 mb-2">Kategori Kerusakan:</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {approval.inspection.inspectionDamages.map((damage, index) => (
                                                        <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                                            {damage.damageCategory?.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Section */}
                                        {getActionButton(approval)}
                                    </div>

                                    <div className="ml-4">
                                        <button
                                            onClick={() => navigate(`/repair-approvals/${approval.id}`)}
                                            className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                                            title="Lihat Detail"
                                        >
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {approvals.length === 0 && (
                        <div className="text-center py-12">
                            <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada perbaikan</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {filter === 'all' 
                                    ? 'Belum ada permintaan perbaikan APAR' 
                                    : `Tidak ada perbaikan dengan status "${filter}"`
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <div className="text-blue-600 text-lg">💡</div>
                        <div className="text-sm text-blue-800">
                            <div className="font-medium mb-1">Panduan Status Perbaikan:</div>
                            <ul className="space-y-1">
                                <li>• <strong>Menunggu:</strong> Permintaan sedang ditinjau admin</li>
                                <li>• <strong>Disetujui:</strong> Anda dapat melakukan perbaikan</li>
                                <li>• <strong>Ditolak:</strong> Perbaikan tidak disetujui dengan alasan tertentu</li>
                                <li>• <strong>Selesai:</strong> Perbaikan telah selesai dan dilaporkan</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyRepairApprovals;
