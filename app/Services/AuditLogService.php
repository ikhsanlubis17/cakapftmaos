<?php

namespace App\Services;

use App\Models\InspectionLog;
use App\Models\Inspection;
use App\Models\User;
use App\Models\Apar;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AuditLogService
{
    /**
     * Get audit logs with filters
     */
    public function getAuditLogs(array $filters): \Illuminate\Database\Eloquent\Collection
    {
        $query = InspectionLog::with(['apar', 'user', 'inspection'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['apar_id'])) {
            $query->where('apar_id', $filters['apar_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['is_successful'])) {
            $query->where('is_successful', $filters['is_successful'] === 'true');
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        return $query->get();
    }

    /**
     * Get audit log statistics
     */
    public function getAuditLogStats(array $filters): array
    {
        $query = InspectionLog::query();

        // Apply date filters
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        $total = $query->count();
        $successful = (clone $query)->where('is_successful', true)->count();
        $failed = (clone $query)->where('is_successful', false)->count();

        $byAction = (clone $query)
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->pluck('count', 'action')
            ->toArray();

        $byUser = (clone $query)
            ->selectRaw('user_id, COUNT(*) as count')
            ->groupBy('user_id')
            ->with('user')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->user?->name ?? 'Unknown' => $item->count];
            })
            ->toArray();

        return [
            'total' => $total,
            'successful' => $successful,
            'failed' => $failed,
            'success_rate' => $total > 0 ? round(($successful / $total) * 100, 2) : 0,
            'by_action' => $byAction,
            'by_user' => $byUser,
        ];
    }

    /**
     * Export audit logs
     */
    public function exportAuditLogs(array $filters): array
    {
        $logs = $this->getAuditLogs($filters);

        $exportData = $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'timestamp' => $log->created_at->toIso8601String(),
                'user' => $log->user?->name ?? 'Unknown',
                'user_email' => $log->user?->email ?? 'N/A',
                'apar' => $log->apar?->serial_number ?? 'N/A',
                'action' => $this->getActionLabel($log->action),
                'success' => $log->is_successful ? 'Yes' : 'No',
                'details' => $log->details,
                'ip_address' => $log->ip_address,
                'location' => $log->lat && $log->lng ? "{$log->lat}, {$log->lng}" : 'N/A',
                'device' => $this->formatDeviceInfo($log->device_info),
            ];
        });

        return $exportData->toArray();
    }

    /**
     * Detect anomalies in audit logs
     */
    public function detectAnomalies(array $filters): array
    {
        $logs = $this->getAuditLogs($filters);
        $anomalies = [];

        // Detect multiple failed attempts
        $failedAttempts = $logs->where('is_successful', false)
            ->groupBy('user_id')
            ->filter(function ($userLogs) {
                return $userLogs->count() >= 3;
            });

        foreach ($failedAttempts as $userId => $userLogs) {
            $user = User::find($userId);
            $anomalies[] = [
                'type' => 'multiple_failed_attempts',
                'severity' => 'high',
                'user' => $user?->name ?? 'Unknown',
                'count' => $userLogs->count(),
                'details' => "User has {$userLogs->count()} failed attempts",
            ];
        }

        // Detect unusual time patterns (inspections outside normal hours)
        $unusualTimes = $logs->filter(function ($log) {
            $hour = Carbon::parse($log->created_at)->hour;
            return $hour < 6 || $hour > 22;
        });

        if ($unusualTimes->count() > 0) {
            $anomalies[] = [
                'type' => 'unusual_time_pattern',
                'severity' => 'medium',
                'count' => $unusualTimes->count(),
                'details' => "{$unusualTimes->count()} actions performed outside normal hours (6 AM - 10 PM)",
            ];
        }

        // Detect suspicious location changes
        $locationChanges = $logs->where('action', 'submit_inspection')
            ->groupBy('user_id')
            ->filter(function ($userLogs) {
                if ($userLogs->count() < 2) {
                    return false;
                }

                $locations = $userLogs->filter(function ($log) {
                    return $log->lat && $log->lng;
                });

                if ($locations->count() < 2) {
                    return false;
                }

                // Check for rapid location changes (more than 100km in less than 1 hour)
                $sorted = $locations->sortBy('created_at');
                $previous = null;

                foreach ($sorted as $log) {
                    if ($previous) {
                        $distance = $this->calculateDistance(
                            $previous->lat,
                            $previous->lng,
                            $log->lat,
                            $log->lng
                        );

                        $timeDiff = Carbon::parse($log->created_at)->diffInMinutes(Carbon::parse($previous->created_at));

                        if ($distance > 100000 && $timeDiff < 60) {
                            return true;
                        }
                    }
                    $previous = $log;
                }

                return false;
            });

        foreach ($locationChanges as $userId => $userLogs) {
            $user = User::find($userId);
            $anomalies[] = [
                'type' => 'suspicious_location_change',
                'severity' => 'critical',
                'user' => $user?->name ?? 'Unknown',
                'details' => 'Rapid location changes detected (>100km in <1 hour)',
            ];
        }

        return $anomalies;
    }

    /**
     * Clean up old audit logs
     */
    public function cleanupOldLogs(int $daysToKeep): array
    {
        $cutoffDate = Carbon::now()->subDays($daysToKeep);

        $count = InspectionLog::where('created_at', '<', $cutoffDate)->count();
        InspectionLog::where('created_at', '<', $cutoffDate)->delete();

        Log::info("Cleaned up {$count} audit logs older than {$daysToKeep} days");

        return [
            'deleted_count' => $count,
            'cutoff_date' => $cutoffDate->toDateString(),
        ];
    }

    /**
     * Get cleanup statistics
     */
    public function getCleanupStats(): array
    {
        $total = InspectionLog::count();
        $last30Days = InspectionLog::where('created_at', '>=', Carbon::now()->subDays(30))->count();
        $last90Days = InspectionLog::where('created_at', '>=', Carbon::now()->subDays(90))->count();
        $older = $total - $last90Days;

        return [
            'total' => $total,
            'last_30_days' => $last30Days,
            'last_90_days' => $last90Days,
            'older_than_90_days' => $older,
        ];
    }

    /**
     * Parse device information
     */
    public function parseDeviceInfo(?string $userAgent, ?array $deviceInfo): array
    {
        if ($deviceInfo) {
            return $deviceInfo;
        }

        if (!$userAgent) {
            return [
                'browser' => 'Unknown',
                'platform' => 'Unknown',
            ];
        }

        $browser = 'Unknown';
        $platform = 'Unknown';

        // Parse browser
        if (strpos($userAgent, 'Firefox') !== false) {
            $browser = 'Firefox';
        } elseif (strpos($userAgent, 'Chrome') !== false) {
            $browser = 'Chrome';
        } elseif (strpos($userAgent, 'Safari') !== false) {
            $browser = 'Safari';
        } elseif (strpos($userAgent, 'Opera') !== false) {
            $browser = 'Opera';
        } elseif (strpos($userAgent, 'MSIE') !== false || strpos($userAgent, 'Trident') !== false) {
            $browser = 'Internet Explorer';
        }

        // Parse platform
        if (strpos($userAgent, 'Mac') !== false) {
            $platform = 'Mac';
        } elseif (strpos($userAgent, 'Windows') !== false) {
            $platform = 'Windows';
        } elseif (strpos($userAgent, 'Linux') !== false) {
            $platform = 'Linux';
        } elseif (strpos($userAgent, 'Android') !== false) {
            $platform = 'Android';
        } elseif (strpos($userAgent, 'iOS') !== false || strpos($userAgent, 'iPhone') !== false || strpos($userAgent, 'iPad') !== false) {
            $platform = 'iOS';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
        ];
    }

    /**
     * Get human readable action label
     */
    public function getActionLabel(string $action): string
    {
        $labels = [
            'start_inspection' => 'Mulai Inspeksi',
            'submit_inspection' => 'Submit Inspeksi',
            'validation_failed' => 'Validasi Gagal',
            'update_inspection' => 'Update Inspeksi',
            'delete_inspection' => 'Hapus Inspeksi',
            'view_inspection' => 'Lihat Inspeksi',
        ];

        return $labels[$action] ?? ucfirst(str_replace('_', ' ', $action));
    }

    /**
     * Format device info for display
     */
    protected function formatDeviceInfo(?array $deviceInfo): string
    {
        if (!$deviceInfo) {
            return 'Unknown';
        }

        $browser = $deviceInfo['browser'] ?? 'Unknown';
        $platform = $deviceInfo['platform'] ?? 'Unknown';

        return "{$browser} on {$platform}";
    }

    /**
     * Calculate distance between two coordinates
     */
    protected function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
