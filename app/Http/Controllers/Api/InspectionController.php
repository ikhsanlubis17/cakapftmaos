<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInspectionRequest;
use App\Services\InspectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Inspection;
use App\Models\InspectionSchedule;

class InspectionController extends Controller
{
    protected InspectionService $inspectionService;

    public function __construct(InspectionService $inspectionService)
    {
        $this->inspectionService = $inspectionService;
    }

    /**
     * Display a listing of inspections (for supervisor/admin)
     */
    public function index(Request $request)
    {
        // Get actual inspections performed by all users
        $query = Inspection::with([
            'apar.aparType',
            'user',
            'schedule',
            'inspectionDamages.damageCategory',
            'repairApproval.approver'
        ]);

        if ($request->has('apar_id')) {
            $query->where('apar_id', $request->apar_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $inspections = $query->orderBy('created_at', 'desc')->get();

        // Get all pending schedules
        $pendingSchedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('is_active', true)
            ->where('is_completed', false)
            ->whereDoesntHave('inspections', function ($query) {
                $query->where('status', 'completed');
            })
            ->orderBy('start_at')
            ->get();

        // Convert schedules to inspection-like objects for frontend
        $pendingInspections = $pendingSchedules->map(function ($schedule) {
            return [
                'id' => 'schedule_' . $schedule->id,
                'apar' => $schedule->apar,
                'user' => $schedule->assignedUser,
                'status' => 'pending',
                'scheduled_date' => $schedule->scheduled_date,
                'start_at' => optional($schedule->startAtUtc())->toIso8601String(),
                'end_at' => optional($schedule->endAtUtc())->toIso8601String(),
                'scheduled_time' => $schedule->scheduled_time,
                'notes' => $schedule->notes,
                'is_schedule' => true,
                'schedule_id' => $schedule->id,
                'created_at' => $schedule->created_at,
                'updated_at' => $schedule->updated_at,
            ];
        });

        // Combine actual inspections with pending schedules
        $allInspections = $inspections->concat($pendingInspections);

        return response()->json($allInspections);
    }

    /**
     * Display inspections for the authenticated user
     */
    public function myInspections()
    {
        $user = Auth::guard('api')->user();

        // Get actual inspections performed by the user
        $inspections = Inspection::with([
            'apar.aparType',
            'schedule',
            'inspectionDamages.damageCategory',
            'repairApproval.approver'
        ])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get pending schedules for the user
        $pendingSchedules = InspectionSchedule::with(['apar.aparType'])
            ->where('assigned_user_id', $user->id)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->whereDoesntHave('inspections', function ($query) {
                $query->where('status', 'completed');
            })
            ->orderBy('start_at')
            ->get();

        // Convert schedules to inspection-like objects for frontend
        $pendingInspections = $pendingSchedules->map(function ($schedule) {
            return [
                'id' => 'schedule_' . $schedule->id,
                'apar' => $schedule->apar,
                'status' => 'pending',
                'scheduled_date' => $schedule->scheduled_date,
                'start_at' => optional($schedule->startAtUtc())->toIso8601String(),
                'end_at' => optional($schedule->endAtUtc())->toIso8601String(),
                'scheduled_time' => $schedule->scheduled_time,
                'notes' => $schedule->notes,
                'is_schedule' => true,
                'schedule_id' => $schedule->id,
                'created_at' => $schedule->created_at,
                'updated_at' => $schedule->updated_at,
            ];
        });

        // Combine actual inspections with pending schedules
        $allInspections = $inspections->concat($pendingInspections);

        return response()->json($allInspections);
    }

    /**
     * Store a newly created inspection
     */
    public function store(StoreInspectionRequest $request)
    {
        $user = Auth::guard('api')->user();

        // Only enforce scheduled-time validation for regular teknisi users
        if (!($user->isAdmin() || $user->isSupervisor() || $user->isChecker())) {
            $validationResult = $this->inspectionService->validateInspectionTime(
                $request->input('apar_qrCode'),
                $user->id
            );

            if (!$validationResult['valid']) {
                return response()->json([
                    'valid' => false,
                    'message' => $validationResult['message'],
                ], $validationResult['status_code']);
            }
        }

        // Create inspection using service
        $result = $this->inspectionService->createInspection(
            $request->all(),
            $user->id
        );

        if (!$result['success']) {
            return response()->json([
                'message' => $result['message'],
                'error' => $result['error'] ?? null,
                'location_valid' => $result['location_valid'] ?? false,
            ], $result['status_code']);
        }

        return response()->json([
            'message' => $result['message'],
            'inspection' => $result['inspection'],
            'location_valid' => $result['location_valid'],
        ], $result['status_code']);
    }

    /**
     * Display the specified inspection
     */
    public function show(Inspection $inspection)
    {
        return response()->json($inspection->load([
            'apar.aparType',
            'user',
            'inspectionDamages.damageCategory',
            'repairApproval.approver',
            'repairApproval.repairReport'
        ]));
    }

    /**
     * Update the specified inspection
     */
    public function update(Request $request, Inspection $inspection)
    {
        $request->validate([
            'condition' => 'sometimes|in:' . implode(',', config('inspection.conditions')),
            'notes' => 'nullable|string',
        ]);

        $inspection->update($request->only(['condition', 'notes']));

        return response()->json([
            'message' => 'Inspeksi berhasil diperbarui',
            'inspection' => $inspection->load(['apar.aparType', 'user']),
        ]);
    }

    /**
     * Remove the specified inspection
     */
    public function destroy(Inspection $inspection)
    {
        // Delete associated photos
        if ($inspection->photo_url) {
            $photoPath = str_replace('/storage/', '', $inspection->photo_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($photoPath);
        }

        if ($inspection->selfie_url) {
            $selfiePath = str_replace('/storage/', '', $inspection->selfie_url);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($selfiePath);
        }

        $inspection->delete();

        return response()->json([
            'message' => 'Inspeksi berhasil dihapus',
        ]);
    }

    /**
     * Validate inspection time to prevent manipulation
     */
    public function validateInspectionTime(Request $request)
    {
        $validated = $request->validate([
            'apar_qrCode' => 'required|string',
        ]);

        try {
            $result = $this->inspectionService->validateInspectionTime(
                $validated['apar_qrCode'],
                Auth::id()
            );

            return response()->json($result, $result['status_code']);
        } catch (\Exception $e) {
            \Log::error('Validation error: ' . $e->getMessage());
            
            return response()->json([
                'valid' => false,
                'message' => 'Terjadi kesalahan saat memvalidasi jadwal inspeksi'
            ], 500);
        }
    }

    /**
     * Get inspections pending review based on user role
     */
    public function pendingReview()
    {
        $user = Auth::guard('api')->user();
        $query = Inspection::with([
            'apar.aparType',
            'user',
            'inspectionDamages.damageCategory',
            'checker', // Load checker info
        ])->orderBy('created_at', 'desc');

        if ($user->isChecker()) {
            // Checker only sees inspections pending checker review
            $query->where('inspection_status', 'pending_checker');
        } elseif ($user->isSupervisor() || $user->isAdmin()) {
            $statuses = ['approved_by_checker', 'pending_review'];
            
            // Admins also see inspections rejected by checkers
            if ($user->isAdmin()) {
                $statuses[] = 'rejected_by_checker';
            }
            
            $query->whereIn('inspection_status', $statuses);
        } else {
            // Regular users shouldn't see this list
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
                'data' => []
            ], 403);
        }

        $inspections = $query->get();

        return response()->json([
            'success' => true,
            'data' => $inspections,
        ]);
    }

    /**
     * Get inspections history for the checker
     */
    public function history()
    {
        $user = Auth::guard('api')->user();

        if (!$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
                'data' => []
            ], 403);
        }

