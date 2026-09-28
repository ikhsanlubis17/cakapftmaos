<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RepairFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Teknisi can submit repair forms
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $photoMaxSize = config('inspection.photo.max_size');
        $selfieMaxSize = config('inspection.selfie.max_size');
        $conditions = config('inspection.conditions');
        $damageSeverityLevels = config('inspection.damage_severity_levels');

        return [
            // Reference to the original inspection being repaired
            'parent_inspection_id' => 'required|exists:inspections,id',
            'apar_id' => 'required|exists:apars,id',
            
            // Same as inspection form
            'condition' => 'required|in:' . implode(',', $conditions),
            'notes' => 'nullable|string',
            'photo' => "required|image|max:{$photoMaxSize}",
            'selfie' => "required|image|max:{$selfieMaxSize}",
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            
            // Repaired damage items with after photos
            'repaired_damages' => 'nullable|array',
            'repaired_damages.*.damage_id' => 'required_with:repaired_damages|exists:inspection_damages,id',
            'repaired_damages.*.is_repaired' => 'required_with:repaired_damages|boolean',
            'repaired_damages.*.repair_notes' => 'nullable|string',
            'repaired_damages.*.after_photo' => "nullable|image|max:{$photoMaxSize}",
            
            // New damage items (if any new issues found during repair)
            'new_damages' => 'nullable|array',
            'new_damages.*.category_id' => 'required_with:new_damages|exists:damage_categories,id',
            'new_damages.*.notes' => 'nullable|string',
            'new_damages.*.severity' => 'required_with:new_damages|in:' . implode(',', $damageSeverityLevels),
            'new_damages.*.damage_photo' => "required_with:new_damages|image|max:{$photoMaxSize}",
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'parent_inspection_id.required' => 'ID inspeksi asal harus disertakan.',
            'parent_inspection_id.exists' => 'Inspeksi asal tidak ditemukan.',
            'apar_id.required' => 'APAR harus dipilih.',
            'apar_id.exists' => 'APAR tidak ditemukan.',
            'condition.required' => 'Kondisi APAR setelah perbaikan harus dipilih.',
            'condition.in' => 'Kondisi APAR tidak valid.',
            'photo.required' => 'Foto APAR setelah perbaikan wajib diambil.',
            'photo.image' => 'File foto harus berupa gambar.',
            'photo.max' => 'Ukuran foto maksimal 5MB.',
            'selfie.required' => 'Foto selfie wajib diambil.',
            'selfie.image' => 'File selfie harus berupa gambar.',
            'selfie.max' => 'Ukuran selfie maksimal 5MB.',
            'repaired_damages.*.damage_id.required_with' => 'ID kerusakan harus disertakan.',
            'repaired_damages.*.damage_id.exists' => 'Kerusakan tidak ditemukan.',
            'repaired_damages.*.is_repaired.required_with' => 'Status perbaikan harus diisi.',
            'repaired_damages.*.after_photo.image' => 'File foto setelah perbaikan harus berupa gambar.',
            'repaired_damages.*.after_photo.max' => 'Ukuran foto setelah perbaikan maksimal 5MB.',
            'new_damages.*.category_id.required_with' => 'Kategori kerusakan baru harus dipilih.',
            'new_damages.*.category_id.exists' => 'Kategori kerusakan tidak ditemukan.',
            'new_damages.*.severity.required_with' => 'Tingkat keparahan kerusakan baru harus dipilih.',
            'new_damages.*.severity.in' => 'Tingkat keparahan tidak valid.',
            'new_damages.*.damage_photo.required_with' => 'Foto kerusakan baru wajib diambil.',
            'new_damages.*.damage_photo.image' => 'File foto kerusakan harus berupa gambar.',
            'new_damages.*.damage_photo.max' => 'Ukuran foto kerusakan maksimal 5MB.',
        ];
    }
}
