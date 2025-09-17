<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DamageCategoryController extends Controller
{
    /**
     * Display a listing of damage categories.
     */
    public function index()
    {
        $categories = DamageCategory::orderBy('name')->get();
        
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Display active damage categories.
     */
    public function active()
    {
        $categories = DamageCategory::active()->orderBy('name')->get();
        
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created damage category.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:damage_categories',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = DamageCategory::create($request->only(['name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Kategori kerusakan berhasil dibuat',
            'data' => $category
        ], 201);
    }

    /**
     * Display the specified damage category.
     */
    public function show(DamageCategory $damageCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $damageCategory
        ]);
    }

    /**
     * Update the specified damage category.
     */
    public function update(Request $request, DamageCategory $damageCategory)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:damage_categories,name,' . $damageCategory->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $damageCategory->update($request->only(['name', 'description', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Kategori kerusakan berhasil diperbarui',
            'data' => $damageCategory
        ]);
    }

    /**
     * Remove the specified damage category.
     */
    public function destroy(DamageCategory $damageCategory)
    {
        // Check if category is being used
        if ($damageCategory->inspectionDamages()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak dapat dihapus karena masih digunakan dalam inspeksi'
            ], 422);
        }

        $damageCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori kerusakan berhasil dihapus'
        ]);
    }

    /**
     * Toggle active status of damage category.
     */
    public function toggleStatus(DamageCategory $damageCategory)
    {
        $damageCategory->update(['is_active' => !$damageCategory->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status kategori berhasil diubah',
            'data' => $damageCategory
        ]);
    }
}
