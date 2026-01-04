<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepairReport;
use App\Models\RepairApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Services\ImageService;
use App\Services\ReinspectionService;

class RepairReportController extends Controller
{
    /**
     * Display a listing of repair reports.
     */
    public function index(Request $request)
    {
        $query = RepairReport::with(['repairApproval.inspection.apar.aparType', 'reporter']);

        // Filter by repair approval status
        if ($request->has('status')) {
            $query->whereHas('repairApproval', function ($q) use ($request) {
                $q->where('status', $request->status);
            });
        }

        $reports = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * Display the specified repair report.
     */
    public function show(RepairReport $repairReport)
    {
        $repairReport->load([
            'repairApproval.inspection.apar.aparType',
            'repairApproval.inspection.user',
            'reporter'
        ]);

        return response()->json([
            'success' => true,
            'data' => $repairReport
        ]);
    }

    /**
     * Store a newly created repair report.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'repair_approval_id' => 'required|exists:repair_approvals,id',
            'repair_description' => 'required|string',
            'before_photo' => 'required|image|max:5120', // General before photo
            'after_photo' => 'required|image|max:5120', // General after photo
            'repair_lat' => 'nullable|numeric|between:-90,90',
            'repair_lng' => 'nullable|numeric|between:-180,180',
            'repair_completed_at' => 'required|date',
            'needs_reinspection' => 'boolean',
            'damage_photos' => 'nullable|array',
            'damage_photos.*' => 'image|max:5120', // Photos for specific damages
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if repair approval exists and is approved
        $repairApproval = RepairApproval::findOrFail($request->repair_approval_id);

        if ($repairApproval->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya perbaikan yang disetujui yang dapat dilaporkan'
            ], 422);
        }

        // Check if repair report already exists
        if ($repairApproval->repairReport()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan sudah ada untuk inspeksi ini'
            ], 422);
        }

        $user = Auth::guard('api')->user();
        $imageService = new ImageService();

        // 1. Process specific damage repair photos if provided
        if ($request->has('damage_photos')) {
            $inspection = $repairApproval->inspection;
            // Load damages to verify ownership
            $inspection->load('inspectionDamages');

            foreach ($request->file('damage_photos') as $damageId => $photo) {
                // Verify this damage belongs to this inspection
                $damage = $inspection->inspectionDamages->find($damageId);
                if ($damage) {
                    $path = $imageService->compressImage(
                        $photo,
                        'inspections/repairs',
                        80,
                        1920,
                        1080
                    );
                    $damage->update([
                        'repair_photo_url' => Storage::url($path)
                    ]);
                }
            }
        }

        // 2. Store general photos with compression
        $beforePhotoPath = $imageService->compressImage(
            $request->file('before_photo'),
            'repairs/before',
            80,
            1920,
            1080
        );
        $afterPhotoPath = $imageService->compressImage(
            $request->file('after_photo'),
            'repairs/after',
            80,
            1920,
            1080
        );

        // Create repair report with pending_review status
        // Supervisor will review and decide: approve, rework, or reject (not fixable)
        $repairReport = RepairReport::create([
            'repair_approval_id' => $repairApproval->id,
            'reported_by' => $user->id,
            'repair_description' => $request->repair_description,
            'before_photo_url' => Storage::url($beforePhotoPath),
            'after_photo_url' => Storage::url($afterPhotoPath),
            'repair_lat' => $request->repair_lat,
            'repair_lng' => $request->repair_lng,
            'repair_completed_at' => $request->repair_completed_at,
            'status' => 'pending_review', // Requires supervisor review
        ]);

        // Update inspection to indicate repair report submitted
        $repairApproval->inspection->update([
            'repair_notes' => $request->repair_description
        ]);

        \Log::info('Repair report submitted for review', [
            'repair_report_id' => $repairReport->id,
            'repair_approval_id' => $repairApproval->id,
            'apar_id' => $repairApproval->inspection->apar_id,
            'teknisi_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan berhasil disimpan. Menunggu review dari supervisor.',
            'data' => $repairReport->load([
                'repairApproval.inspection.apar.aparType',
                'reporter'
            ])
        ], 201);
    }

    /**
     * Update the specified repair report.
     */
    public function update(Request $request, RepairReport $repairReport)
    {
        $validator = Validator::make($request->all(), [
            'repair_description' => 'sometimes|required|string',
            'before_photo' => 'sometimes|required|image|max:5120',
            'after_photo' => 'sometimes|required|image|max:5120',
            'repair_lat' => 'nullable|numeric|between:-90,90',
            'repair_lng' => 'nullable|numeric|between:-180,180',
            'repair_completed_at' => 'sometimes|required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $imageService = new ImageService();
        $updateData = $request->only(['repair_description', 'repair_lat', 'repair_lng', 'repair_completed_at']);

        // Handle photo updates
        if ($request->hasFile('before_photo')) {
            // Delete old photo
            if ($repairReport->before_photo_url) {
                $oldPath = str_replace('/storage/', '', $repairReport->before_photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $beforePhotoPath = $imageService->compressImage(
                $request->file('before_photo'),
                'repairs/before',
                80,
                1920,
                1080
            );
            $updateData['before_photo_url'] = Storage::url($beforePhotoPath);
        }

        if ($request->hasFile('after_photo')) {
            // Delete old photo
            if ($repairReport->after_photo_url) {
                $oldPath = str_replace('/storage/', '', $repairReport->after_photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $afterPhotoPath = $imageService->compressImage(
                $request->file('after_photo'),
                'repairs/after',
                80,
                1920,
                1080
            );
            $updateData['after_photo_url'] = Storage::url($afterPhotoPath);
        }

        $repairReport->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan berhasil diperbarui',
            'data' => $repairReport->load([
                'repairApproval.inspection.apar.aparType',
                'reporter'
            ])
        ]);
    }

    /**
     * Remove the specified repair report.
     */
    public function destroy(RepairReport $repairReport)
    {
        // Delete associated photos
        if ($repairReport->before_photo_url) {
            $beforePath = str_replace('/storage/', '', $repairReport->before_photo_url);
            Storage::disk('public')->delete($beforePath);
        }

        if ($repairReport->after_photo_url) {
            $afterPath = str_replace('/storage/', '', $repairReport->after_photo_url);
            Storage::disk('public')->delete($afterPath);
        }

        $repairReport->delete();

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan berhasil dihapus'
        ]);
    }

    /**
     * Get repair report statistics.
     */
    public function stats()
    {
        $total = RepairReport::count();
        $thisMonth = RepairReport::whereMonth('created_at', now()->month)->count();
        $thisYear = RepairReport::whereYear('created_at', now()->year)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'this_month' => $thisMonth,
                'this_year' => $thisYear,
            ]
        ]);
    }

