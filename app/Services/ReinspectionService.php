<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\InspectionSchedule;
use App\Models\RepairApproval;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ReinspectionService
{
    /**
     * Create a re-inspection schedule when repair is rejected.
     *
     * @param Inspection $inspection The original inspection that was rejected
     * @param RepairApproval $approval The repair approval with rejection details
     * @return InspectionSchedule The created re-inspection schedule
     */
    public function createReinspectionSchedule(Inspection $inspection, RepairApproval $approval): InspectionSchedule
    {
        try {
            // Calculate next available date (configurable, default +2 days from now)
            $daysUntilReinspection = config('app.reinspection_days', 2);
            $scheduledDate = Carbon::now()->addDays($daysUntilReinspection);
            
            // Set default time window (08:00 - 17:00)
            $startTime = '08:00:00';
            $endTime = '17:00:00';
            
            // Create schedule notes from supervisor rejection
            $scheduleNotes = "INSPEKSI ULANG DIPERLUKAN\n\n";
            $scheduleNotes .= "Alasan Penolakan: {$approval->rejection_reason}\n\n";
            $scheduleNotes .= "Instruksi Supervisor:\n{$approval->supervisor_notes}\n\n";
            $scheduleNotes .= "Mohon perhatikan catatan di atas saat melakukan inspeksi ulang.";
            
            // Calculate start_at and end_at in UTC
            $appTimezone = config('app.timezone', 'UTC');
            $startAt = Carbon::createFromFormat('Y-m-d H:i:s', 
                $scheduledDate->format('Y-m-d') . ' ' . $startTime, 
                $appTimezone
            )->setTimezone('UTC');
            
            $endAt = Carbon::createFromFormat('Y-m-d H:i:s', 
                $scheduledDate->format('Y-m-d') . ' ' . $endTime, 
                $appTimezone
            )->setTimezone('UTC');

            // Create the re-inspection schedule
            $schedule = InspectionSchedule::create([
                'apar_id' => $inspection->apar_id,
                'assigned_user_id' => $inspection->user_id, // Assign to same technician
                'start_at' => $startAt,
                'end_at' => $endAt,
                'frequency' => 'once', // One-time re-inspection
                'notes' => $scheduleNotes,
                'is_active' => true,
                'is_completed' => false,
            ]);
            
            Log::info('Re-inspection schedule created', [
                'inspection_id' => $inspection->id,
                'schedule_id' => $schedule->id,
                'technician_id' => $inspection->user_id,
                'scheduled_date' => $scheduledDate->format('Y-m-d'),
            ]);
            
            return $schedule;
            
        } catch (\Exception $e) {
            Log::error('Failed to create re-inspection schedule', [
                'inspection_id' => $inspection->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Update inspection status to needs_reinspection.
     *
     * @param Inspection $inspection
     * @param RepairApproval $approval
     * @return void
     */
    public function markInspectionForReinspection(Inspection $inspection, RepairApproval $approval): void
    {
        $inspection->update([
            'status' => 'needs_reinspection',
            'repair_status' => 'rejected',
            'reinspection_reason' => $approval->rejection_reason,
            'repair_notes' => $approval->supervisor_notes,
        ]);
        
        Log::info('Inspection marked for re-inspection', [
            'inspection_id' => $inspection->id,
            'reason' => $approval->rejection_reason,
        ]);
    }
    
    /**
     * Send notification to technician about rejection and re-inspection.
     *
     * @param Inspection $inspection
     * @param RepairApproval $approval
     * @param InspectionSchedule $reinspectionSchedule
     * @return void
     */
    public function notifyTechnicianOfRejection(
        Inspection $inspection, 
        RepairApproval $approval, 
        InspectionSchedule $reinspectionSchedule
    ): void {
        try {
            $supervisor = $approval->approver;
            $technician = $inspection->user;
            $apar = $inspection->apar;
            
            // Create notification
            Notification::create([
                'user_id' => $technician->id,
                'type' => 'repair_rejected_reinspection',
                'title' => 'Permintaan Perbaikan Ditolak - Inspeksi Ulang Diperlukan',
                'content' => "{$supervisor->name} meminta inspeksi ulang untuk APAR {$apar->code}",
                'data' => json_encode([
                    'inspection_id' => $inspection->id,
                    'apar_id' => $apar->id,
                    'apar_code' => $apar->code,
                    'supervisor_id' => $supervisor->id,
                    'supervisor_name' => $supervisor->name,
                    'rejection_reason' => $approval->rejection_reason,
                    'supervisor_notes' => $approval->supervisor_notes,
                    'reinspection_schedule' => [
                        'id' => $reinspectionSchedule->id,
                        'scheduled_date' => $reinspectionSchedule->scheduled_date,
                        'scheduled_time' => $reinspectionSchedule->scheduled_time,
                        'start_time' => $reinspectionSchedule->start_time,
                        'end_time' => $reinspectionSchedule->end_time,
                        'notes' => $reinspectionSchedule->notes,
                    ],
                ]),
                'status' => 'sent',
            ]);
            
            Log::info('Rejection notification sent to technician', [
                'inspection_id' => $inspection->id,
                'technician_id' => $technician->id,
                'supervisor_id' => $supervisor->id,
            ]);
            
            // TODO: Broadcast WebSocket notification for real-time updates
            // This would require WebSocket implementation
            // broadcast(new RepairRejectedEvent($inspection, $approval, $reinspectionSchedule));
            
        } catch (\Exception $e) {
            Log::error('Failed to send rejection notification', [
                'inspection_id' => $inspection->id,
                'error' => $e->getMessage(),
            ]);
            
            // Don't throw - notification failure shouldn't break the workflow
        }
    }
    
    /**
     * Send notification to technician about approval.
     *
     * @param Inspection $inspection
     * @param RepairApproval $approval
     * @return void
     */
    public function notifyTechnicianOfApproval(Inspection $inspection, RepairApproval $approval): void
    {
        try {
            $supervisor = $approval->approver;
            $technician = $inspection->user;
            $apar = $inspection->apar;
            
            // Create notification
            Notification::create([
                'user_id' => $technician->id,
                'type' => 'repair_approved',
                'title' => 'Permintaan Perbaikan Disetujui',
                'content' => "{$supervisor->name} telah menyetujui permintaan perbaikan untuk APAR {$apar->code}",
                'data' => json_encode([
                    'inspection_id' => $inspection->id,
                    'apar_id' => $apar->id,
                    'apar_code' => $apar->code,
                    'supervisor_id' => $supervisor->id,
                    'supervisor_name' => $supervisor->name,
                    'supervisor_notes' => $approval->supervisor_notes,
                    'approved_at' => $approval->approved_at->toIso8601String(),
                ]),
                'status' => 'sent',
            ]);
            
            Log::info('Approval notification sent to technician', [
                'inspection_id' => $inspection->id,
                'technician_id' => $technician->id,
                'supervisor_id' => $supervisor->id,
            ]);
            
            // TODO: Broadcast WebSocket notification for real-time updates
            // broadcast(new RepairApprovedEvent($inspection, $approval));
            
        } catch (\Exception $e) {
            Log::error('Failed to send approval notification', [
                'inspection_id' => $inspection->id,
                'error' => $e->getMessage(),
            ]);
            
            // Don't throw - notification failure shouldn't break the workflow
        }
    }
    /**
     * Handle re-inspection request after repair report.
     *
     * @param Inspection $inspection
     * @param RepairApproval $approval
     * @param string $notes
     * @return InspectionSchedule
     */
    public function handlePostRepairReinspection(Inspection $inspection, RepairApproval $approval, string $notes): InspectionSchedule
    {
        try {
            // 1. Update inspection status
            $inspection->update([
                'status' => 'needs_reinspection',
                'repair_status' => 'completed', // Repair is technically done, but needs verification
                'reinspection_reason' => 'Post-repair verification',
                'repair_notes' => $notes,
            ]);

            // 2. Create re-inspection schedule
            // Calculate next available date (configurable, default +1 day from now for post-repair)
            $daysUntilReinspection = 1;
            $scheduledDate = Carbon::now()->addDays($daysUntilReinspection);
            
            // Set default time window (08:00 - 17:00)
            $startTime = '08:00:00';
            $endTime = '17:00:00';
            
            // Create schedule notes
            $scheduleNotes = "VERIFIKASI HASIL PERBAIKAN\n\n";
            $scheduleNotes .= "Catatan Teknisi:\n{$notes}\n\n";
            $scheduleNotes .= "Mohon lakukan inspeksi ulang untuk memverifikasi hasil perbaikan.";
            
            // Calculate start_at and end_at in UTC
            $appTimezone = config('app.timezone', 'UTC');
            $startAt = Carbon::createFromFormat('Y-m-d H:i:s', 
                $scheduledDate->format('Y-m-d') . ' ' . $startTime, 
                $appTimezone
            )->setTimezone('UTC');
            
            $endAt = Carbon::createFromFormat('Y-m-d H:i:s', 
                $scheduledDate->format('Y-m-d') . ' ' . $endTime, 
                $appTimezone
            )->setTimezone('UTC');

            // Create the re-inspection schedule
            $schedule = InspectionSchedule::create([
                'apar_id' => $inspection->apar_id,
                'assigned_user_id' => $inspection->user_id, // Assign to same technician
                'scheduled_date' => $scheduledDate->format('Y-m-d'),
                'scheduled_time' => $startTime,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'frequency' => 'once',
                'notes' => $scheduleNotes,
                'is_active' => true,
                'is_completed' => false,
                'is_completed' => false,
                'created_by' => $inspection->user_id, // Created by technician via system
            ]);
            
            Log::info('Post-repair re-inspection schedule created', [
                'inspection_id' => $inspection->id,
                'schedule_id' => $schedule->id,
                'technician_id' => $inspection->user_id,
            ]);
            
            return $schedule;
            
        } catch (\Exception $e) {
            Log::error('Failed to create post-repair re-inspection schedule', [
                'inspection_id' => $inspection->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }
}
