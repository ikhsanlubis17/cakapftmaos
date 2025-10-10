<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\Apar;
use App\Models\TankTruck;
use App\Models\InspectionLog;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Tymon\JWTAuth\Facades\JWTAuth;
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
    public function store(Request $request)
    {
        $request->validate([
            'serial_number' => 'required|unique:apars,serial_number',
            'location_type' => 'required|in:statis,mobile',
            'location_name' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'valid_radius' => 'nullable|integer|min:1',
            'apar_type_id' => 'required|exists:apar_types,id',
            'capacity' => 'required|integer|min:1',
            'manufactured_date' => 'nullable|date',
            'expired_at' => 'nullable|date',
            'tank_truck_id' => 'nullable|exists:tank_trucks,id',
            'notes' => 'nullable|string',
        ]);

        // Generate QR code
        $qrCode = 'APAR-' . Str::random(10);
        
        $apar = Apar::create([
            'serial_number' => $request->serial_number,
            'qr_code' => $qrCode,
            'location_type' => $request->location_type,
            'location_name' => $request->location_name,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'valid_radius' => $request->valid_radius ?? 30,
            'apar_type_id' => $request->apar_type_id,
            'capacity' => $request->capacity,
            'manufactured_date' => $request->manufactured_date,
            'expired_at' => $request->expired_at,
            'tank_truck_id' => $request->tank_truck_id,
            'notes' => $request->notes,
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
            'device_info' => $this->getDeviceInfo(),
            'is_successful' => true,
            'details' => 'QR code scanned successfully',
        ]);

        return response()->json($apar);
    }

    /**
     * Update the specified APAR
     */
    public function update(Request $request, Apar $apar)
    {
        $request->validate([
            'serial_number' => 'required|unique:apars,serial_number,' . $apar->id,
            'location_type' => 'required|in:statis,mobile',
            'location_name' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'valid_radius' => 'nullable|integer|min:1',
            'apar_type_id' => 'required|exists:apar_types,id',
            'capacity' => 'required|integer|min:1',
            'manufactured_date' => 'nullable|date',
            'expired_at' => 'nullable|date',
            'tank_truck_id' => 'nullable|exists:tank_trucks,id',
            'notes' => 'nullable|string',
        ]);

        $apar->update($request->all());

        return response()->json([
            'message' => 'APAR berhasil diperbarui',
            'apar' => $apar->load(['tankTruck', 'aparType']),
        ]);
    }

    /**
     * Get device information for logging
     */
    private function getDeviceInfo()
    {
        $userAgent = request()->userAgent();
        $browser = 'Unknown';
        $platform = 'Unknown';

        if (strpos($userAgent, 'Firefox') !== false) {
            $browser = 'Firefox';
        } elseif (strpos($userAgent, 'Chrome') !== false) {
            $browser = 'Chrome';
        } elseif (strpos($userAgent, 'Safari') !== false) {
            $browser = 'Safari';
        } elseif (strpos($userAgent, 'Opera') !== false) {
            $browser = 'Opera';
        } elseif (strpos($userAgent, 'MSIE') !== false) {
            $browser = 'Internet Explorer';
        }

        if (strpos($userAgent, 'Mac') !== false) {
            $platform = 'Mac';
        } elseif (strpos($userAgent, 'Windows') !== false) {
            $platform = 'Windows';
        } elseif (strpos($userAgent, 'Linux') !== false) {
            $platform = 'Linux';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
        ];
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
     * Generate QR code for APAR
     */
    public function qrCode(Apar $apar)
    {
        // TODO: Only generate QR code once and store it, instead of generating on each request
        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(10)
            ->generate($apar->qr_code);

        return response($qrCode)
            ->header('Content-Type', 'image/png')
            ->header('Cache-Control', 'public, max-age=31536000');
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
    public function downloadQrPdf(Request $request)
    {
        $request->validate([
            'apars' => 'required|array',
            'apars.*.id' => 'required|exists:apars,id'
        ]);

        $aparIds = collect($request->apars)->pluck('id');
        $apars = Apar::whereIn('id', $aparIds)
            ->with(['aparType', 'tankTruck'])
            ->get();

        // Generate QR codes for each APAR
        $aparsWithQr = $apars->map(function ($apar) {
            $qrCode = QrCode::format('png')
                ->size(200)
                ->margin(5)
                ->generate($apar->qr_code);
            
            $apar->qr_code_image = base64_encode($qrCode);
            return $apar;
        });

        // Generate PDF
        $pdf = PDF::loadView('pdf.apar-qr-codes', [
            'apars' => $aparsWithQr,
            'generatedAt' => now()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
            'totalApars' => $apars->count()
        ]);

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('qr-code-apar-' . now()->format('Y-m-d') . '.pdf');
    }
}