    /**
     * Get repair reports pending supervisor review
     */
    public function pendingReview()
    {
        $reports = RepairReport::with([
            'repairApproval.inspection.apar.aparType',
            'repairApproval.inspection.user',
            'repairApproval.inspection.inspectionDamages.damageCategory',
            'reporter'
        ])
            ->where('status', 'pending_review')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    /**
     * Approve a repair report (supervisor only)
     * This marks the repair as successful and sets APAR back to active
     */
    public function approve(Request $request, RepairReport $repairReport)
    {
        $user = Auth::guard('api')->user();
        
        // Only admin/supervisor can approve
        if (!$user->isAdmin() && !$user->isSupervisor()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau supervisor yang dapat menyetujui laporan perbaikan',
            ], 403);
        }

        // Check if report is pending review
        if ($repairReport->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan ini tidak dalam status menunggu review',
            ], 422);
        }

        $request->validate([
            'notes' => 'nullable|string',
        ]);

        // Approve the repair report
        $repairReport->approve($user->id, $request->notes);

        // Mark repair approval as completed
        $repairApproval = $repairReport->repairApproval;
        $repairApproval->markCompleted($request->notes);

        // Update inspection repair status
        $repairApproval->inspection->update([
            'repair_status' => 'completed',
        ]);

        // Update APAR status to active
        $apar = $repairApproval->inspection->apar;
        $apar->update(['status' => 'active']);

        \Log::info('Repair report approved, APAR set to active', [
            'repair_report_id' => $repairReport->id,
            'apar_id' => $apar->id,
            'supervisor_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan disetujui. APAR telah aktif kembali.',
            'data' => $repairReport->fresh([
                'repairApproval.inspection.apar.aparType',
                'reviewer',
                'reporter',
            ]),
        ]);
    }

    /**
     * Request rework on a repair report (supervisor only)
     * This assigns the same teknisi to do additional repair work
     */
    public function requestRework(Request $request, RepairReport $repairReport)
    {
        $user = Auth::guard('api')->user();
        
        // Only admin/supervisor can request rework
        if (!$user->isAdmin() && !$user->isSupervisor()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau supervisor yang dapat meminta perbaikan ulang',
            ], 403);
        }

        // Check if report is pending review
        if ($repairReport->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan ini tidak dalam status menunggu review',
            ], 422);
        }

        $request->validate([
            'notes' => 'required|string|min:10',
            'schedule_date' => 'required|date|after_or_equal:today',
            'schedule_time' => 'required|date_format:H:i',
        ], [
            'notes.required' => 'Catatan perbaikan ulang wajib diisi',
            'notes.min' => 'Catatan minimal 10 karakter',
            'schedule_date.required' => 'Tanggal jadwal wajib diisi',
            'schedule_time.required' => 'Waktu jadwal wajib diisi',
        ]);

        // Mark report as needs rework
        $repairReport->markNeedsRework($user->id, $request->notes);

        $repairApproval = $repairReport->repairApproval;
        $inspection = $repairApproval->inspection;
        $teknisiId = $repairReport->reported_by; // Same teknisi

        // Create new repair schedule for the same teknisi
        $appTimezone = config('app.timezone', 'UTC');
        $startAtLocal = \Carbon\Carbon::parse($request->schedule_date . ' ' . $request->schedule_time, $appTimezone);
        $endAtLocal = $startAtLocal->copy()->addHour();

        $schedule = \App\Models\InspectionSchedule::create([
            'apar_id' => $inspection->apar_id,
            'assigned_user_id' => $teknisiId,
            'start_at' => $startAtLocal,
            'end_at' => $endAtLocal,
            'frequency' => 'once',
            'is_active' => true,
            'notes' => "Perbaikan ulang dari laporan #" . $repairReport->id . "\n\nCatatan Supervisor: " . $request->notes,
        ]);

        // Reset repair approval status so teknisi can submit new report
        $repairApproval->update([
            'status' => 'approved', // Keep approved so teknisi can work
        ]);

        // Send notification to teknisi
        try {
            \App\Models\Notification::create([
                'user_id' => $teknisiId,
                'type' => 'repair_rework',
                'title' => 'Perbaikan Ulang Diperlukan',
                'content' => "Supervisor meminta perbaikan ulang untuk APAR {$inspection->apar->serial_number}. Jadwal: " . $startAtLocal->format('d M Y H:i'),
                'data' => json_encode([
                    'repair_report_id' => $repairReport->id,
                    'apar_id' => $inspection->apar_id,
                    'schedule_id' => $schedule->id,
                    'supervisor_notes' => $request->notes,
                ]),
                'status' => 'sent',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send rework notification: ' . $e->getMessage());
        }

        \Log::info('Repair rework requested', [
            'repair_report_id' => $repairReport->id,
            'new_schedule_id' => $schedule->id,
            'teknisi_id' => $teknisiId,
            'supervisor_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perbaikan ulang berhasil. Jadwal baru telah dibuat untuk teknisi.',
            'data' => [
                'repair_report' => $repairReport->fresh([
                    'repairApproval.inspection.apar.aparType',
                    'reviewer',
                    'reporter',
                ]),
                'new_schedule' => $schedule,
            ],
        ]);
    }

    /**
     * Reject a repair report (supervisor only)
     * This marks the APAR as not fixable
     */
    public function reject(Request $request, RepairReport $repairReport)
    {
        $user = Auth::guard('api')->user();
        
        // Only admin/supervisor can reject
        if (!$user->isAdmin() && !$user->isSupervisor()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau supervisor yang dapat menolak laporan perbaikan',
            ], 403);
        }

        // Check if report is pending review
        if ($repairReport->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan ini tidak dalam status menunggu review',
            ], 422);
        }

        $request->validate([
            'notes' => 'required|string|min:10',
        ], [
            'notes.required' => 'Alasan penolakan wajib diisi',
            'notes.min' => 'Alasan minimal 10 karakter',
        ]);

        // Reject the repair report
        $repairReport->reject($user->id, $request->notes);

        $repairApproval = $repairReport->repairApproval;
        $inspection = $repairApproval->inspection;
        $apar = $inspection->apar;

        // Mark repair approval as rejected/completed
        $repairApproval->update([
            'status' => 'rejected',
            'rejection_reason' => 'APAR tidak dapat diperbaiki (not fixable)',
        ]);

        // Update inspection
        $inspection->update([
            'repair_status' => 'rejected',
            'repair_notes' => $request->notes,
        ]);

        // Set APAR as not fixable
        $apar->update(['status' => 'not_fixable']);

        \Log::info('Repair report rejected, APAR marked as not fixable', [
            'repair_report_id' => $repairReport->id,
            'apar_id' => $apar->id,
            'supervisor_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan ditolak. APAR ditandai sebagai tidak dapat diperbaiki.',
            'data' => $repairReport->fresh([
                'repairApproval.inspection.apar.aparType',
                'reviewer',
                'reporter',
            ]),
        ]);
    }
}
