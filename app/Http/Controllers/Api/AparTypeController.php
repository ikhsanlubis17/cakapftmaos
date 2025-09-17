<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AparType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class AparTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $aparTypes = AparType::orderBy('name')->get();
            
            return response()->json([
                'success' => true,
                'data' => $aparTypes,
                'message' => 'Jenis APAR berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jenis APAR: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:apar_types,name',
                'description' => 'nullable|string|max:500',
                'is_active' => 'boolean'
            ]);

            $aparType = AparType::create([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->get('is_active', true)
            ]);

            return response()->json([
                'success' => true,
                'data' => $aparType,
                'message' => 'Jenis APAR berhasil ditambahkan'
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jenis APAR: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(AparType $aparType): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $aparType,
                'message' => 'Jenis APAR berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis APAR tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AparType $aparType): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:apar_types,name,' . $aparType->id,
                'description' => 'nullable|string|max:500',
                'is_active' => 'boolean'
            ]);

            $aparType->update([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->get('is_active', true)
            ]);

            return response()->json([
                'success' => true,
                'data' => $aparType,
                'message' => 'Jenis APAR berhasil diperbarui'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jenis APAR: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AparType $aparType): JsonResponse
    {
        try {
            // Check if this type is being used by any APAR
            if ($aparType->apars()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis APAR tidak dapat dihapus karena masih digunakan oleh APAR lain'
                ], 400);
            }

            $aparType->delete();

            return response()->json([
                'success' => true,
                'message' => 'Jenis APAR berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jenis APAR: ' . $e->getMessage()
            ], 500);
        }
    }
}
