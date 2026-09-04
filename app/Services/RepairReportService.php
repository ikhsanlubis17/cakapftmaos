<?php

namespace App\Services;

use App\Models\RepairReport;
use App\Models\RepairApproval;
use App\Models\InspectionSchedule;
use App\Models\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RepairReportService
{
    public function __construct(
        protected ImageService $imageService,
        protected ReinspectionService $reinspectionService
    ) {
    }

    /**
     * Create a new repair report.
     */
    public function create(RepairApproval $repairApproval, array $data, int $userId, array $files = []): RepairReport
    {
        $inspection = $repairApproval->inspection;
        $inspection->load('inspectionDamages');

        // 1. Process specific damage repair photos if provided
        if (!empty($files['damage_photos'])) {
            foreach ($files['damage_photos'] as $damageId => $photo) {
                $damage = $inspection->inspectionDamages->find($damageId);
                if ($damage && $photo) {
                    $path = $this->imageService->compressImage(
                        $photo,
                        'inspections/repairs',
                        80,
                        1920,
                        1080
                    );
                    $damage->update([
                        'repair_photo_url' => Storage::url($path),
                    ]);
                }
            }
        }

        // 2. Compress & store general before/after photos
        $beforePhotoPath = $this->imageService->compressImage(
            $files['before_photo'],
            'repairs/before',
            80,
            1920,
            1080
        );
        $afterPhotoPath = $this->imageService->compressImage(
            $files['after_photo'],
            'repairs/after',
            80,
            1920,
            1080
        );

        // 3. Create repair report
        $repairReport = RepairReport::create([
            'repair_approval_id' => $repairApproval->id,
            'reported_by' => $userId,
            'repair_description' => $data['repair_description'],
            'before_photo_url' => Storage::url($beforePhotoPath),
            'after_photo_url' => Storage::url($afterPhotoPath),
            'repair_lat' => $data['repair_lat'] ?? null,
            'repair_lng' => $data['repair_lng'] ?? null,
            'repair_completed_at' => $data['repair_completed_at'],
            'status' => 'pending_review',
        ]);

        // 4. Update inspection
        $inspection->update([
            'repair_notes' => $data['repair_description'],
        ]);

        if (!empty($data['needs_reinspection'])) {
            $this->reinspectionService->handlePostRepairReinspection(
                $inspection,
                $repairApproval,
                $data['repair_description']
            );
        }

        Log::info('Repair report submitted for review', [
            'repair_report_id' => $repairReport->id,
            'repair_approval_id' => $repairApproval->id,
            'apar_id' => $inspection->apar_id,
            'teknisi_id' => $userId,
        ]);

        return $repairReport;
    }

    /**
     * Update an existing repair report.
     */
    public function update(RepairReport $repairReport, array $data, array $files = []): RepairReport
    {
        $updateData = array_intersect_key($data, array_flip([
            'repair_description',
            'repair_lat',
            'repair_lng',
            'repair_completed_at',
        ]));

        if (!empty($files['before_photo'])) {
            if ($repairReport->before_photo_url) {
                $oldPath = str_replace('/storage/', '', $repairReport->before_photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $beforePhotoPath = $this->imageService->compressImage(
                $files['before_photo'],
                'repairs/before',
                80,
                1920,
                1080
            );
            $updateData['before_photo_url'] = Storage::url($beforePhotoPath);
        }

        if (!empty($files['after_photo'])) {
            if ($repairReport->after_photo_url) {
                $oldPath = str_replace('/storage/', '', $repairReport->after_photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $afterPhotoPath = $this->imageService->compressImage(
                $files['after_photo'],
                'repairs/after',
                80,
                1920,
                1080
            );
            $updateData['after_photo_url'] = Storage::url($afterPhotoPath);
        }

        $repairReport->update($updateData);

        return $repairReport;
    }

    /**
     * Delete a repair report and associated photos.
     */
    public function delete(RepairReport $repairReport): void
    {
        if ($repairReport->before_photo_url) {
            $beforePath = str_replace('/storage/', '', $repairReport->before_photo_url);
            Storage::disk('public')->delete($beforePath);
        }

        if ($repairReport->after_photo_url) {
            $afterPath = str_replace('/storage/', '', $repairReport->after_photo_url);
            Storage::disk('public')->delete($afterPath);
        }

        $repairReport->delete();
    }

    /**
     * Approve repair report and activate APAR.
     */
    public function approve(RepairReport $repairReport, int $reviewerId, ?string $notes = null): RepairReport
    {
        $repairReport->approve($reviewerId, $notes);

        $repairApproval = $repairReport->repairApproval;
        $repairApproval->markCompleted($notes);

        $repairApproval->inspection->update([
            'repair_status' => 'completed',
        ]);

        $apar = $repairApproval->inspection->apar;
        $apar->update(['status' => 'active']);

        Log::info('Repair report approved, APAR set to active', [
            'repair_report_id' => $repairReport->id,
            'apar_id' => $apar->id,
            'supervisor_id' => $reviewerId,
        ]);

        return $repairReport;
    }

    /**
     * Request rework on repair report.
     */
    public function requestRework(RepairReport $repairReport, int $reviewerId, string $notes, string $scheduleDate, string $scheduleTime): array
    {
        $repairReport->markNeedsRework($reviewerId, $notes);

        $repairApproval = $repairReport->repairApproval;
        $inspection = $repairApproval->inspection;
        $teknisiId = $repairReport->reported_by;

        $appTimezone = config('app.timezone', 'UTC');
        $startAtLocal = Carbon::parse($scheduleDate . ' ' . $scheduleTime, $appTimezone);
        $endAtLocal = $startAtLocal->copy()->addHour();

        $schedule = InspectionSchedule::create([
            'apar_id' => $inspection->apar_id,
            'assigned_user_id' => $teknisiId,
            'start_at' => $startAtLocal,
            'end_at' => $endAtLocal,
            'frequency' => 'once',
            'is_active' => true,
            'notes' => "Perbaikan ulang dari laporan #" . $repairReport->id . "\n\nCatatan Supervisor: " . $notes,
        ]);

        $repairApproval->update([
            'status' => 'approved',
        ]);

        try {
            Notification::create([
                'user_id' => $teknisiId,
                'type' => 'repair_rework',
                'title' => 'Perbaikan Ulang Diperlukan',
                'content' => "Supervisor meminta perbaikan ulang untuk APAR {$inspection->apar->serial_number}. Jadwal: " . $startAtLocal->format('d M Y H:i'),
                'data' => json_encode([
                    'repair_report_id' => $repairReport->id,
                    'apar_id' => $inspection->apar_id,
                    'schedule_id' => $schedule->id,
                    'supervisor_notes' => $notes,
                ]),
                'status' => 'sent',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send rework notification: ' . $e->getMessage());
        }

        Log::info('Repair rework requested', [
            'repair_report_id' => $repairReport->id,
            'new_schedule_id' => $schedule->id,
            'teknisi_id' => $teknisiId,
            'supervisor_id' => $reviewerId,
        ]);

        return [
            'repair_report' => $repairReport,
            'new_schedule' => $schedule,
        ];
    }

    /**
     * Reject repair report and mark APAR as not fixable.
     */
    public function reject(RepairReport $repairReport, int $reviewerId, string $notes): RepairReport
    {
        $repairReport->reject($reviewerId, $notes);

        $repairApproval = $repairReport->repairApproval;
        $inspection = $repairApproval->inspection;
        $apar = $inspection->apar;

        $repairApproval->update([
            'status' => 'rejected',
            'rejection_reason' => 'APAR tidak dapat diperbaiki (not fixable)',
        ]);

        $inspection->update([
            'repair_status' => 'rejected',
            'repair_notes' => $notes,
        ]);

        $apar->update(['status' => 'not_fixable']);

        Log::info('Repair report rejected, APAR marked as not fixable', [
            'repair_report_id' => $repairReport->id,
            'apar_id' => $apar->id,
            'supervisor_id' => $reviewerId,
        ]);

        return $repairReport;
    }
}
