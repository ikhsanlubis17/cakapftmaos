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
    public function index(Request $request)
    {
        $query = RepairApproval::with(['inspection.apar.aparType', 'inspection.user', 'approver']);

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
        $approvals = RepairApproval::with(['inspection.apar.aparType', 'inspection.user'])
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
            'repairReport'
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

        $validator = Validator::make($request->all(), [
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Auth::guard('api')->user();
        $repairApproval->approve($admin->id, $request->admin_notes);

        // Update inspection status
        $repairApproval->inspection->update([
            'repair_status' => 'approved',
            'repair_notes' => $request->admin_notes
        ]);

        // Send notification to technician
        // try {
        //     $notificationService = new \App\Services\NotificationService();
        //     $notificationService->sendRepairApprovalNotification($repairApproval, 'approved');
        //
        //     // Broadcast WebSocket notification for real-time updates
        //     $webSocketService = new \App\Services\WebSocketService();
        //     $webSocketService->broadcastRepairApprovalStatusChange($repairApproval, 'approved');
        // } catch (\Exception $e) {
        //     Log::error('Failed to send approval notification: ' . $e->getMessage());
        // }

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

        $validator = Validator::make($request->all(), [
            'admin_notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Auth::guard('api')->user();
        $repairApproval->reject($admin->id, $request->admin_notes);

        // Update inspection status
        $repairApproval->inspection->update([
            'repair_status' => 'rejected',
            'repair_notes' => $request->admin_notes
        ]);

        // Send notification to technician
        // try {
        //     $notificationService = new \App\Services\NotificationService();
        //     $notificationService->sendRepairApprovalNotification($repairApproval, 'rejected');
        //
        //     // Broadcast WebSocket notification for real-time updates
        //     $webSocketService = new \App\Services\WebSocketService();
        //     $webSocketService->broadcastRepairApprovalStatusChange($repairApproval, 'rejected');
        // } catch (\Exception $e) {
        //     Log::error('Failed to send rejection notification: ' . $e->getMessage());
        // }

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perbaikan berhasil ditolak',
            'data' => $repairApproval->fresh(['inspection.apar.aparType', 'inspection.user', 'approver'])
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
