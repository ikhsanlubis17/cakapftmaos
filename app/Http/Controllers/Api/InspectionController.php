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
        if (!($user->isAdmin() || $user->isSupervisor())) {
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
        try {
            $request->validate([
                'apar_qrCode' => 'required|string',
            ]);

            $result = $this->inspectionService->validateInspectionTime(
                $request->input('apar_qrCode'),
                Auth::id()
            );

            return response()->json($result, $result['status_code']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Terjadi kesalahan saat memvalidasi jadwal inspeksi'
            ], 500);
        }
    }
}
