<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\Apar;
use App\Models\InspectionLog;
use App\Models\InspectionSchedule;
use App\Models\InspectionDamage;
use App\Models\RepairApproval;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class InspectionService
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Validate inspection time to prevent manipulation
     */
    public function validateInspectionTime(string $aparQrCode, int $userId): array
    {
        $apar = Apar::where('qr_code', $aparQrCode)->first();
        if (!$apar) {
            return [
                'valid' => false,
                'message' => 'QR tidak valid.',
                'status_code' => 200, // Return 200 to avoid console errors
            ];
        }

        $aparId = $apar->id;
        $appTimezone = config('app.timezone', 'Asia/Jakarta');

        // Calculate day range in Application Timezone (Local)
        // We use strings to ensure the query matches the raw DB values (which are stored in Local time)
        // avoiding automatic UTC conversion by Laravel/PDO.
        $nowLocal = now($appTimezone);
        $startOfDayLocal = $nowLocal->copy()->startOfDay()->toDateTimeString();
        $endOfDayLocal = $nowLocal->copy()->endOfDay()->toDateTimeString();

        // 1. Find ANY valid schedule for this APAR today
        $schedule = InspectionSchedule::where('apar_id', $aparId)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->whereBetween('start_at', [$startOfDayLocal, $endOfDayLocal])
            ->orderBy('start_at')
            ->first();

        if (!$schedule) {
            $user = User::find($userId);
            if ($user && ($user->isAdmin() || $user->isSupervisor())) {
                return [
                    'valid' => true,
                    'message' => 'Inspeksi darurat (tanpa jadwal) diizinkan untuk Admin/Supervisor',
                    'schedule' => null,
                    'status_code' => 200,
                ];
            }

            return [
                'valid' => false,
                'message' => 'Tidak ada jadwal aktif untuk APAR ini hari ini.',
                'status_code' => 200,
            ];
        }

        // 2. Check Authorization
        $user = User::find($userId);
        $isAssigned = $schedule->assigned_user_id === $userId;
        $canOverride = $user && ($user->isAdmin() || $user->isSupervisor());

        if (!$isAssigned && !$canOverride) {
            $assignedUser = User::find($schedule->assigned_user_id);
            $assignedName = $assignedUser ? $assignedUser->name : 'Teknisi Lain';

            return [
                'valid' => false,
                'message' => "Jadwal ini ditugaskan kepada {$assignedName}. Login sebagai user tersebut untuk melakukan inspeksi.",
                'status_code' => 200,
            ];
        }

        // Return schedule info
        // Note: startAtUtc/endAtUtc methods in model might need check if they double-convert, 
        // but for now we focus on the query finding the schedule.
        return [
            'valid' => true,
            'message' => 'QR Code valid dan jadwal sesuai',
            'schedule' => [
                'id' => $schedule->id,
                'scheduled_date' => $schedule->scheduled_date,
                'scheduled_time' => $schedule->scheduled_time ? substr($schedule->scheduled_time, 0, 5) : null,
                'start_at' => optional($schedule->start_at)->toIso8601String(),
                'end_at' => optional($schedule->end_at)->toIso8601String(),
            ],
            'status_code' => 200,
        ];
    }

    /**
     * Validate location for static APARs
     */
    public function validateLocation(Apar $apar, ?float $lat, ?float $lng): array
    {
        // Mobile APARs don't require location validation
        if ($apar->location_type !== 'statis') {
            return [
                'valid' => true,
                'message' => 'APAR mobile tidak memerlukan validasi lokasi',
            ];
        }

        // Allow null coordinates (user skipped location)
        // This is acceptable for development/testing or when GPS is unavailable
        if (!$lat || !$lng) {
            Log::warning('Inspection submitted without location data', [
                'apar_id' => $apar->id,
                'apar_serial' => $apar->serial_number,
                'location_type' => $apar->location_type,
                'reason' => 'User skipped location or GPS unavailable'
            ]);

            return [
                'valid' => true, // Changed from false to true
                'message' => 'Lokasi dilewati - inspeksi dilanjutkan tanpa validasi lokasi',
                'skipped' => true,
            ];
        }

        // Validate location if coordinates are provided
        $isValid = $apar->isWithinValidRadius($lat, $lng);

        if (!$isValid) {
            $distance = $apar->distanceFrom($lat, $lng);
            return [
                'valid' => false,
                'message' => "Anda berada {$distance} meter dari APAR. Maksimal {$apar->valid_radius} meter.",
                'distance' => $distance,
                'valid_radius' => $apar->valid_radius,
                'apar_location' => [
                    'lat' => $apar->latitude,
                    'lng' => $apar->longitude,
                ],
                'user_location' => [
                    'lat' => $lat,
                    'lng' => $lng,
                ],
            ];
        }

        return [
            'valid' => true,
            'message' => 'Lokasi valid',
        ];
    }

    /**
     * Process inspection submission
     */
    public function createInspection(array $data, int $userId): array
    {
        $apar = Apar::findOrFail($data['apar_id']);

        // Log inspection start
        $this->logInspectionAction($apar->id, $userId, 'start_inspection', $data['lat'] ?? null, $data['lng'] ?? null, true, 'Inspection started');

        // Validate location
        $locationValidation = $this->validateLocation($apar, $data['lat'] ?? null, $data['lng'] ?? null);

        if (!$locationValidation['valid']) {
            // Log validation failure
            $this->logInspectionAction(
                $apar->id,
                $userId,
                'validation_failed',
                $data['lat'] ?? null,
                $data['lng'] ?? null,
                false,
                'Location validation failed: ' . $locationValidation['message']
            );

            return [
                'success' => false,
                'message' => 'Lokasi tidak valid',
                'error' => $locationValidation['message'],
                'location_valid' => false,
                'data' => $locationValidation,
                'status_code' => 422,
            ];
        }

        // Store photos with compression
        $photoConfig = config('inspection.photo');
        $selfieConfig = config('inspection.selfie');

        $photoPath = $this->imageService->compressImage(
            $data['photo'],
            'inspections/photos',
            $photoConfig['compression_quality'],
            $photoConfig['max_width'],
            $photoConfig['max_height']
        );

        $selfiePath = $this->imageService->compressImage(
            $data['selfie'],
            'inspections/selfies',
            $selfieConfig['compression_quality'],
            $selfieConfig['max_width'],
            $selfieConfig['max_height']
        );

        // Find related schedule
        $schedule = $this->findRelatedSchedule($data, $apar->id, $userId);

        // Determine if repair is required
        $requiresRepair = $data['condition'] === 'damaged' ||
            (isset($data['damage_categories']) && count($data['damage_categories']) > 0);

        // Create inspection
        $inspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $userId,
            'photo_url' => Storage::url($photoPath),
            'selfie_url' => Storage::url($selfiePath),
            'condition' => $data['condition'],
            'notes' => $data['notes'] ?? null,
            'inspection_lat' => $data['lat'] ?? null,
            'inspection_lng' => $data['lng'] ?? null,
            'location_valid' => true,
            'is_valid' => true,
            'status' => 'completed',
            'schedule_id' => $schedule?->id,
            'repair_status' => $requiresRepair ? 'pending_approval' : 'none',
            'requires_repair' => $requiresRepair,
            'photo_required' => true,
            'selfie_required' => true,
        ]);

        // Log inspection submission
        $this->logInspectionAction(
            $apar->id,
            $userId,
            'submit_inspection',
            $data['lat'] ?? null,
            $data['lng'] ?? null,
            true,
            'Inspection submitted successfully',
            $inspection->id
        );

        // Handle damage categories
        if (isset($data['damage_categories']) && count($data['damage_categories']) > 0) {
            $this->handleDamageCategories($inspection->id, $data['damage_categories']);
        }

        // Create repair approval if needed
        if ($requiresRepair) {
            $this->createRepairApproval($inspection->id);
        }

        // Update APAR status
        $this->updateAparStatus($apar, $data['condition']);

        // Mark schedule as completed
        if ($schedule) {
            $schedule->update(['is_completed' => true]);
        }

        return [
            'success' => true,
            'message' => 'Inspeksi berhasil disimpan',
            'inspection' => $inspection->load(['apar.aparType', 'user']),
            'location_valid' => true,
            'status_code' => 201,
        ];
    }

    /**
     * Handle damage categories
     */
    protected function handleDamageCategories(int $inspectionId, array $damageCategories): void
    {
        $damagePhotoConfig = config('inspection.damage_photo');

        foreach ($damageCategories as $damageData) {
            $damagePhotoPath = $this->imageService->compressImage(
                $damageData['damage_photo'],
                'inspections/damages',
                $damagePhotoConfig['compression_quality'],
                $damagePhotoConfig['max_width'],
                $damagePhotoConfig['max_height']
            );

            $repairPhotoUrl = null;
            if (isset($damageData['repair_photo']) && $damageData['repair_photo']) {
                $repairPhotoPath = $this->imageService->compressImage(
                    $damageData['repair_photo'],
                    'inspections/repairs',
                    $damagePhotoConfig['compression_quality'],
                    $damagePhotoConfig['max_width'],
                    $damagePhotoConfig['max_height']
                );
                $repairPhotoUrl = Storage::url($repairPhotoPath);
            }

            InspectionDamage::create([
                'inspection_id' => $inspectionId,
                'damage_category_id' => $damageData['category_id'],
                'notes' => $damageData['notes'] ?? null,
                'damage_photo_url' => Storage::url($damagePhotoPath),
                'repair_photo_url' => $repairPhotoUrl,
                'severity' => $damageData['severity'],
            ]);
        }
    }

    /**
     * Create repair approval
     */
    protected function createRepairApproval(int $inspectionId): void
    {
        RepairApproval::create([
            'inspection_id' => $inspectionId,
            'status' => 'pending',
        ]);
    }

    /**
     * Update APAR status based on condition
     */
    protected function updateAparStatus(Apar $apar, string $condition): void
    {
        $statusMap = [
            'damaged' => 'needs_repair',
        ];

        if (isset($statusMap[$condition])) {
            $apar->update(['status' => $statusMap[$condition]]);
        }
    }

    /**
     * Find related schedule
     */
    protected function findRelatedSchedule(array $data, int $aparId, int $userId): ?InspectionSchedule
    {
        if (isset($data['schedule_id'])) {
            return InspectionSchedule::where('id', $data['schedule_id'])
                ->where('assigned_user_id', $userId)
                ->where('apar_id', $aparId)
                ->first();
        }

        return InspectionSchedule::where('assigned_user_id', $userId)
            ->where('apar_id', $aparId)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->orderBy('start_at', 'desc')
            ->first();
    }

    /**
     * Log inspection action
     */
    protected function logInspectionAction(
        int $aparId,
        int $userId,
        string $action,
        ?float $lat,
        ?float $lng,
        bool $isSuccessful,
        string $details,
        ?int $inspectionId = null
    ): void {
        InspectionLog::create([
            'apar_id' => $aparId,
            'user_id' => $userId,
            'inspection_id' => $inspectionId,
            'action' => $action,
            'lat' => $lat,
            'lng' => $lng,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'device_info' => $this->getDeviceInfo(),
            'is_successful' => $isSuccessful,
            'details' => $details,
        ]);
    }

    /**
     * Get device information for logging
     */
    protected function getDeviceInfo(): array
    {
        $userAgent = request()->userAgent();
        $browser = 'Unknown';
        $platform = 'Unknown';

        if (strpos($userAgent, 'Firefox') !== false) {
            $browser = 'Firefox';
        } elseif (strpos($userAgent, 'Chrome') !== false) {
            $browser = 'Chrome';
        } elseif (strpos($userAgent, 'Safari') !== false) {
            $browser = 'Safari';
        } elseif (strpos($userAgent, 'Opera') !== false) {
            $browser = 'Opera';
        } elseif (strpos($userAgent, 'MSIE') !== false) {
            $browser = 'Internet Explorer';
        }

        if (strpos($userAgent, 'Mac') !== false) {
            $platform = 'Mac';
        } elseif (strpos($userAgent, 'Windows') !== false) {
            $platform = 'Windows';
        } elseif (strpos($userAgent, 'Linux') !== false) {
            $platform = 'Linux';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
        ];
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    public function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = config('inspection.location.earth_radius_meters');

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
