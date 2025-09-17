<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateInspectionData
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Validate required fields
        if (!$request->hasFile('photo')) {
            return response()->json([
                'message' => 'Foto APAR wajib diunggah',
                'errors' => ['photo' => ['Foto APAR tidak boleh kosong']]
            ], 422);
        }

        // Validate photo file
        $photo = $request->file('photo');
        if (!$photo->isValid()) {
            return response()->json([
                'message' => 'File foto tidak valid',
                'errors' => ['photo' => ['File foto tidak dapat diproses']]
            ], 422);
        }

        // Validate photo size (max 5MB)
        if ($photo->getSize() > 5 * 1024 * 1024) {
            return response()->json([
                'message' => 'Ukuran foto terlalu besar',
                'errors' => ['photo' => ['Ukuran foto maksimal 5MB']]
            ], 422);
        }

        // Validate photo type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!in_array($photo->getMimeType(), $allowedTypes)) {
            return response()->json([
                'message' => 'Tipe file tidak didukung',
                'errors' => ['photo' => ['Hanya file JPG, JPEG, dan PNG yang didukung']]
            ], 422);
        }

        // Validate selfie if provided
        if ($request->hasFile('selfie')) {
            $selfie = $request->file('selfie');
            
            if (!$selfie->isValid()) {
                return response()->json([
                    'message' => 'File selfie tidak valid',
                    'errors' => ['selfie' => ['File selfie tidak dapat diproses']]
                ], 422);
            }

            if ($selfie->getSize() > 5 * 1024 * 1024) {
                return response()->json([
                    'message' => 'Ukuran selfie terlalu besar',
                    'errors' => ['selfie' => ['Ukuran selfie maksimal 5MB']]
                ], 422);
            }

            if (!in_array($selfie->getMimeType(), $allowedTypes)) {
                return response()->json([
                    'message' => 'Tipe file selfie tidak didukung',
                    'errors' => ['selfie' => ['Hanya file JPG, JPEG, dan PNG yang didukung']]
                ], 422);
            }
        }

        // Validate GPS coordinates for statis APAR
        if ($request->has('apar_id')) {
            $apar = \App\Models\Apar::find($request->apar_id);
            
            if ($apar && $apar->location_type === 'statis') {
                if (!$request->has('lat') || !$request->has('lng')) {
                    return response()->json([
                        'message' => 'Koordinat GPS wajib untuk APAR statis',
                        'errors' => ['location' => ['Lokasi GPS tidak ditemukan']]
                    ], 422);
                }

                // Validate coordinate format
                if (!is_numeric($request->lat) || !is_numeric($request->lng)) {
                    return response()->json([
                        'message' => 'Format koordinat GPS tidak valid',
                        'errors' => ['location' => ['Koordinat GPS harus berupa angka']]
                    ], 422);
                }

                // Validate coordinate ranges
                if ($request->lat < -90 || $request->lat > 90) {
                    return response()->json([
                        'message' => 'Latitude tidak valid',
                        'errors' => ['lat' => ['Latitude harus antara -90 dan 90']]
                    ], 422);
                }

                if ($request->lng < -180 || $request->lng > 180) {
                    return response()->json([
                        'message' => 'Longitude tidak valid',
                        'errors' => ['lng' => ['Longitude harus antara -180 dan 180']]
                    ], 422);
                }
            }
        }

        return $next($request);
    }
} 