        $inspections = Inspection::with([
            'apar.aparType',
            'user',
            'inspectionDamages.damageCategory',
            'checker',
            'repairApproval.approver'
        ])
        ->where('checker_id', $user->id)
        ->whereNotNull('checker_reviewed_at')
        ->orderBy('checker_reviewed_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $inspections,
        ]);
    }

    /**
     * Approve an inspection (Checker or Supervisor)
     */
    public function approveInspection(Request $request, Inspection $inspection)
    {
        $user = Auth::guard('api')->user();
        
        // Check permissions
        if (!$user->isAdmin() && !$user->isSupervisor() && !$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk menyetujui inspeksi',
            ], 403);
        }

        $request->validate([
            'notes' => 'nullable|string',
        ]);

        // CHECKER APPROVAL FLOW
        if ($user->isChecker()) {
            if ($inspection->inspection_status !== 'pending_checker') {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspeksi ini tidak dalam status menunggu checker',
                ], 422);
            }

            $inspection->approveByChecker($user->id, $request->notes);

            return response()->json([
                'success' => true,
                'message' => 'Inspeksi berhasil dicek dan diteruskan ke Supervisor',
                'data' => $inspection->fresh(['apar.aparType', 'user']),
            ]);
        }

        // SUPERVISOR APPROVAL FLOW (Admin also acts as Supervisor here)
        if ($user->isSupervisor() || $user->isAdmin()) {
            // Supervisor approves "approved_by_checker" or legacy "pending_review"
            if (!in_array($inspection->inspection_status, ['approved_by_checker', 'pending_review'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspeksi ini tidak dalam status menunggu review supervisor',
                ], 422);
            }

            $request->validate([
                'assigned_teknisi_id' => 'nullable|exists:users,id',
                'schedule_date' => 'nullable|date|after_or_equal:today',
                'schedule_time' => 'nullable|date_format:H:i',
            ]);

            // Approve the inspection
            $inspection->approveInspection($user->id, $request->notes);

            // If there's damage, create repair approval and optionally assign teknisi
            if ($inspection->requires_repair) {
                // Create repair approval if not exists
                if (!$inspection->repairApproval) {
                    $repairApproval = \App\Models\RepairApproval::create([
                        'inspection_id' => $inspection->id,
                        'status' => 'approved', // Pre-approved by supervisor
                        'approved_by' => $user->id,
                        'supervisor_notes' => $request->notes ?? 'Disetujui oleh supervisor',
                        'approved_at' => now(),
                        'decision_made_at' => now(),
                    ]);
                } else {
                    // Update existing if somehow exists
                     $inspection->repairApproval->update([
                        'status' => 'approved',
                        'approved_by' => $user->id,
                        'supervisor_notes' => $request->notes ?? 'Disetujui oleh supervisor',
                        'approved_at' => now(),
                        'decision_made_at' => now(),
                    ]);
                }

                // Update inspection repair status
                $inspection->update(['repair_status' => 'approved']);

                // Update APAR status
                $inspection->apar->update(['status' => 'needs_repair']);

                // If teknisi is assigned, create repair schedule
                if ($request->assigned_teknisi_id && $request->schedule_date && $request->schedule_time) {
                    // Check for schedule conflicts
                    // ... (Conflict check logic ideally moved to service but keeping inline for now or calling service)
                     $conflictCheck = $this->inspectionService->scheduleService->checkScheduleConflict(
                        $request->assigned_teknisi_id,
                        $request->schedule_date,
                        $request->schedule_time
                    );

                    if ($conflictCheck['has_conflict']) {
                         return response()->json([
                            'success' => false,
                            'message' => $conflictCheck['message'],
                            'conflicting_schedules' => $conflictCheck['conflicting_schedules'],
                        ], 422);
                    }

                    // Create repair schedule
                    $appTimezone = config('app.timezone', 'UTC');
                    $startAtLocal = \Carbon\Carbon::parse($request->schedule_date . ' ' . $request->schedule_time, $appTimezone);
                    $endAtLocal = $startAtLocal->copy()->addHour();

                    $schedule = \App\Models\InspectionSchedule::create([
                        'apar_id' => $inspection->apar_id,
                        'assigned_user_id' => $request->assigned_teknisi_id,
                        'start_at' => $startAtLocal,
                        'end_at' => $endAtLocal,
                        'frequency' => 'once',
                        'is_active' => true,
                        'notes' => 'Jadwal perbaikan dari inspeksi #' . $inspection->id,
                    ]);

                    // Update APAR status to under_repair
                    $inspection->apar->update(['status' => 'under_repair']);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Inspeksi berhasil disetujui sepenuhnya',
                'data' => $inspection->fresh([
                    'apar.aparType',
                    'user',
                    'reviewer',
                    'checker',
                    'repairApproval',
                ]),
            ]);
        }
    }

    /**
     * Reject an inspection (Checker or Supervisor)
     */
    public function rejectInspection(Request $request, Inspection $inspection)
    {
        $user = Auth::guard('api')->user();
        
        // Check permissions
        if (!$user->isAdmin() && !$user->isSupervisor() && !$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk menolak inspeksi',
            ], 403);
        }

        $request->validate([
            'notes' => 'required|string|min:10',
        ], [
            'notes.required' => 'Alasan penolakan wajib diisi',
            'notes.min' => 'Alasan penolakan minimal 10 karakter',
        ]);

        // CHECKER REJECTION FLOW
        if ($user->isChecker()) {
            if ($inspection->inspection_status !== 'pending_checker') {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspeksi ini tidak dalam status menunggu checker',
                ], 422);
            }

            $inspection->rejectByChecker($user->id, $request->notes);

            // Note: User requirement says "Admin menentukan apakah perlu dilakukan penjadwalan inspeksi ulang".
            // We leave it as rejected_by_checker. Admin can view these and take action (e.g., create schedule manually).
            // For now, we don't auto-create re-inspection schedule for Checker rejection to respect "Admin determines" rule.

            return response()->json([
                'success' => true,
                'message' => 'Inspeksi ditolak. Laporan dikirim ke Admin.',
                'data' => $inspection->fresh(['apar.aparType', 'user']),
            ]);
        }

        // SUPERVISOR REJECTION FLOW
        if ($user->isSupervisor() || $user->isAdmin()) {
             // Supervisor rejects "approved_by_checker" or legacy "pending_review"
             if (!in_array($inspection->inspection_status, ['approved_by_checker', 'pending_review'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspeksi ini tidak dalam status menunggu review supervisor',
                ], 422);
            }

            // Reject the inspection
            $inspection->rejectInspection($user->id, $request->notes);

            // Create re-inspection schedule for the teknisi (Existing Flow compatibility)
            // Or should we stop and let Admin decide?
            // "Informasi penolakan dikirim ke Admin... Admin menentukan apakah perlu dilakukan inspeksi ulang"
            // The existing code AUTO-CREATED it. To match "Admin menentukan", we should probably STOP auto-creation.
            // But to "not break existing process", maybe we keep it? 
            // Let's stick to the existing code for Supervisor rejection for now to minimize disruption, 
            // OR change it to match the strict new requirement.
            // "Alur ini tidak boleh memutus proses yang sudah ada". 
            // I will keep the auto-reinspection for Supervisor for now, as that's likely the "Admin Logic" already encoded.
            
            $reinspectionService = new \App\Services\ReinspectionService();
            
            // Create a mock RepairApproval for the rejection workflow
            $mockApproval = new \App\Models\RepairApproval([
                'rejection_reason' => 'Inspeksi ditolak oleh supervisor',
                'supervisor_notes' => $request->notes,
            ]);
            
            $reinspectionSchedule = $reinspectionService->createReinspectionSchedule($inspection, $mockApproval);

            return response()->json([
                'success' => true,
                'message' => 'Inspeksi ditolak. Jadwal inspeksi ulang telah dibuat otomatis (System).',
                'data' => [
                    'inspection' => $inspection->fresh(['apar.aparType', 'user', 'reviewer']),
                    'reinspection_schedule' => $reinspectionSchedule,
                ],
            ]);
        }
    }
}
