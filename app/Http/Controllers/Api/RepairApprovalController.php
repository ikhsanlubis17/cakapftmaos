<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepairApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RepairApprovalController extends Controller
{
    /**
     * Display a listing of repair approvals.
     */
    public function index(Request $request)
    {
        $query = RepairApproval::with([
            'inspection.apar.aparType', 
            'inspection.user', 
            'inspection.inspectionDamages.damageCategory', 
            'approver', 
            'assignedTeknisi',
            'repairReport'
        ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by APAR
        if ($request->has('apar_id')) {
            $query->whereHas('inspection', function ($q) use ($request) {
                $q->where('apar_id', $request->apar_id);
            });
        }

        // Filter by assigned user
        if ($request->has('assigned_user_id')) {
            $query->where('assigned_user_id', $request->assigned_user_id);
        }

        // Filter for current technician (either assigned or original inspector)
        if ($request->boolean('assigned_to_me') && Auth::guard('api')->check()) {
            $currentUserId = Auth::guard('api')->id();
            $query->where(function ($q) use ($currentUserId) {
                $q->where('assigned_user_id', $currentUserId)
                  ->orWhereHas('inspection', function ($sub) use ($currentUserId) {
                      $sub->where('user_id', $currentUserId);
                  });
            });
        }

        $approvals = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $approvals
        ]);
    }

    /**
     * Display pending repair approvals.
     */
    public function pending()
    {
        $approvals = RepairApproval::with([
            'inspection.apar.aparType', 
            'inspection.user',
            'inspection.inspectionDamages.damageCategory',
            'approver',
            'assignedTeknisi'
        ])
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $approvals
        ]);
    }

    /**
     * Display the specified repair approval.
     */
    public function show(RepairApproval $repairApproval)
    {
        $repairApproval->load([
            'inspection.apar.aparType',
            'inspection.user',
            'inspection.inspectionDamages.damageCategory',
            'approver',
            'assignedTeknisi',
            'repairReport'
        ]);

        return response()->json([
            'success' => true,
            'data' => $repairApproval
        ]);
    }

    /**
     * Approve a repair request (Supervisor/Admin assigns technician and schedule).
     */
    public function approve(Request $request, RepairApproval $repairApproval)
    {
        if ($repairApproval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya permintaan pending yang dapat disetujui'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'supervisor_notes' => 'required|string|min:10',
            'assigned_teknisi_id' => 'required|exists:users,id',
            'schedule_date' => 'required|date|after_or_equal:today',
            'schedule_time' => 'required|date_format:H:i',
        ], [
            'supervisor_notes.required' => 'Catatan supervisor wajib diisi',
            'supervisor_notes.min' => 'Catatan supervisor minimal 10 karakter. Jelaskan instruksi kerja perbaikan.',
            'assigned_teknisi_id.required' => 'Teknisi yang ditugaskan wajib dipilih',
            'assigned_teknisi_id.exists' => 'Teknisi yang dipilih tidak valid',
            'schedule_date.required' => 'Tanggal jadwal perbaikan wajib diisi',
            'schedule_date.after_or_equal' => 'Tanggal perbaikan tidak boleh di masa lalu',
            'schedule_time.required' => 'Waktu jadwal perbaikan wajib diisi',
            'schedule_time.date_format' => 'Format waktu perbaikan harus HH:MM (contoh: 09:00)',
        ]);

        $validator->after(function ($validator) use ($request) {
            if ($request->assigned_teknisi_id) {
                $assignedUser = \App\Models\User::find($request->assigned_teknisi_id);
                if (!$assignedUser || !$assignedUser->isTeknisi()) {
                    $validator->errors()->add('assigned_teknisi_id', 'User yang ditugaskan harus memiliki peran teknisi.');
                }
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for schedule conflicts
        $scheduleService = app(\App\Services\ScheduleService::class);
        $conflictCheck = $scheduleService->checkScheduleConflict(
            $request->assigned_teknisi_id,
            $request->schedule_date,
            $request->schedule_time
        );

        if ($conflictCheck['has_conflict']) {
            return response()->json([
                'success' => false,
                'message' => $conflictCheck['message'] . '. Jadwal yang bentrok: ' . 
                    collect($conflictCheck['conflicting_schedules'])->map(function ($c) {
                        return "APAR {$c['apar']} pada {$c['start_at']}";
                    })->implode(', '),
                'error' => 'schedule_conflict',
                'conflicting_schedules' => $conflictCheck['conflicting_schedules'],
            ], 422);
        }

        $admin = Auth::guard('api')->user();
        $repairApproval->approve($admin->id, $request->supervisor_notes, $request->assigned_teknisi_id);

        // Update inspection status
        $repairApproval->inspection->update([
            'repair_status' => 'approved',
            'repair_notes' => $request->supervisor_notes
        ]);

        // Update APAR status to under_repair when repair is approved
        // This indicates that technician can now start the repair work
        $apar = $repairApproval->inspection->apar;
        if ($apar) {
            $apar->update(['status' => 'under_repair']);
            \Log::info('APAR status updated to under_repair after repair approval', [
                'apar_id' => $apar->id,
                'repair_approval_id' => $repairApproval->id,
            ]);

            // Create repair schedule for assigned technician
            try {
                $appTimezone = config('app.timezone', 'UTC');
                $startAtLocal = \Carbon\Carbon::parse($request->schedule_date . ' ' . $request->schedule_time, $appTimezone);
                $endAtLocal = $startAtLocal->copy()->addHour();

                $repairSchedule = \App\Models\InspectionSchedule::create([
                    'apar_id' => $apar->id,
                    'assigned_user_id' => $request->assigned_teknisi_id,
                    'start_at' => $startAtLocal,
                    'end_at' => $endAtLocal,
                    'frequency' => 'once',
                    'is_active' => true,
                    'notes' => 'Jadwal perbaikan dari tiket persetujuan #' . $repairApproval->id . ': ' . $request->supervisor_notes,
                ]);

                \Log::info('Repair schedule created upon supervisor approval', [
                    'schedule_id' => $repairSchedule->id,
                    'repair_approval_id' => $repairApproval->id,
                    'assigned_user_id' => $request->assigned_teknisi_id,
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to create repair schedule upon approval: ' . $e->getMessage());
            }
        }

        // Send notification to technician
        try {
            $reinspectionService = new \App\Services\ReinspectionService();
            $reinspectionService->notifyTechnicianOfApproval(
                $repairApproval->inspection, 
                $repairApproval
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send approval notification: ' . $e->getMessage());
        }

        // Send email assignment notification to technician
        try {
            app(\App\Services\NotificationService::class)->notifyRepairAssignment($repairApproval);
        } catch (\Exception $e) {
            \Log::error('Failed to send repair assignment email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perbaikan berhasil disetujui dan teknisi telah ditugaskan',
            'data' => $repairApproval->fresh(['inspection.apar.aparType', 'inspection.user', 'approver', 'assignedTeknisi'])
        ]);
    }

    /**
     * Reject a repair request.
     */
    public function reject(Request $request, RepairApproval $repairApproval)
    {
        if ($repairApproval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya permintaan pending yang dapat ditolak'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'supervisor_notes' => 'required|string|min:10',
            'rejection_reason' => 'required|string',
        ], [
            'supervisor_notes.required' => 'Catatan supervisor wajib diisi',
            'supervisor_notes.min' => 'Catatan supervisor minimal 10 karakter. Jelaskan alasan penolakan dan instruksi untuk inspeksi ulang.',
            'rejection_reason.required' => 'Alasan penolakan wajib dipilih',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Auth::guard('api')->user();
        
        // Use ReinspectionService for automated workflow
        $reinspectionService = new \App\Services\ReinspectionService();
        
        try {
            // 1. Reject the repair approval
            $repairApproval->reject($admin->id, $request->supervisor_notes, $request->rejection_reason);
            
            // 2. Mark inspection for re-inspection
            $reinspectionService->markInspectionForReinspection(
                $repairApproval->inspection, 
                $repairApproval
            );
            
            // 3. Create re-inspection schedule
            $reinspectionSchedule = $reinspectionService->createReinspectionSchedule(
                $repairApproval->inspection, 
                $repairApproval
            );
            
            // 4. Send notification to technician
            $reinspectionService->notifyTechnicianOfRejection(
                $repairApproval->inspection, 
                $repairApproval,
                $reinspectionSchedule
            );
            
            \Log::info('Repair rejection workflow completed', [
                'repair_approval_id' => $repairApproval->id,
                'inspection_id' => $repairApproval->inspection->id,
                'reinspection_schedule_id' => $reinspectionSchedule->id,
                'supervisor_id' => $admin->id,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Permintaan perbaikan ditolak. Jadwal inspeksi ulang telah dibuat.',
                'data' => [
                    'repair_approval' => $repairApproval->fresh(['inspection.apar.aparType', 'inspection.user', 'approver']),
                    'reinspection_schedule' => $reinspectionSchedule,
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to complete rejection workflow', [
                'repair_approval_id' => $repairApproval->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memproses penolakan. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Mark repair as completed.
     */
    public function markCompleted(Request $request, RepairApproval $repairApproval)
    {
        if ($repairApproval->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya perbaikan yang disetujui yang dapat ditandai selesai'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'repair_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $repairApproval->markCompleted($request->repair_notes);

        // Update inspection status
        $repairApproval->inspection->update([
            'repair_status' => 'completed',
            'repair_notes' => $request->repair_notes
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Perbaikan berhasil ditandai selesai',
            'data' => $repairApproval->fresh(['inspection.apar.aparType', 'inspection.user', 'approver'])
        ]);
    }

    /**
     * Get repair approval statistics.
     */
    public function stats()
    {
        $total = RepairApproval::count();
        $pending = RepairApproval::where('status', 'pending')->count();
        $approved = RepairApproval::where('status', 'approved')->count();
        $rejected = RepairApproval::where('status', 'rejected')->count();
        $completed = RepairApproval::where('status', 'completed')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
                'completed' => $completed,
            ]
        ]);
    }
}
