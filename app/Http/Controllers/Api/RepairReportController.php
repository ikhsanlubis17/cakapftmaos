<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepairReport;
use App\Models\RepairApproval;
use App\Http\Requests\Repair\StoreRepairReportRequest;
use App\Http\Requests\Repair\UpdateRepairReportRequest;
use App\Services\RepairReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RepairReportController extends Controller
{
    public function __construct(protected RepairReportService $repairReportService)
    {
    }

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
    public function store(StoreRepairReportRequest $request)
    {
        $repairApproval = RepairApproval::findOrFail($request->repair_approval_id);

        if ($repairApproval->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya perbaikan yang disetujui yang dapat dilaporkan'
            ], 422);
        }

        if ($repairApproval->repairReport()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan sudah ada untuk inspeksi ini'
            ], 422);
        }

        $user = Auth::guard('api')->user();

        $files = [
            'before_photo' => $request->file('before_photo'),
            'after_photo' => $request->file('after_photo'),
            'damage_photos' => $request->file('damage_photos', []),
        ];

        $repairReport = $this->repairReportService->create(
            $repairApproval,
            $request->validated(),
            $user->id,
            $files
        );

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
    public function update(UpdateRepairReportRequest $request, RepairReport $repairReport)
    {
        $files = [];
        if ($request->hasFile('before_photo')) {
            $files['before_photo'] = $request->file('before_photo');
        }
        if ($request->hasFile('after_photo')) {
            $files['after_photo'] = $request->file('after_photo');
        }

        $updated = $this->repairReportService->update($repairReport, $request->validated(), $files);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan berhasil diperbarui',
            'data' => $updated->load([
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
        $this->repairReportService->delete($repairReport);

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
     */
    public function approve(Request $request, RepairReport $repairReport)
    {
        $user = Auth::guard('api')->user();

        if (!$user->isAdmin() && !$user->isSupervisor()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau supervisor yang dapat menyetujui laporan perbaikan',
            ], 403);
        }

        if ($repairReport->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan ini tidak dalam status menunggu review',
            ], 422);
        }

        $request->validate([
            'notes' => 'nullable|string',
        ]);

        $approved = $this->repairReportService->approve($repairReport, $user->id, $request->notes);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan disetujui. APAR telah aktif kembali.',
            'data' => $approved->fresh([
                'repairApproval.inspection.apar.aparType',
                'reviewer',
                'reporter',
            ]),
        ]);
    }

    /**
     * Request rework on a repair report (supervisor only)
     */
    public function requestRework(Request $request, RepairReport $repairReport)
    {
        $user = Auth::guard('api')->user();

        if (!$user->isAdmin() && !$user->isSupervisor()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau supervisor yang dapat meminta perbaikan ulang',
            ], 403);
        }

        if ($repairReport->status !== 'pending_review') {
            return response()->json([
                'success' => false,
                'message' => 'Laporan perbaikan ini tidak dalam status menunggu review',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => 'required|string|min:10',
            'schedule_date' => 'required|date|after_or_equal:today',
            'schedule_time' => 'required|date_format:H:i',
        ], [
            'notes.required' => 'Catatan perbaikan ulang wajib diisi',
            'notes.min' => 'Catatan minimal 10 karakter',
            'schedule_date.required' => 'Tanggal jadwal wajib diisi',
            'schedule_time.required' => 'Waktu jadwal wajib diisi',
        ]);

        $result = $this->repairReportService->requestRework(
            $repairReport,
            $user->id,
            $validated['notes'],
            $validated['schedule_date'],
            $validated['schedule_time']
        );

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perbaikan ulang berhasil. Jadwal baru telah dibuat untuk teknisi.',
            'data' => [
                'repair_report' => $result['repair_report']->fresh([
                    'repairApproval.inspection.apar.aparType',
                    'reviewer',
                    'reporter',
                ]),
                'new_schedule' => $result['new_schedule'],
            ],
        ]);
    }

    /**
     * Reject a repair report (supervisor only)
     */
    public function reject(Request $request, RepairReport $repairReport)
    {
        $user = Auth::guard('api')->user();

        if (!$user->isAdmin() && !$user->isSupervisor()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau supervisor yang dapat menolak laporan perbaikan',
            ], 403);
        }

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

        $rejected = $this->repairReportService->reject($repairReport, $user->id, $request->notes);

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan ditolak. APAR ditandai sebagai tidak dapat diperbaiki.',
            'data' => $rejected->fresh([
                'repairApproval.inspection.apar.aparType',
                'reviewer',
                'reporter',
            ]),
        ]);
    }
}
