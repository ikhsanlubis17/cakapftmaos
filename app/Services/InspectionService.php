<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\Apar;
use App\Models\InspectionLog;
use App\Models\InspectionSchedule;
use App\Models\InspectionDamage;
use App\Models\RepairApproval;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InspectionService
{
    protected ImageService $imageService;
    protected ScheduleService $scheduleService;
    protected MobileFraudDetectionService $mobileFraudService;
    protected NotificationService $notificationService;

    public function __construct(
        ImageService $imageService,
        ScheduleService $scheduleService,
        MobileFraudDetectionService $mobileFraudService,
        NotificationService $notificationService
    ) {
        $this->imageService         = $imageService;
        $this->scheduleService      = $scheduleService;
        $this->mobileFraudService   = $mobileFraudService;
        $this->notificationService  = $notificationService;
    }

    /**
     * Validate inspection time to prevent manipulation (supports QR Code or Serial Number)
     */
    public function validateInspectionTime(string $identifier, int $userId): array
    {
        $apar = Apar::where('qr_code', $identifier)
            ->orWhere('serial_number', $identifier)
            ->first();

        if (!$apar) {
            return [
                'valid' => false,
                'message' => 'APAR dengan kode QR atau nomor seri tersebut tidak ditemukan.',
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
                    'apar' => [
                        'id' => $apar->id,
                        'serial_number' => $apar->serial_number,
                        'qr_code' => $apar->qr_code,
                        'location_name' => $apar->location_name,
                        'location_type' => $apar->location_type,
                    ],
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

        // Return schedule and apar info
        return [
            'valid' => true,
            'message' => 'Identifikasi APAR valid dan jadwal sesuai',
            'apar' => [
                'id' => $apar->id,
                'serial_number' => $apar->serial_number,
                'qr_code' => $apar->qr_code,
                'location_name' => $apar->location_name,
                'location_type' => $apar->location_type,
            ],
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
     * Validate location for static APARs and run fraud analysis for mobile APARs.
     *
     * @param  Apar         $apar
     * @param  float|null   $lat
     * @param  float|null   $lng
     * @param  array        $data  Full request data (needed for mobile fraud analysis)
     * @param  int          $userId
     * @return array
     */
    public function validateLocation(Apar $apar, ?float $lat, ?float $lng, array $data = [], int $userId = 0): array
    {
        // ── APAR MOBILE — Lapisan validasi berbasis metadata & foto ────────────
        // Radius GPS statis tidak relevan, gunakan fraud detection service
        if ($apar->location_type !== 'statis') {
            $fraudResult = $this->mobileFraudService->analyze($data, $userId);

            // Hard-block: mock location atau foto verifikasi tidak ada
            if (!$fraudResult['is_valid']) {
                return [
                    'valid'        => false,
                    'is_mobile'    => true,
                    'hard_blocked' => true,
                    'flag_reasons' => $fraudResult['flag_reasons'],
                    'message'      => $fraudResult['message'],
                ];
            }

            // Soft-flag: submit diizinkan tapi ditandai untuk review supervisor
            return [
                'valid'        => true,
                'is_mobile'    => true,
                'is_flagged'   => $fraudResult['is_flagged'],
                'flag_reasons' => $fraudResult['flag_reasons'],
                'message'      => $fraudResult['message'],
            ];
        }

        // ── APAR STATIS — Validasi radius Haversine + cek GPS spoofing ─────────
        // Cek mock location flag dari frontend (untuk APAR statis pun tetap di-block)
        if (!empty($data['is_mock_location'])) {
            Log::warning('Static APAR inspection BLOCKED: mock location detected', [
                'apar_id' => $apar->id,
                'user_id' => $userId,
            ]);
            return [
                'valid'        => false,
                'message'      => 'Fake GPS / Mock Location terdeteksi. Nonaktifkan aplikasi lokasi palsu.',
                'flag_reasons' => ['mock_location_detected'],
                'event_type'   => 'blocked',
            ];
        }

        // Cek GPS accuracy rendah — soft flag (bukan hard block untuk APAR statis)
        $gpsAccuracy = $data['gps_accuracy'] ?? null;
        if ($gpsAccuracy) {
            $accuracyThreshold = (float) Setting::getValue('gps_accuracy_warning_threshold', 100);
            if ($gpsAccuracy > $accuracyThreshold) {
                Log::info('GPS accuracy warning for static APAR inspection', [
                    'apar_id'          => $apar->id,
                    'gps_accuracy'     => $gpsAccuracy,
                    'threshold'        => $accuracyThreshold,
                ]);
                // Tidak memblokir — dicatat saja di log via createInspection
            }
        }

        // Allow null coordinates — GPS unavailable / dilewati user
        if (!$lat || !$lng) {
            Log::warning('Inspection submitted without location data', [
                'apar_id'       => $apar->id,
                'apar_serial'   => $apar->serial_number,
                'location_type' => $apar->location_type,
                'reason'        => 'User skipped location or GPS unavailable',
            ]);

            return [
                'valid'   => true,
                'message' => 'Lokasi dilewati - inspeksi dilanjutkan tanpa validasi lokasi',
                'skipped' => true,
            ];
        }

        // Validasi Haversine radius
        $isValid = $apar->isWithinValidRadius($lat, $lng);

        if (!$isValid) {
            $distance = $apar->distanceFrom($lat, $lng);
            return [
                'valid'        => false,
                'message'      => "Anda berada {$distance} meter dari APAR. Maksimal {$apar->valid_radius} meter.",
                'distance'     => $distance,
                'valid_radius' => $apar->valid_radius,
                'apar_location' => ['lat' => $apar->latitude, 'lng' => $apar->longitude],
                'user_location' => ['lat' => $lat, 'lng' => $lng],
            ];
        }

        return [
            'valid'   => true,
            'message' => 'Lokasi valid',
        ];
    }

    /**
     * Process inspection submission with idempotency check, mobile fraud analysis,
     * GPS spoofing detection, and expired-date cross-validation.
     */
    public function createInspection(array $data, int $userId): array
    {
        $apar = Apar::findOrFail($data['apar_id']);

        // ── Idempotency Check ─────────────────────────────────────────────────
        // Cegah duplikasi inspeksi pada jadwal + APAR + user yang sama
        if (!empty($data['schedule_id'])) {
            $existingInspection = Inspection::where('schedule_id', $data['schedule_id'])
                ->where('apar_id', $apar->id)
                ->where('user_id', $userId)
                ->where('status', 'completed')
                ->first();

            if ($existingInspection) {
                Log::info('Idempotency: inspeksi duplikat terdeteksi, mengembalikan record existing', [
                    'inspection_id' => $existingInspection->id,
                    'schedule_id'   => $data['schedule_id'],
                    'apar_id'       => $apar->id,
                    'user_id'       => $userId,
                ]);
                return [
                    'success'    => true,
                    'message'    => 'Inspeksi untuk jadwal ini sudah ada.',
                    'inspection' => $existingInspection->load(['apar.aparType', 'user']),
                    'location_valid'      => true,
                    'inspection_status'   => $existingInspection->inspection_status,
                    'status_code'         => 200,
                ];
            }
        }

        // Log inspection start
        $this->logInspectionAction(
            $apar->id, $userId, 'start_inspection',
            $data['lat'] ?? null, $data['lng'] ?? null,
            true, 'Inspection started'
        );

        // ── Validasi Lokasi + Fraud Detection ─────────────────────────────────
        $locationValidation = $this->validateLocation(
            $apar,
            $data['lat'] ?? null,
            $data['lng'] ?? null,
            $data,
            $userId
        );

        if (!$locationValidation['valid']) {
            $eventType  = $locationValidation['event_type'] ?? 'blocked';
            $flagReason = implode(',', $locationValidation['flag_reasons'] ?? []);

            // Semua jalur blocked/error masuk audit trail
            $this->logInspectionAction(
                $apar->id, $userId, 'validation_failed',
                $data['lat'] ?? null, $data['lng'] ?? null,
                false,
                'Location/fraud validation failed: ' . $locationValidation['message'],
                null, $eventType, $flagReason ?: null,
                $data['gps_accuracy'] ?? null,
                $data['photo_captured_at'] ?? null
            );

            return [
                'success'        => false,
                'message'        => $locationValidation['hard_blocked'] ?? false ? $locationValidation['message'] : 'Lokasi tidak valid',
                'error'          => $locationValidation['message'],
                'location_valid' => false,
                'data'           => $locationValidation,
                'status_code'    => 422,
            ];
        }

        // ── Simpan foto verifikasi mobile jika ada ────────────────────────────
        $mobileVerificationPhotoUrl = null;
        if (!empty($data['mobile_verification_photo'])) {
            $photoConfig = config('inspection.photo');
            $mvpPath = $this->imageService->compressImage(
                $data['mobile_verification_photo'],
                'inspections/mobile_verifications',
                $photoConfig['compression_quality'],
                $photoConfig['max_width'],
                $photoConfig['max_height']
            );
            $mobileVerificationPhotoUrl = '/storage/' . $mvpPath;
        }

        // ── Store main photos with compression ───────────────────────────────
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

        // Get user to determine inspection_status based on role
        $user = User::find($userId);
        $isAdminOrSupervisor = $user && ($user->isAdmin() || $user->isSupervisor());

        // Tentukan inspection_status awal
        // Inspeksi mobile yang di-flag SELALU pending_review meski oleh Admin/Supervisor
        // agar ada verifikasi manual untuk melindungi integritas data
        $isMobileFlagged = ($locationValidation['is_flagged'] ?? false) && ($locationValidation['is_mobile'] ?? false);
        $inspectionStatus = ($isAdminOrSupervisor && !$isMobileFlagged) ? 'approved' : 'pending_review';

        $repairStatus = 'none';
        if ($requiresRepair) {
            $repairStatus = $isAdminOrSupervisor ? 'approved' : 'pending_approval';
        }

        // ── Validasi silang kondisi expired vs data sistem ────────────────────
        // Jika teknisi melaporkan 'expired' tapi sistem mencatat APAR belum expired
        $expiredDateDiscrepancy = false;
        if ($data['condition'] === 'expired' && $apar->expired_at) {
            try {
                $aparExpiredAt = Carbon::parse($apar->expired_at);
                if ($aparExpiredAt->isFuture()) {
                    // Sistem bilang belum expired, tapi teknisi melaporkan expired — flag untuk review
                    $expiredDateDiscrepancy = true;
                    Log::warning('Expired date discrepancy detected', [
                        'apar_id'          => $apar->id,
                        'apar_expired_at'  => $apar->expired_at,
                        'inspection_by'    => $userId,
                        'reported_at'      => now()->toIso8601String(),
                    ]);
                }
            } catch (\Exception $e) {
                Log::debug('Could not parse apar expired_at', ['error' => $e->getMessage()]);
            }
        }

        // ── Mobile flag data ──────────────────────────────────────────────────
        $mobileFlagStatus = 'none';
        $mobileFlagReason = null;
        if ($isMobileFlagged) {
            $mobileFlagStatus = 'flagged';
            $mobileFlagReason = implode(',', $locationValidation['flag_reasons'] ?? []);
        }

        // Create inspection and related records within a database transaction
        $inspection = DB::transaction(function () use (
            $apar,
            $userId,
            $user,
            $photoPath,
            $selfiePath,
            $mobileVerificationPhotoUrl,
            $data,
            $inspectionStatus,
            $schedule,
            $repairStatus,
            $requiresRepair,
            $mobileFlagStatus,
            $mobileFlagReason,
            $isMobileFlagged,
            $expiredDateDiscrepancy
        ) {
            $isSupervisorDirectRepair = $user && $user->isSupervisor() && $requiresRepair && !empty($data['assigned_teknisi_id']);

            $inspection = Inspection::create([
                'apar_id'                        => $apar->id,
                'user_id'                        => $userId,
                'photo_url'                      => '/storage/' . $photoPath,
                'selfie_url'                     => '/storage/' . $selfiePath,
                'mobile_verification_photo_url'  => $mobileVerificationPhotoUrl,
                'mobile_flag_status'             => $mobileFlagStatus,
                'mobile_flag_reason'             => $mobileFlagReason,
                'gps_accuracy_meters'            => $data['gps_accuracy'] ?? null,
                'photo_captured_at'              => $data['photo_captured_at'] ?? null,
                'is_mock_location_detected'      => !empty($data['is_mock_location']),
                'condition'                      => $data['condition'],
                'notes'                          => $data['notes'] ?? null,
                'identification_method'          => $data['identification_method'] ?? 'qr_scan',
                'inspection_lat'                 => $data['lat'] ?? null,
                'inspection_lng'                 => $data['lng'] ?? null,
                'location_valid'                 => true,
                'is_valid'                       => true,
                'status'                         => 'completed',
                'inspection_status'              => $inspectionStatus,
                'schedule_id'                    => $schedule?->id,
                'repair_status'                  => $repairStatus,
                'requires_repair'                => $requiresRepair,
                'repair_notes'                   => $isSupervisorDirectRepair ? ($data['supervisor_notes'] ?? null) : null,
                'photo_required'                 => true,
                'selfie_required'                => true,
            ]);

            // Tentukan event_type dan flag_reason untuk log
            $eventType   = $isMobileFlagged ? 'flagged' : 'success';
            $flagReason  = $mobileFlagReason;
            if ($expiredDateDiscrepancy) {
                $eventType  = 'flagged';
                $flagReason = trim(($flagReason ? $flagReason . ',' : '') . 'expired_date_discrepancy', ',');
            }

            // Log inspection submission — termasuk semua field fraud detection
            $this->logInspectionAction(
                $apar->id, $userId, 'submit_inspection',
                $data['lat'] ?? null, $data['lng'] ?? null,
                true, 'Inspection submitted successfully',
                $inspection->id,
                $eventType, $flagReason,
                $data['gps_accuracy'] ?? null,
                $data['photo_captured_at'] ?? null,
                $data['emergency_reason'] ?? null
            );

            // Handle damage categories
            if (isset($data['damage_categories']) && count($data['damage_categories']) > 0) {
                $this->handleDamageCategories($inspection->id, $data['damage_categories']);
            }

            // Create repair approval if required
            if ($requiresRepair) {
                if ($isSupervisorDirectRepair) {
                    $this->createSupervisorDirectRepairAssignment($inspection, $apar, $userId, $data);
                    // Langsung update APAR ke under_repair karena perbaikan sudah dijadwalkan ke teknisi
                    $apar->update(['status' => 'under_repair']);
                } else {
                    $this->createRepairApproval($inspection->id);
                    $this->updateAparStatus($apar, $data['condition']);
                }
            } else {
                // Update APAR status jika tidak ada perbaikan
                $this->updateAparStatus($apar, $data['condition']);
            }

            // Mark schedule as completed
            if ($schedule) {
                $schedule->update(['is_completed' => true]);
            }

            return $inspection;
        });

        // Send notifications
        if ($requiresRepair) {
            if ($user && $user->isSupervisor() && !empty($data['assigned_teknisi_id'])) {
                // Notifikasi teknisi yang langsung ditugaskan perbaikan oleh supervisor
                try {
                    $repairApproval = RepairApproval::where('inspection_id', $inspection->id)->first();
                    if ($repairApproval) {
                        $reinspectionService = new \App\Services\ReinspectionService();
                        $reinspectionService->notifyTechnicianOfApproval($inspection, $repairApproval);
                        $this->notificationService->notifyRepairAssignment($repairApproval);
                    }
                } catch (\Throwable $e) {
                    Log::error('Failed to notify assigned technician: ' . $e->getMessage());
                }
            } else {
                // Notifikasi reguler kerusakan ke supervisor (jika teknisi yang inspeksi)
                try {
                    $this->notificationService->notifyCriticalDamage($inspection);
                } catch (\Throwable $e) {
                    Log::error('Failed to notify supervisors of critical damage: ' . $e->getMessage());
                }
            }
        }

        // Build success message
        $message = 'Inspeksi berhasil disimpan';
        if ($user && $user->isSupervisor() && $requiresRepair && !empty($data['assigned_teknisi_id'])) {
            $assignedTech = User::find($data['assigned_teknisi_id']);
            $techName = $assignedTech ? $assignedTech->name : 'Teknisi';
            $message .= ". Perbaikan berhasil ditugaskan kepada {$techName} pada {$data['schedule_date']} {$data['schedule_time']}.";
        } elseif (!$isAdminOrSupervisor || $isMobileFlagged) {
            $message .= '. Menunggu review dari supervisor.';
        }
        if ($isMobileFlagged) {
            $message .= ' (Inspeksi mobile ditandai untuk verifikasi tambahan)';
        }
        if ($expiredDateDiscrepancy) {
            $message .= ' (Perhatian: tanggal expired berbeda dengan data sistem)';
        }

        return [
            'success'            => true,
            'message'            => $message,
            'inspection'         => $inspection->load(['apar.aparType', 'user']),
            'location_valid'     => true,
            'inspection_status'  => $inspectionStatus,
            'is_flagged'         => $isMobileFlagged || $expiredDateDiscrepancy,
            'status_code'        => 201,
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
                $repairPhotoUrl = '/storage/' . $repairPhotoPath;
            }

            InspectionDamage::create([
                'inspection_id' => $inspectionId,
                'damage_category_id' => $damageData['category_id'],
                'notes' => $damageData['notes'] ?? null,
                'damage_photo_url' => '/storage/' . $damagePhotoPath,
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
     * Create direct approved repair approval and schedule when inspection is submitted by a supervisor.
     */
    protected function createSupervisorDirectRepairAssignment(Inspection $inspection, Apar $apar, int $supervisorId, array $data): RepairApproval
    {
        $supervisorNotes = $data['supervisor_notes'] ?? 'Ditugaskan langsung oleh Supervisor saat inspeksi.';

        $repairApproval = RepairApproval::create([
            'inspection_id'    => $inspection->id,
            'status'           => 'approved',
            'approved_by'      => $supervisorId,
            'assigned_user_id' => $data['assigned_teknisi_id'],
            'supervisor_notes' => $supervisorNotes,
            'admin_notes'      => $supervisorNotes,
            'approved_at'      => now(),
            'decision_made_at' => now(),
        ]);

        try {
            $appTimezone = config('app.timezone', 'UTC');
            $startAtLocal = Carbon::parse($data['schedule_date'] . ' ' . $data['schedule_time'], $appTimezone);
            $endAtLocal = $startAtLocal->copy()->addHour();

            $repairSchedule = InspectionSchedule::create([
                'apar_id'          => $apar->id,
                'assigned_user_id' => $data['assigned_teknisi_id'],
                'start_at'         => $startAtLocal,
                'end_at'           => $endAtLocal,
                'frequency'        => 'once',
                'is_active'        => true,
                'notes'            => 'Jadwal perbaikan dari inspeksi supervisor #' . $inspection->id . ': ' . $supervisorNotes,
            ]);

            Log::info('Repair schedule created directly upon supervisor inspection', [
                'schedule_id'      => $repairSchedule->id,
                'inspection_id'    => $inspection->id,
                'repair_approval'  => $repairApproval->id,
                'assigned_teknisi' => $data['assigned_teknisi_id'],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create repair schedule upon supervisor inspection: ' . $e->getMessage());
        }

        return $repairApproval;
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
        } elseif ($condition === 'good' && $apar->status === 'under_repair') {
            // If reinspection shows condition is good and APAR was under repair,
            // update status to active (repair was successful)
            $apar->update(['status' => 'active']);
            Log::info('APAR status updated to active after successful reinspection', [
                'apar_id' => $apar->id,
            ]);
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
     * Log inspection action ke audit trail dengan kategorisasi event.
     *
     * @param  int          $aparId
     * @param  int          $userId
     * @param  string       $action         Nama aksi (scan_qr, submit_inspection, validation_failed, dll.)
     * @param  float|null   $lat
     * @param  float|null   $lng
     * @param  bool         $isSuccessful
     * @param  string       $details        Deskripsi bebas tentang kejadian
     * @param  int|null     $inspectionId
     * @param  string       $eventType      Kategori: success, blocked, flagged, error
     * @param  string|null  $flagReason     Alasan flag (comma-separated jika multiple)
     * @param  float|null   $gpsAccuracy    Presisi GPS dalam meter
     * @param  string|null  $photoCapturedAt Timestamp klaim foto dari frontend
     * @param  string|null  $emergencyReason Alasan bypass jadwal (untuk Admin/Supervisor)
     */
    protected function logInspectionAction(
        int $aparId,
        int $userId,
        string $action,
        ?float $lat,
        ?float $lng,
        bool $isSuccessful,
        string $details,
        ?int $inspectionId = null,
        string $eventType = 'success',
        ?string $flagReason = null,
        ?float $gpsAccuracy = null,
        ?string $photoCapturedAt = null,
        ?string $emergencyReason = null
    ): void {
        InspectionLog::create([
            'apar_id'            => $aparId,
            'user_id'            => $userId,
            'inspection_id'      => $inspectionId,
            'action'             => $action,
            'lat'                => $lat,
            'lng'                => $lng,
            'ip_address'         => request()->ip(),
            'user_agent'         => request()->userAgent(),
            'device_info'        => DeviceDetectorService::getDeviceInfo(),
            'is_successful'      => $isSuccessful,
            'details'            => $details,
            'event_type'         => $eventType,
            'flag_reason'        => $flagReason,
            'gps_accuracy_meters'=> $gpsAccuracy,
            'photo_captured_at'  => $photoCapturedAt,
            'emergency_reason'   => $emergencyReason,
        ]);
    }

    /**
     * Get device information for logging (delegated to DeviceDetectorService)
     */
    protected function getDeviceInfo(): array
    {
        return DeviceDetectorService::getDeviceInfo();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    public function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        return haversine_distance_meters($lat1, $lng1, $lat2, $lng2);
    }
}
