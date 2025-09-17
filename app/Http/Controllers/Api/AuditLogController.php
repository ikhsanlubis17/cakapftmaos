<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InspectionLog;
use App\Models\Inspection;
use App\Models\User;
use App\Models\Apar;
use Carbon\Carbon;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs
     */
    public function index(Request $request)
    {
        $query = InspectionLog::with(['user', 'apar.aparType', 'inspection']);

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by APAR
        if ($request->has('apar_id')) {
            $query->where('apar_id', $request->apar_id);
        }

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by success status
        if ($request->has('is_successful')) {
            $query->where('is_successful', $request->is_successful);
        }

        // Search by IP address
        if ($request->has('ip_address')) {
            $query->where('ip_address', 'like', '%' . $request->ip_address . '%');
        }

        // Search by user name
        if ($request->has('user_name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->user_name . '%');
            });
        }

        // Search by APAR serial number
        if ($request->has('apar_serial')) {
            $query->whereHas('apar', function ($q) use ($request) {
                $q->where('serial_number', 'like', '%' . $request->apar_serial . '%');
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
                     ->paginate($request->get('per_page', 20));

        return response()->json($logs);
    }

    /**
     * Display the specified audit log
     */
    public function show(InspectionLog $auditLog)
    {
        $auditLog->load(['user', 'apar', 'inspection']);
        
        // Get location name from coordinates if available
        $locationName = null;
        if ($auditLog->lat && $auditLog->lng) {
            $locationName = $this->getLocationName($auditLog->lat, $auditLog->lng);
        }

        // Parse device info
        $deviceInfo = $auditLog->device_info ?? [];
        
        return response()->json([
            'log' => $auditLog,
            'location_name' => $locationName,
            'device_details' => $this->parseDeviceInfo($auditLog->user_agent, $deviceInfo),
        ]);
    }

    /**
     * Get audit log statistics
     */
    public function stats(Request $request)
    {
        $query = InspectionLog::query();

        // Apply date filter if provided
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $stats = [
            'total_logs' => $query->count(),
            'successful_logs' => $query->where('is_successful', true)->count(),
            'failed_logs' => $query->where('is_successful', false)->count(),
            'unique_users' => $query->distinct('user_id')->count('user_id'),
            'unique_apars' => $query->distinct('apar_id')->count('apar_id'),
            'actions_breakdown' => $query->selectRaw('action, COUNT(*) as count')
                                       ->groupBy('action')
                                       ->get(),
            'recent_activity' => InspectionLog::with(['user', 'apar.aparType'])
                                            ->orderBy('created_at', 'desc')
                                            ->limit(10)
                                            ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Export audit logs
     */
    public function export(Request $request)
    {
        $query = InspectionLog::with(['user', 'apar.aparType']);

        // Apply filters
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('apar_id')) {
            $query->where('apar_id', $request->apar_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by success status
        if ($request->has('is_successful')) {
            $query->where('is_successful', $request->is_successful);
        }

        // Search by IP address
        if ($request->has('ip_address')) {
            $query->where('ip_address', 'like', '%' . $request->ip_address . '%');
        }

        // Search by user name
        if ($request->has('user_name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->user_name . '%');
            });
        }

        // Search by APAR serial number
        if ($request->has('apar_serial')) {
            $query->whereHas('apar', function ($q) use ($request) {
                $q->where('serial_number', 'like', '%' . $request->apar_serial . '%');
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        // Transform data for export
        $exportData = $logs->map(function ($log) {
            return [
                'ID' => $log->id,
                'Waktu' => $log->created_at->format('Y-m-d H:i:s'),
                'Teknisi' => $log->user->name ?? 'N/A',
                'APAR' => $log->apar->serial_number ?? 'N/A',
                'Lokasi APAR' => $log->apar->location_name ?? 'N/A',
                'Aksi' => $this->getActionLabel($log->action),
                'IP Address' => $log->ip_address,
                'Latitude' => $log->lat,
                'Longitude' => $log->lng,
                'Device Info' => json_encode($log->device_info),
                'User Agent' => $log->user_agent,
                'Status' => $log->is_successful ? 'Berhasil' : 'Gagal',
                'Detail' => $log->details,
            ];
        });

        return response()->json([
            'data' => $exportData,
            'filename' => 'audit_logs_' . now()->format('Y-m-d_H-i-s') . '.json',
            'metadata' => [
                'total_records' => count($exportData),
                'exported_at' => now()->format('Y-m-d H:i:s'),
                'filters_applied' => $request->all(),
                'period' => 'All time',
            ]
        ], 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Get audit log anomalies
     */
    public function anomalies(Request $request)
    {
        $anomalies = [];
        
        // Get recent inspections for anomaly detection
        $recentInspections = InspectionLog::with(['user', 'apar.aparType'])
            ->where('action', 'submit_inspection')
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($recentInspections as $inspection) {
            // Check for fast inspection (less than 2 minutes between start and submit)
            $startInspection = InspectionLog::where('apar_id', $inspection->apar_id)
                ->where('user_id', $inspection->user_id)
                ->where('action', 'start_inspection')
                ->where('created_at', '<=', $inspection->created_at)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($startInspection) {
                $timeDiff = $inspection->created_at->diffInSeconds($startInspection->created_at);
                
                if ($timeDiff < 120) { // Less than 2 minutes
                    $anomalies[] = [
                        'type' => 'fast_inspection',
                        'description' => "Inspeksi dilakukan terlalu cepat ({$timeDiff} detik)",
                        'user_name' => $inspection->user->name ?? 'N/A',
                        'apar_serial' => $inspection->apar->serial_number ?? 'N/A',
                        'created_at' => $inspection->created_at,
                        'ip_address' => $inspection->ip_address,
                        'severity' => 'high',
                    ];
                }
            }

            // Check for off-hours inspection (outside 6 AM - 10 PM)
            $hour = $inspection->created_at->hour;
            if ($hour < 6 || $hour > 22) {
                $anomalies[] = [
                    'type' => 'off_hours',
                    'description' => "Inspeksi dilakukan di luar jam kerja ({$hour}:00)",
                    'user_name' => $inspection->user->name ?? 'N/A',
                    'apar_serial' => $inspection->apar->serial_number ?? 'N/A',
                    'created_at' => $inspection->created_at,
                    'ip_address' => $inspection->ip_address,
                    'severity' => 'medium',
                ];
            }
        }

        // Check for duplicate photos (same hash)
        $inspections = Inspection::with(['user', 'apar.aparType'])
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        $photoHashes = [];
        foreach ($inspections as $inspection) {
            if ($inspection->photo_url) {
                $photoPath = str_replace('/storage/', '', $inspection->photo_url);
                $fullPath = storage_path('app/public/' . $photoPath);
                
                if (file_exists($fullPath)) {
                    $hash = md5_file($fullPath);
                    
                    if (isset($photoHashes[$hash])) {
                        $anomalies[] = [
                            'type' => 'duplicate_photo',
                            'description' => 'Foto yang sama digunakan untuk inspeksi berbeda',
                            'user_name' => $inspection->user->name ?? 'N/A',
                            'apar_serial' => $inspection->apar->serial_number ?? 'N/A',
                            'created_at' => $inspection->created_at,
                            'ip_address' => 'N/A',
                            'severity' => 'high',
                        ];
                    } else {
                        $photoHashes[$hash] = $inspection->id;
                    }
                }
            }
        }

        // Sort by severity and date
        usort($anomalies, function ($a, $b) {
            $severityOrder = ['high' => 3, 'medium' => 2, 'low' => 1];
            $severityDiff = $severityOrder[$b['severity']] - $severityOrder[$a['severity']];
            
            if ($severityDiff !== 0) {
                return $severityDiff;
            }
            
            return $b['created_at']->timestamp - $a['created_at']->timestamp;
        });

        return response()->json($anomalies);
    }

    /**
     * Clean up old audit logs
     */
    public function cleanup(Request $request)
    {
        try {
            $days = $request->get('days', 90); // Default 90 days
            $cutoffDate = now()->subDays($days);
            
            // Count logs to be deleted
            $logsToDelete = InspectionLog::where('created_at', '<', $cutoffDate)->count();
            
            // Delete old logs
            $deletedCount = InspectionLog::where('created_at', '<', $cutoffDate)->delete();
            
            return response()->json([
                'message' => "Berhasil menghapus {$deletedCount} audit log yang lebih dari {$days} hari",
                'deleted_count' => $deletedCount,
                'cutoff_date' => $cutoffDate->format('Y-m-d H:i:s'),
                'logs_to_delete' => $logsToDelete,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membersihkan audit log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cleanup statistics
     */
    public function cleanupStats()
    {
        try {
            $stats = [
                'total_logs' => InspectionLog::count(),
                'logs_older_than_30_days' => InspectionLog::where('created_at', '<', now()->subDays(30))->count(),
                'logs_older_than_60_days' => InspectionLog::where('created_at', '<', now()->subDays(60))->count(),
                'logs_older_than_90_days' => InspectionLog::where('created_at', '<', now()->subDays(90))->count(),
                'logs_older_than_180_days' => InspectionLog::where('created_at', '<', now()->subDays(180))->count(),
                'oldest_log' => InspectionLog::min('created_at'),
                'newest_log' => InspectionLog::max('created_at'),
            ];
            
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mendapatkan statistik cleanup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get location name from coordinates (placeholder - in real app, use geocoding service)
     */
    private function getLocationName($lat, $lng)
    {
        // In a real application, you would use a geocoding service like Google Maps API
        // For now, return coordinates as location name with better formatting
        return "Koordinat: {$lat}, {$lng}";
    }

    /**
     * Parse device information from user agent
     */
    private function parseDeviceInfo($userAgent, $deviceInfo)
    {
        $parsed = [
            'browser' => 'Unknown',
            'os' => 'Unknown',
            'device_type' => 'Unknown',
            'raw_user_agent' => $userAgent,
        ];

        // Parse browser
        if (strpos($userAgent, 'Chrome') !== false) {
            $parsed['browser'] = 'Chrome';
        } elseif (strpos($userAgent, 'Firefox') !== false) {
            $parsed['browser'] = 'Firefox';
        } elseif (strpos($userAgent, 'Safari') !== false) {
            $parsed['browser'] = 'Safari';
        } elseif (strpos($userAgent, 'Edge') !== false) {
            $parsed['browser'] = 'Edge';
        } elseif (strpos($userAgent, 'Opera') !== false) {
            $parsed['browser'] = 'Opera';
        } elseif (strpos($userAgent, 'MSIE') !== false) {
            $parsed['browser'] = 'Internet Explorer';
        }

        // Parse OS
        if (strpos($userAgent, 'Windows') !== false) {
            $parsed['os'] = 'Windows';
        } elseif (strpos($userAgent, 'Mac') !== false) {
            $parsed['os'] = 'macOS';
        } elseif (strpos($userAgent, 'Linux') !== false) {
            $parsed['os'] = 'Linux';
        } elseif (strpos($userAgent, 'Android') !== false) {
            $parsed['os'] = 'Android';
        } elseif (strpos($userAgent, 'iOS') !== false) {
            $parsed['os'] = 'iOS';
        }

        // Parse device type
        if (strpos($userAgent, 'Mobile') !== false) {
            $parsed['device_type'] = 'Mobile';
        } elseif (strpos($userAgent, 'Tablet') !== false) {
            $parsed['device_type'] = 'Tablet';
        } else {
            $parsed['device_type'] = 'Desktop';
        }

        // Merge with stored device info
        if (is_array($deviceInfo)) {
            $parsed = array_merge($parsed, $deviceInfo);
        }

        return $parsed;
    }

    /**
     * Get human readable action label
     */
    private function getActionLabel($action)
    {
        $labels = [
            'scan_qr' => 'Scan QR Code',
            'start_inspection' => 'Mulai Inspeksi',
            'submit_inspection' => 'Submit Inspeksi',
            'validation_failed' => 'Validasi Gagal',
        ];

        return $labels[$action] ?? $action;
    }
} 