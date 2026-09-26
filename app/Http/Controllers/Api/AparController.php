<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Apar;
use App\Models\InspectionLog;
use App\Http\Requests\Apar\StoreAparRequest;
use App\Http\Requests\Apar\UpdateAparRequest;
use App\Services\DeviceDetectorService;
use App\Services\QrCodeService;
use Barryvdh\DomPDF\Facade\Pdf;

class AparController extends Controller
{
    /**
     * Display a listing of APARs
     */
    public function index(Request $request)
    {
        $query = Apar::with(['tankTruck', 'aparType']);

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('location_type') && $request->location_type !== 'all') {
            $query->where('location_type', $request->location_type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                  ->orWhere('location_name', 'like', "%{$search}%");
            });
        }

        $apars = $query->orderBy('created_at', 'desc')->get();

        return response()->json($apars);
    }

    /**
     * Store a newly created APAR
     */
    public function store(StoreAparRequest $request)
    {
        $validated = $request->validated();

        // Generate QR code
        $qrCode = 'APAR-' . Str::random(10);
        $defaultRadius = (int) setting('gps_radius_validation', 50);

        $apar = Apar::create([
            'serial_number' => $validated['serial_number'],
            'qr_code' => $qrCode,
            'location_type' => $validated['location_type'],
            'location_name' => $validated['location_name'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'valid_radius' => $validated['valid_radius'] ?? $defaultRadius,
            'apar_type_id' => $validated['apar_type_id'],
            'capacity' => $validated['capacity'],
            'manufactured_date' => $validated['manufactured_date'] ?? null,
            'expired_at' => $validated['expired_at'] ?? null,
            'tank_truck_id' => $validated['tank_truck_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'APAR berhasil ditambahkan',
            'apar' => $apar->load(['tankTruck', 'aparType']),
        ], 201);
    }

    /**
     * Display the specified APAR
     */
    public function show(Apar $apar)
    {
        return response()->json($apar->load(['tankTruck', 'aparType']));
    }

    /**
     * Display APAR by QR code
     */
    public function showByQr($qrCode)
    {
        $apar = Apar::where('qr_code', $qrCode)->with(['tankTruck', 'aparType'])->first();

        if (!$apar) {
            return response()->json(['message' => 'APAR tidak ditemukan'], 404);
        }

        // Log QR scan
        InspectionLog::create([
            'apar_id' => $apar->id,
            'user_id' => Auth::guard('api')->id(),
            'action' => 'scan_qr',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'device_info' => DeviceDetectorService::getDeviceInfo(),
            'is_successful' => true,
            'details' => 'QR code scanned successfully',
        ]);

        return response()->json($apar);
    }

    /**
     * Update the specified APAR
     */
    public function update(UpdateAparRequest $request, Apar $apar)
    {
        try {
            $apar->update($request->validated());

            return response()->json([
                'message' => 'APAR berhasil diperbarui',
                'apar' => $apar->load(['tankTruck', 'aparType']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui APAR',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified APAR
     */
    public function destroy(Apar $apar)
    {
        $apar->delete();

        return response()->json([
            'message' => 'APAR berhasil dihapus',
        ]);
    }

    /**
     * Remove multiple APARs in bulk
     *
     * Menghapus banyak APAR sekaligus dalam satu transaksi database atomic
     * untuk mencegah race condition, partial deletion, dan overhead ratusan request HTTP.
     */
    public function bulkDestroy(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:apars,id'],
        ]);

        $ids = $validated['ids'];
        $count = count($ids);

        // Eksekusi penghapusan massal dalam database transaction
        // untuk menjamin seluruh data terhapus secara utuh (atomic)
        DB::transaction(function () use ($ids) {
            Apar::whereIn('id', $ids)->delete();
        });

        return response()->json([
            'message' => "{$count} APAR berhasil dihapus",
            'deleted_count' => $count,
        ]);
    }

    /**
     * Generate QR code for APAR
     */
    public function qrCode(Apar $apar, QrCodeService $qrCodeService)
    {
        $svg = $qrCodeService->generateQrCode($apar->qr_code, [
            'size' => 200,
            'margin' => 1
        ]);

        return response()->json([
            'qr_code' => base64_encode($svg),
            'mime_type' => 'image/svg+xml',
            'svg' => $svg
        ]);
    }

    /**
     * Get inspections for APAR
     */
    public function inspections(Apar $apar)
    {
        $inspections = $apar->inspections()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($inspections);
    }

    /**
     * Download QR Code PDF for multiple APARs
     */
    public function downloadQrPdf(Request $request, QrCodeService $qrCodeService)
    {
        $request->validate([
            'apars' => 'required|array',
            'apars.*.id' => 'required|exists:apars,id',
            'print_format' => 'nullable|string|in:both,qr_only,serial_only',
        ]);

        $printFormat = $request->input('print_format', 'both');
        $aparIds = collect($request->apars)->pluck('id');
        $apars = Apar::whereIn('id', $aparIds)
            ->with(['aparType', 'tankTruck'])
            ->get();

        // Generate QR codes for each APAR using vector SVG for crisp rendering in PDF (hanya jika butuh QR)
        $aparsWithQr = $apars->map(function ($apar) use ($qrCodeService, $printFormat) {
            if ($printFormat !== 'serial_only') {
                $svg = $qrCodeService->generateQrCode($apar->qr_code, [
                    'size' => 200,
                    'margin' => 1
                ]);
                $apar->qr_code_image = base64_encode($svg);
            } else {
                $apar->qr_code_image = null;
            }
            return $apar;
        });

        // Generate PDF
        $pdf = Pdf::loadView('pdf.apar-qr-codes', [
            'apars' => $aparsWithQr,
            'printFormat' => $printFormat,
            'generatedAt' => now()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
            'totalApars' => $apars->count()
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filenamePrefix = match ($printFormat) {
            'qr_only' => 'qr-code-apar-',
            'serial_only' => 'nomor-seri-apar-',
            default => 'label-apar-',
        };

        return $pdf->download($filenamePrefix . now()->format('Y-m-d') . '.pdf');
    }
}
