<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AparType;
use App\Http\Requests\AparType\StoreAparTypeRequest;
use App\Http\Requests\AparType\UpdateAparTypeRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
    public function store(StoreAparTypeRequest $request): JsonResponse
    {
        try {
            $aparType = AparType::create($request->validated());

            return response()->json([
                'success' => true,
                'data' => $aparType,
                'message' => 'Jenis APAR berhasil ditambahkan'
            ], 201);
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
        return response()->json([
            'success' => true,
            'data' => $aparType,
            'message' => 'Jenis APAR berhasil diambil'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAparTypeRequest $request, AparType $aparType): JsonResponse
    {
        try {
            $aparType->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $aparType,
                'message' => 'Jenis APAR berhasil diperbarui'
            ]);
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
