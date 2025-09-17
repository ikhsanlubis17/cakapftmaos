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
            $query->whereHas('repairApproval', function($q) use ($request) {
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
            'before_photo' => 'required|image|max:5120', // Foto sebelum perbaikan
            'after_photo' => 'required|image|max:5120', // Foto setelah perbaikan
            'repair_lat' => 'nullable|numeric|between:-90,90',
            'repair_lng' => 'nullable|numeric|between:-180,180',
            'repair_completed_at' => 'required|date',
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

        // Store photos with compression
        $imageService = new ImageService();
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

        // Create repair report
        $repairReport = RepairReport::create([
            'repair_approval_id' => $repairApproval->id,
            'reported_by' => $user->id,
            'repair_description' => $request->repair_description,
            'before_photo_url' => Storage::url($beforePhotoPath),
            'after_photo_url' => Storage::url($afterPhotoPath),
            'repair_lat' => $request->repair_lat,
            'repair_lng' => $request->repair_lng,
            'repair_completed_at' => $request->repair_completed_at,
        ]);

        // Mark repair approval as completed
        $repairApproval->markCompleted();

        // Update inspection status
        $repairApproval->inspection->update([
            'repair_status' => 'completed',
            'repair_notes' => $request->repair_description
        ]);

        // Update APAR status back to active if condition was good
        if ($repairApproval->inspection->condition === 'good') {
            $repairApproval->inspection->apar->update(['status' => 'active']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan perbaikan berhasil disimpan',
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
}
