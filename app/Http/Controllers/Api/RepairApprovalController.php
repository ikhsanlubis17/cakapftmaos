<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepairApproval;
use App\Models\Inspection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RepairApprovalController extends Controller
{
    /**
     * Display a listing of repair approvals.
     */
    /**
     * Display a listing of repair approvals.
     */
    public function index(Request $request)
    {
        $query = RepairApproval::with(['inspection.apar.aparType', 'inspection.user', 'inspection.inspectionDamages.damageCategory', 'approver', 'inspection.checker', 'inspection.reviewer', 'assignedTechnician']);

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
        $approvals = RepairApproval::with(['inspection.apar.aparType', 'inspection.user', 'inspection.checker', 'inspection.reviewer'])
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
            'repairReport',
            'inspection.checker',
            'inspection.reviewer',
            'assignedTechnician'
        ]);

        return response()->json([
            'success' => true,
            'data' => $repairApproval
        ]);
    }

    /**
     * Approve a repair request.
     */
    public function approve(Request $request, RepairApproval $repairApproval)
    {
        if ($repairApproval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya permintaan pending yang dapat disetujui'
            ], 422);
        }

        // VALIDATION: Ensure inspection has been reviewed and approved by Checker
        $inspection = $repairApproval->inspection;
        if (!in_array($inspection->inspection_status, ['approved_by_checker', 'pending_review'])) {
            $message = 'Inspeksi harus direview dan disetujui oleh Checker terlebih dahulu';
            if ($inspection->inspection_status === 'rejected_by_checker') {
                $message = 'Inspeksi telah ditolak oleh Checker';
            }
            return response()->json([
                'success' => false,
                'message' => $message,
                'error_code' => 'WAITING_FOR_CHECKER'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'supervisor_notes' => 'required|string|min:10',
        ], [
            'supervisor_notes.required' => 'Catatan supervisor wajib diisi',
            'supervisor_notes.min' => 'Catatan supervisor minimal 10 karakter. Jelaskan alasan persetujuan atau instruksi perbaikan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Auth::guard('api')->user();
        $repairApproval->approve($admin->id, $request->supervisor_notes);

        // Update inspection status
        $repairApproval->inspection->update([
            'repair_status' => 'approved',
            'repair_notes' => $request->supervisor_notes
        ]);

        // Update APAR status to under_repair when repair is approved
        // This indicates that technician can now start the repair work
        $apar = $repairApproval->inspection->apar;
        if ($apar->status === 'needs_repair') {
            $apar->update(['status' => 'under_repair']);
            \Log::info('APAR status updated to under_repair after repair approval', [
                'apar_id' => $apar->id,
                'repair_approval_id' => $repairApproval->id,
            ]);
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

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perbaikan berhasil disetujui',
            'data' => $repairApproval->fresh(['inspection.apar.aparType', 'inspection.user', 'approver'])
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

        // VALIDATION: Ensure inspection has been reviewed and approved by Checker (even for rejection, we follow workflow)
        // Or should Supervisor serve as final decision even if checker pending? 
        // Requirement says "Supervisor hanya dapat ... setelah ... direview oleh Checker".
        $inspection = $repairApproval->inspection;
        if (!in_array($inspection->inspection_status, ['approved_by_checker', 'pending_review'])) {
            $message = 'Inspeksi harus direview dan disetujui oleh Checker terlebih dahulu';
            if ($inspection->inspection_status === 'rejected_by_checker') {
                $message = 'Inspeksi telah ditolak oleh Checker';
            }
            return response()->json([
                'success' => false,
                'message' => 'Inspeksi harus direview dan disetujui oleh Checker terlebih dahulu',
                'error_code' => 'WAITING_FOR_CHECKER'
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
     * Schedule a repair.
     */
    public function schedule(Request $request, RepairApproval $repairApproval)
    {
        // Only allow scheduling if status is approved
        if ($repairApproval->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya permintaan yang telah disetujui yang dapat dijadwalkan'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'scheduled_at' => 'required|date|after:now',
            'assigned_technician_id' => 'required|exists:users,id',
            'schedule_notes' => 'nullable|string',
        ], [
            'scheduled_at.required' => 'Tanggal jadwal wajib diisi',
            'scheduled_at.after' => 'Tanggal jadwal harus di masa depan',
            'assigned_technician_id.required' => 'Teknisi wajib dipilih',
            'assigned_technician_id.exists' => 'Teknisi tidak valid',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update the repair approval with schedule info
        $repairApproval->markScheduled(
            \Carbon\Carbon::parse($request->scheduled_at),
            $request->assigned_technician_id,
            $request->schedule_notes
        );

        // Send notification to technician (Placeholder for now)
        // \App\Services\NotificationService::sendRepairScheduledNotification($repairApproval);

        return response()->json([
            'success' => true,
            'message' => 'Perbaikan berhasil dijadwalkan',
            'data' => $repairApproval->fresh(['inspection.apar.aparType', 'inspection.user', 'approver', 'assignedTechnician'])
        ]);
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
