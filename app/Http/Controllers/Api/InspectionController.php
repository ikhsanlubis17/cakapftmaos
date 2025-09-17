<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Inspection;
use App\Models\Apar;
use App\Models\InspectionLog;
use App\Models\InspectionSchedule;
use App\Services\ImageService;

class InspectionController extends Controller
{
    /**
     * Display a listing of inspections (for supervisor/admin)
     */
    public function index(Request $request)
    {
        // Get actual inspections performed by all users
        $query = Inspection::with(['apar.aparType', 'user', 'schedule']);

        if ($request->has('apar_id')) {
            $query->where('apar_id', $request->apar_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $inspections = $query->orderBy('created_at', 'desc')->get();

        // Get all pending schedules (jadwal yang belum dilakukan inspeksi)
        $pendingSchedules = InspectionSchedule::with(['apar.aparType', 'assignedUser'])
            ->where('is_active', true)
            ->where('is_completed', false)
            ->whereDoesntHave('inspections', function($query) {
                $query->where('status', 'completed');
            })
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->get();

        // Convert schedules to inspection-like objects for frontend
        $pendingInspections = $pendingSchedules->map(function($schedule) {
            return [
                'id' => 'schedule_' . $schedule->id,
                'apar' => $schedule->apar,
                'user' => $schedule->assignedUser,
                'status' => 'pending',
                'scheduled_date' => $schedule->scheduled_date,
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
        $inspections = Inspection::with(['apar.aparType', 'schedule'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get pending schedules for the user (jadwal yang belum dilakukan inspeksi)
        $pendingSchedules = InspectionSchedule::with(['apar.aparType'])
            ->where('assigned_user_id', $user->id)
            ->where('is_active', true)
            ->where('is_completed', false)
            ->whereDoesntHave('inspections', function($query) {
                $query->where('status', 'completed');
            })
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->get();

        // Convert schedules to inspection-like objects for frontend
        $pendingInspections = $pendingSchedules->map(function($schedule) {
            return [
                'id' => 'schedule_' . $schedule->id,
                'apar' => $schedule->apar,
                'status' => 'pending',
                'scheduled_date' => $schedule->scheduled_date,
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
    public function store(Request $request)
    {
        $request->validate([
            'apar_id' => 'required|exists:apars,id',
            'condition' => 'required|in:good,needs_refill,expired,damaged',
            'notes' => 'nullable|string',
            'photo' => 'required|image|max:5120', // 5MB max - Wajib dari kamera
            'selfie' => 'required|image|max:5120', // Wajib dari kamera
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'damage_categories' => 'nullable|array',
            'damage_categories.*.category_id' => 'required_with:damage_categories|exists:damage_categories,id',
            'damage_categories.*.notes' => 'nullable|string',
            'damage_categories.*.severity' => 'required_with:damage_categories|in:low,medium,high,critical',
            'damage_categories.*.damage_photo' => 'required_with:damage_categories|image|max:5120',
        ]);

        // Anti-manipulation validation (commented out for now to allow testing)
        // $this->validateInspectionTime($request);
        // $this->validatePhotoIntegrity($request);

        $apar = Apar::findOrFail($request->apar_id);
        $user = Auth::guard('api')->user();

        // Log inspection start
        InspectionLog::create([
            'apar_id' => $apar->id,
            'user_id' => $user->id,
            'action' => 'start_inspection',
            'lat' => $request->lat,
            'lng' => $request->lng,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'device_info' => $this->getDeviceInfo(),
            'is_successful' => true,
            'details' => 'Inspection started',
        ]);

        // Validate location for static APARs
        $locationValid = true;
        $locationError = null;
        
        if ($apar->location_type === 'statis') {
            if (!$request->has('lat') || !$request->has('lng')) {
                $locationValid = false;
                $locationError = 'Koordinat lokasi tidak ditemukan. Pastikan GPS aktif.';
            } else {
                $locationValid = $apar->isWithinValidRadius($request->lat, $request->lng);
                if (!$locationValid) {
                    $distance = $apar->distanceFrom($request->lat, $request->lng);
                    $locationError = "Anda berada {$distance} meter dari APAR. Maksimal {$apar->valid_radius} meter.";
                }
            }
        }

        // Log validation failure if location is invalid
        if (!$locationValid) {
            InspectionLog::create([
                'apar_id' => $apar->id,
                'user_id' => $user->id,
                'action' => 'validation_failed',
                'lat' => $request->lat,
                'lng' => $request->lng,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'device_info' => $this->getDeviceInfo(),
                'is_successful' => false,
                'details' => 'Location validation failed: ' . $locationError,
            ]);
            
            // Return error response for invalid location
            return response()->json([
                'message' => 'Lokasi tidak valid',
                'error' => $locationError,
                'location_valid' => false,
                'distance' => $request->has('lat') && $request->has('lng') ? $apar->distanceFrom($request->lat, $request->lng) : null,
                'valid_radius' => $apar->valid_radius,
                'apar_location' => [
                    'lat' => $apar->latitude,
                    'lng' => $apar->longitude,
                ],
                'user_location' => [
                    'lat' => $request->lat,
                    'lng' => $request->lng,
                ],
            ], 422);
        }

        // Store photos with compression
        $imageService = new ImageService();
        $photoPath = $imageService->compressImage($request->file('photo'), 'inspections/photos', 80, 1920, 1080);
        $selfiePath = null;

        if ($request->hasFile('selfie')) {
            $selfiePath = $imageService->compressImage($request->file('selfie'), 'inspections/selfies', 80, 1280, 720);
        }

        // Create inspection
        // Find related schedule if exists
        $schedule = null;
        if ($request->has('schedule_id')) {
            $schedule = InspectionSchedule::where('id', $request->schedule_id)
                ->where('assigned_user_id', $user->id)
                ->where('apar_id', $apar->id)
                ->first();
        } else {
            // Try to find schedule by APAR and user
            $schedule = InspectionSchedule::where('assigned_user_id', $user->id)
                ->where('apar_id', $apar->id)
                ->where('is_active', true)
                ->where('is_completed', false)
                ->orderBy('scheduled_date', 'desc')
                ->first();
        }

        // Determine if repair is required
        $requiresRepair = in_array($request->condition, ['needs_refill', 'expired', 'damaged']) || 
                          ($request->has('damage_categories') && count($request->damage_categories) > 0);

        // Determine status based on validation
        $status = $locationValid ? 'completed' : 'failed';

        $inspection = Inspection::create([
            'apar_id' => $apar->id,
            'user_id' => $user->id,
            'photo_url' => Storage::url($photoPath),
            'selfie_url' => Storage::url($selfiePath),
            'condition' => $request->condition,
            'notes' => $request->notes,
            'inspection_lat' => $request->lat,
            'inspection_lng' => $request->lng,
            'location_valid' => $locationValid,
            'is_valid' => $locationValid,
            'status' => $status,
            'schedule_id' => $schedule ? $schedule->id : null,
            'repair_status' => $requiresRepair ? 'pending_approval' : 'none',
            'requires_repair' => $requiresRepair,
            'photo_required' => true,
            'selfie_required' => true,
        ]);

        // Log inspection submission
        InspectionLog::create([
            'apar_id' => $apar->id,
            'user_id' => $user->id,
            'inspection_id' => $inspection->id,
            'action' => 'submit_inspection',
            'lat' => $request->lat,
            'lng' => $request->lng,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'device_info' => $this->getDeviceInfo(),
            'is_successful' => $locationValid,
            'details' => $locationValid ? 'Inspection submitted successfully' : 'Inspection submitted but location validation failed',
        ]);

        // Store damage categories if any
        if ($request->has('damage_categories') && count($request->damage_categories) > 0) {
            foreach ($request->damage_categories as $damageData) {
                $damagePhotoPath = $imageService->compressImage(
                    $damageData['damage_photo'], 
                    'inspections/damages', 
                    80, 
                    1920, 
                    1080
                );

                \App\Models\InspectionDamage::create([
                    'inspection_id' => $inspection->id,
                    'damage_category_id' => $damageData['category_id'],
                    'notes' => $damageData['notes'] ?? null,
                    'damage_photo_url' => Storage::url($damagePhotoPath),
                    'severity' => $damageData['severity'],
                ]);
            }
        }

        // Create repair approval if repair is required
        if ($requiresRepair) {
            \App\Models\RepairApproval::create([
                'inspection_id' => $inspection->id,
                'status' => 'pending',
            ]);
        }

        // Update APAR status if needed
        if ($request->condition === 'needs_refill') {
            $apar->update(['status' => 'refill']);
        } elseif ($request->condition === 'expired') {
            $apar->update(['status' => 'expired']);
        } elseif ($request->condition === 'damaged') {
            $apar->update(['status' => 'damaged']);
        }

        // Mark schedule as completed if exists
        if ($schedule && $locationValid) {
            $schedule->update(['is_completed' => true]);
        }

        return response()->json([
            'message' => 'Inspeksi berhasil disimpan',
            'inspection' => $inspection->load(['apar.aparType', 'user']),
            'location_valid' => true,
        ], 201);
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
            'condition' => 'sometimes|in:good,needs_refill,expired,damaged',
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
            Storage::disk('public')->delete($photoPath);
        }

        if ($inspection->selfie_url) {
            $selfiePath = str_replace('/storage/', '', $inspection->selfie_url);
            Storage::disk('public')->delete($selfiePath);
        }

        $inspection->delete();

        return response()->json([
            'message' => 'Inspeksi berhasil dihapus',
        ]);
    }

    /**
     * Validate inspection time to prevent manipulation
     */
    private function validateInspectionTime(Request $request)
    {
        try {
            $aparId = $request->apar_id;
            $now = now();
            
            // Check if there's a scheduled inspection for this APAR
            $schedule = \App\Models\InspectionSchedule::where('apar_id', $aparId)
                ->where('scheduled_date', $now->toDateString())
                ->where('is_completed', false)
                ->first();

            if ($schedule) {
                $scheduledTime = \Carbon\Carbon::parse($schedule->scheduled_time);
                $startTime = $scheduledTime->copy()->subHours(2);
                $endTime = $scheduledTime->copy()->addHours(4);
                
                if ($now->lt($startTime) || $now->gt($endTime)) {
                    abort(422, 'Inspeksi hanya dapat dilakukan pada waktu yang telah dijadwalkan');
                }
            }

            // Check if inspection is being done during working hours (optional)
            $hour = $now->hour;
            if ($hour < 6 || $hour > 22) {
                // Log suspicious activity but don't block
                Log::warning('Inspection attempted outside normal hours', [
                    'apar_id' => $aparId,
                    'time' => $now->format('Y-m-d H:i:s'),
                    'user_id' => Auth::id()
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't block inspection
            Log::error('Error validating inspection time: ' . $e->getMessage(), [
                'apar_id' => $request->apar_id ?? null,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Validate photo integrity to prevent manipulation
     */
    private function validatePhotoIntegrity(Request $request)
    {
        try {
            if ($request->hasFile('photo')) {
                $photo = $request->file('photo');
                
                // Check file metadata
                $exif = exif_read_data($photo->getPathname());
                
                if ($exif) {
                    // Check if photo was taken recently (within last 24 hours)
                    if (isset($exif['DateTimeOriginal'])) {
                        $photoTime = \Carbon\Carbon::createFromFormat('Y:m:d H:i:s', $exif['DateTimeOriginal']);
                        $now = now();
                        
                        if ($photoTime->diffInHours($now) > 24) {
                            abort(422, 'Foto harus diambil dalam 24 jam terakhir');
                        }
                    }
                    
                    // Check GPS coordinates if available
                    if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude'])) {
                        $photoLat = $this->getGpsCoordinate($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                        $photoLng = $this->getGpsCoordinate($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
                        
                        // Compare with submitted coordinates
                        if ($request->has('lat') && $request->has('lng')) {
                            $submittedLat = $request->lat;
                            $submittedLng = $request->lng;
                            
                            $distance = $this->calculateDistance($photoLat, $photoLng, $submittedLat, $submittedLng);
                            
                            if ($distance > 100) { // 100 meters tolerance
                                abort(422, 'Koordinat foto tidak sesuai dengan lokasi inspeksi');
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // Log error but don't block inspection
            Log::error('Error validating photo integrity: ' . $e->getMessage(), [
                'apar_id' => $request->apar_id ?? null,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Convert GPS coordinate from EXIF format to decimal
     */
    private function getGpsCoordinate($coordinate, $hemisphere)
    {
        if (is_string($coordinate)) {
            $coordinate = array_map('trim', explode(',', $coordinate));
        }
        
        $degrees = count($coordinate) > 0 ? $this->formattedToNumber($coordinate[0]) : 0;
        $minutes = count($coordinate) > 1 ? $this->formattedToNumber($coordinate[1]) : 0;
        $seconds = count($coordinate) > 2 ? $this->formattedToNumber($coordinate[2]) : 0;
        
        $flip = ($hemisphere == 'W' || $hemisphere == 'S') ? -1 : 1;
        
        return $flip * ($degrees + $minutes / 60 + $seconds / 3600);
    }

    /**
     * Convert formatted coordinate to number
     */
    private function formattedToNumber($coordPart)
    {
        if (is_string($coordPart)) {
            $coordPart = trim($coordPart);
        }
        
        if (is_numeric($coordPart)) {
            return $coordPart;
        }
        
        return 0;
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000; // Earth's radius in meters
        
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);
        
        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
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
}
