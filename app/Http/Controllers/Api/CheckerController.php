<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Models\InspectionSchedule;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckerController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get checker dashboard statistics and data.
     */
    public function dashboard()
    {
        $user = Auth::guard('api')->user();

        if (!$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya checker yang dapat mengakses dashboard ini',
            ], 403);
        }

        // Get pending reviews count
        $pendingReviewsCount = Inspection::where('inspection_status', 'pending_checker_review')
            ->whereHas('schedule', function ($query) use ($user) {
                $query->where('assigned_checker_id', $user->id);
            })
            ->count();

        // Get pending reviews list (limited)
        $pendingReviews = Inspection::with([
            'apar.aparType',
            'user',
            'schedule',
            'inspectionDamages.damageCategory',
        ])
            ->where('inspection_status', 'pending_checker_review')
            ->whereHas('schedule', function ($query) use ($user) {
                $query->where('assigned_checker_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get upcoming inspections assigned to this checker
        $upcomingInspections = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('assigned_checker_id', $user->id)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->where('start_at', '>=', now())
            ->orderBy('start_at')
            ->limit(10)
            ->get();

        // Get today's inspections
        $todayInspections = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('assigned_checker_id', $user->id)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->whereDate('start_at', today())
            ->orderBy('start_at')
            ->get();

        // Get recently completed reviews (by this checker)
        $recentlyCompleted = Inspection::with([
            'apar.aparType',
            'user',
        ])
            ->where('checked_by', $user->id)
            ->whereNotNull('checked_at')
            ->orderBy('checked_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'pending_reviews' => $pendingReviewsCount,
                    'today_inspections' => $todayInspections->count(),
                    'upcoming_inspections' => $upcomingInspections->count(),
                ],
                'pending_reviews' => $pendingReviews,
                'today_inspections' => $todayInspections,
                'upcoming_inspections' => $upcomingInspections,
                'recently_completed' => $recentlyCompleted,
            ],
        ]);
    }

    /**
     * Get inspections pending checker review.
     */
    public function pendingReview(Request $request)
    {
        $user = Auth::guard('api')->user();

        if (!$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya checker yang dapat mengakses halaman ini',
            ], 403);
        }

        $query = Inspection::with([
            'apar.aparType',
            'user',
            'schedule.assignedChecker',
            'inspectionDamages.damageCategory',
        ])
            ->where('inspection_status', 'pending_checker_review')
            ->whereHas('schedule', function ($query) use ($user) {
                $query->where('assigned_checker_id', $user->id);
            });

        // Optional filtering
        if ($request->has('apar_id')) {
            $query->where('apar_id', $request->apar_id);
        }

        $inspections = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $inspections,
        ]);
    }

    /**
     * Get a specific inspection for review.
     */
    public function showForReview(Inspection $inspection)
    {
        $user = Auth::guard('api')->user();

        if (!$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya checker yang dapat mengakses halaman ini',
            ], 403);
        }

        // Verify this checker is assigned to this inspection's schedule
        if ($inspection->schedule && $inspection->schedule->assigned_checker_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak ditugaskan untuk mereview inspeksi ini',
            ], 403);
        }

        // Check if inspection is in pending_checker_review status
        if ($inspection->inspection_status !== 'pending_checker_review') {
            return response()->json([
                'success' => false,
                'message' => 'Inspeksi ini tidak dalam status menunggu review checker',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $inspection->load([
                'apar.aparType',
                'user',
                'schedule.assignedUser',
                'schedule.assignedChecker',
                'inspectionDamages.damageCategory',
            ]),
        ]);
    }

    /**
     * Submit checker review for an inspection.
     */
    public function submitReview(Request $request, Inspection $inspection)
    {
        $user = Auth::guard('api')->user();

        if (!$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya checker yang dapat mereview inspeksi',
            ], 403);
        }

        // Prevent self-review: checker cannot review their own inspection
        if ($inspection->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat mereview inspeksi yang Anda lakukan sendiri',
            ], 403);
        }

        // Verify this checker is assigned to this inspection's schedule
        if ($inspection->schedule && $inspection->schedule->assigned_checker_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak ditugaskan untuk mereview inspeksi ini',
            ], 403);
        }

        // Check if inspection is in pending_checker_review status
        if ($inspection->inspection_status !== 'pending_checker_review') {
            return response()->json([
                'success' => false,
                'message' => 'Inspeksi ini tidak dalam status menunggu review checker',
            ], 422);
        }

        $request->validate([
            'is_valid' => 'required|boolean',
            'checker_notes' => 'nullable|string|max:2000',
            'checker_condition' => 'nullable|in:good,damaged',
            'checker_damages' => 'nullable|array',
            'checker_damages.*.category_id' => 'required_with:checker_damages|exists:damage_categories,id',
            'checker_damages.*.notes' => 'nullable|string',
            'checker_damages.*.severity' => 'required_with:checker_damages|in:low,medium,high,critical',
            'checker_damages.*.is_functional' => 'required_with:checker_damages|boolean',
            'checker_damages.*.checker_notes' => 'nullable|string',
        ]);

        try {
            $inspection->submitCheckerReview(
                $user->id,
                $request->input('checker_notes'),
                $request->input('checker_condition'),
                $request->input('checker_damages'),
                $request->input('is_valid', true)
            );

            Log::info('Checker review submitted', [
                'inspection_id' => $inspection->id,
                'checker_id' => $user->id,
                'is_edited' => $inspection->is_checker_edited,
            ]);

            // Notify supervisors that inspection is ready for final review
            try {
                $this->notificationService->notifySupervisorPendingReview($inspection);
            } catch (\Exception $e) {
                Log::error('Failed to notify supervisors', [
                    'inspection_id' => $inspection->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Review berhasil disimpan. Inspeksi diteruskan ke supervisor.',
                'data' => $inspection->fresh([
                    'apar.aparType',
                    'user',
                    'checker',
                    'inspectionDamages.damageCategory',
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to submit checker review', [
                'inspection_id' => $inspection->id,
                'checker_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan review: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get inspection timeline/history for an APAR.
     */
    public function getInspectionTimeline(Request $request)
    {
        $request->validate([
            'apar_id' => 'required|exists:apars,id',
        ]);

        $aparId = $request->input('apar_id');

        // Get all inspections for this APAR, ordered by date
        $inspections = Inspection::with([
            'apar.aparType',
            'user',
            'checker',
            'reviewer',
            'inspectionDamages.damageCategory',
            'repairApproval.approver',
            'parentInspection',
            'reinspections',
        ])
            ->where('apar_id', $aparId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Build timeline entries
        $timeline = $inspections->map(function ($inspection) {
            $entry = [
                'id' => $inspection->id,
                'type' => $this->getInspectionType($inspection),
                'date' => $inspection->created_at,
                'technician' => $inspection->user ? [
                    'id' => $inspection->user->id,
                    'name' => $inspection->user->name,
                ] : null,
                'checker' => $inspection->checker ? [
                    'id' => $inspection->checker->id,
                    'name' => $inspection->checker->name,
                    'checked_at' => $inspection->checked_at,
                    'was_edited' => $inspection->is_checker_edited,
                ] : null,
                'supervisor' => $inspection->reviewer ? [
                    'id' => $inspection->reviewer->id,
                    'name' => $inspection->reviewer->name,
                    'reviewed_at' => $inspection->reviewed_at,
                ] : null,
                'status' => $inspection->inspection_status,
                'condition' => $inspection->condition,
                'original_report' => $inspection->getOriginalReport(),
                'corrected_report' => $inspection->getCorrectedReport(),
                'damages' => $inspection->inspectionDamages,
                'photo_url' => $inspection->photo_url,
                'selfie_url' => $inspection->selfie_url,
                'notes' => $inspection->notes,
                'checker_notes' => $inspection->checker_notes,
                'review_notes' => $inspection->review_notes,
                'requires_repair' => $inspection->requires_repair,
                'repair_status' => $inspection->repair_status,
                'parent_inspection_id' => $inspection->parent_inspection_id,
                'reinspection_count' => $inspection->reinspection_count,
            ];

            return $entry;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'apar_id' => $aparId,
                'timeline' => $timeline,
            ],
        ]);
    }

    /**
     * Get inspection type label for timeline.
     */
    private function getInspectionType(Inspection $inspection): string
    {
        if ($inspection->parent_inspection_id && $inspection->repair_status !== 'none') {
            return 'repair';
        }

        if ($inspection->reinspection_count > 0) {
            return 'reinspection';
        }

        return 'inspection';
    }

    /**
     * Get upcoming schedules for checker.
     */
    public function mySchedules()
    {
        $user = Auth::guard('api')->user();

        if (!$user->isChecker()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya checker yang dapat mengakses halaman ini',
            ], 403);
        }

        $schedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('assigned_checker_id', $user->id)
            ->where('is_active', true)
            ->orderBy('start_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }
}
