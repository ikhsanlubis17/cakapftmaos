<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInspectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only authenticated users can create inspections
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
        $damagePhotoMaxSize = config('inspection.damage_photo.max_size');
        $conditions = config('inspection.conditions');
        $damageSeverityLevels = config('inspection.damage_severity_levels');
        
        $user = $this->user();
        $isAdminOrSupervisor = $user && ($user->isAdmin() || $user->isSupervisor());

        $rules = [
            'apar_id' => 'required|exists:apars,id',
            'condition' => 'required|in:' . implode(',', $conditions),
            'notes' => 'nullable|string',
            'photo' => "required|image|max:{$photoMaxSize}",
            'selfie' => "required|image|max:{$selfieMaxSize}",
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'damage_categories' => 'nullable|array|required_if:condition,damaged|min:1',
            'damage_categories.*.category_id' => 'required_with:damage_categories|exists:damage_categories,id',
            'damage_categories.*.notes' => 'nullable|string',
            'damage_categories.*.severity' => 'required_with:damage_categories|in:' . implode(',', $damageSeverityLevels),
            'damage_categories.*.damage_photo' => "required_with:damage_categories|image|max:{$damagePhotoMaxSize}",
            'schedule_id' => 'nullable|exists:inspection_schedules,id',
        ];

        // Add teknisi and schedule validation for admin/supervisor when condition is damaged
        if ($isAdminOrSupervisor) {
            $rules['assigned_teknisi_id'] = 'required_if:condition,damaged|nullable|exists:users,id';
            $rules['schedule_date'] = 'required_if:condition,damaged|nullable|date|after_or_equal:today';
            $rules['schedule_time'] = 'required_if:condition,damaged|nullable|date_format:H:i';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'apar_id.required' => 'APAR harus dipilih.',
            'apar_id.exists' => 'APAR tidak ditemukan.',
            'condition.required' => 'Kondisi APAR harus dipilih.',
            'condition.in' => 'Kondisi APAR tidak valid.',
            'photo.required' => 'Foto APAR wajib diambil.',
            'photo.image' => 'File foto harus berupa gambar.',
            'photo.max' => 'Ukuran foto maksimal 5MB.',
            'selfie.required' => 'Foto selfie wajib diambil.',
            'selfie.image' => 'File selfie harus berupa gambar.',
            'selfie.max' => 'Ukuran selfie maksimal 5MB.',
            'lat.numeric' => 'Latitude harus berupa angka.',
            'lat.between' => 'Latitude harus antara -90 dan 90.',
            'lng.numeric' => 'Longitude harus berupa angka.',
            'lng.between' => 'Longitude harus antara -180 dan 180.',
            'damage_categories.*.category_id.required_with' => 'Kategori kerusakan harus dipilih.',
            'damage_categories.*.category_id.exists' => 'Kategori kerusakan tidak ditemukan.',
            'damage_categories.*.severity.required_with' => 'Tingkat keparahan harus dipilih.',
            'damage_categories.*.severity.in' => 'Tingkat keparahan tidak valid.',
            'damage_categories.*.damage_photo.required_with' => 'Foto kerusakan wajib diambil.',
            'damage_categories.*.damage_photo.image' => 'File foto kerusakan harus berupa gambar.',
            'damage_categories.*.damage_photo.max' => 'Ukuran foto kerusakan maksimal 5MB.',
            'damage_categories.required_if' => 'Minimal satu kategori kerusakan harus dipilih jika kondisi rusak.',
            'damage_categories.min' => 'Deskirpsi kerusakan wajib diisi jika kondisi rusak.',
            'assigned_teknisi_id.required_if' => 'Teknisi harus dipilih jika kondisi APAR rusak.',
            'assigned_teknisi_id.exists' => 'Teknisi yang dipilih tidak ditemukan.',
            'schedule_date.required_if' => 'Tanggal jadwal perbaikan harus diisi jika kondisi APAR rusak.',
            'schedule_date.date' => 'Format tanggal tidak valid.',
            'schedule_date.after_or_equal' => 'Tanggal jadwal tidak boleh di masa lalu.',
            'schedule_time.required_if' => 'Waktu jadwal perbaikan harus diisi jika kondisi APAR rusak.',
            'schedule_time.date_format' => 'Format waktu tidak valid (HH:MM).',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            $isAdminOrSupervisor = $user && ($user->isAdmin() || $user->isSupervisor());
            
            // Validate that assigned teknisi is actually a teknisi
            if ($isAdminOrSupervisor && $this->condition === 'damaged' && $this->assigned_teknisi_id) {
                $assignedUser = User::find($this->assigned_teknisi_id);
                if (!$assignedUser || $assignedUser->role !== 'teknisi') {
                    $validator->errors()->add(
                        'assigned_teknisi_id',
                        'User yang ditugaskan harus berperan sebagai teknisi'
                    );
                }
            }
        });
    }
}
