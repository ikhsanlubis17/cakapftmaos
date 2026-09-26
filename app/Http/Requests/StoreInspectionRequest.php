<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Apar;

class StoreInspectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        // Inspeksi hanya boleh dilakukan oleh peran teknisi dan supervisor.
        // Role admin dilarang melakukan inspeksi.
        return $user->isSupervisor() || $user->isTeknisi();
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
            'apar_id'            => 'required|exists:apars,id',
            'condition'          => 'required|in:' . implode(',', $conditions),
            'notes'              => 'nullable|string',
            'photo'              => "required|image|max:{$photoMaxSize}",
            'selfie'             => "required|image|max:{$selfieMaxSize}",
            'lat'                => 'nullable|numeric|between:-90,90',
            'lng'                => 'nullable|numeric|between:-180,180',
            'damage_categories'  => 'nullable|array|required_if:condition,damaged|min:1',
            'damage_categories.*.category_id'   => 'required_with:damage_categories|exists:damage_categories,id',
            'damage_categories.*.notes'         => 'nullable|string',
            'damage_categories.*.severity'      => 'required_with:damage_categories|in:' . implode(',', $damageSeverityLevels),
            'damage_categories.*.damage_photo'  => "required_with:damage_categories|image|max:{$damagePhotoMaxSize}",
            'schedule_id'       => 'nullable|exists:inspection_schedules,id',

            // ── Anti-fraud fields ────────────────────────────────────────────────
            // Foto verifikasi tambahan mobile jika disediakan (opsional)
            'mobile_verification_photo' => "nullable|image|max:{$photoMaxSize}",
            // Presisi GPS dari browser Geolocation API (meter)
            'gps_accuracy'       => 'nullable|numeric|min:0',
            // Timestamp klaim frontend kapan foto diambil (ISO 8601)
            'photo_captured_at'  => 'nullable|date',
            // Flag mock/fake location dari frontend
            'is_mock_location'   => 'nullable|boolean',
            // Alasan bypass jadwal untuk inspeksi darurat (wajib jika is_emergency_bypass=true)
            'emergency_reason'   => 'nullable|string|max:500',
            // Metode identifikasi tabung: qr_scan atau manual_serial
            'identification_method' => 'nullable|string|in:qr_scan,manual_serial',
        ];

        // Khusus untuk supervisor jika kondisi rusak: wajib menentukan teknisi pelaksana dan jadwal perbaikan
        if ($user && $user->isSupervisor() && $this->input('condition') === 'damaged') {
            $rules['assigned_teknisi_id'] = [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $assignedUser = \App\Models\User::find($value);
                    if (!$assignedUser || !$assignedUser->isTeknisi()) {
                        $fail('Perbaikan hanya boleh ditugaskan kepada pengguna dengan peran Teknisi.');
                    }
                },
            ];
            $rules['schedule_date'] = 'required|date|after_or_equal:today';
            $rules['schedule_time'] = 'required|date_format:H:i';
            $rules['supervisor_notes'] = 'nullable|string|max:1000';
        }

        return $rules;
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            if ($user && $user->isSupervisor() && $this->input('condition') === 'damaged') {
                if (
                    $this->assigned_teknisi_id &&
                    $this->schedule_date &&
                    $this->schedule_time &&
                    !$validator->errors()->has('assigned_teknisi_id')
                ) {
                    $scheduleService = app(\App\Services\ScheduleService::class);
                    $conflictCheck = $scheduleService->checkScheduleConflict(
                        (int) $this->assigned_teknisi_id,
                        (string) $this->schedule_date,
                        (string) $this->schedule_time
                    );

                    if ($conflictCheck['has_conflict']) {
                        $validator->errors()->add(
                            'assigned_teknisi_id',
                            'Teknisi yang dipilih sedang memiliki jadwal tugas lain pada waktu tersebut (' . $this->schedule_date . ' ' . $this->schedule_time . '). Silakan pilih teknisi lain atau waktu yang berbeda.'
                        );
                    }
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'apar_id.required'                           => 'APAR harus dipilih.',
            'apar_id.exists'                             => 'APAR tidak ditemukan.',
            'condition.required'                         => 'Kondisi APAR harus dipilih.',
            'condition.in'                               => 'Kondisi APAR tidak valid.',
            'photo.required'                             => 'Foto APAR wajib diambil.',
            'photo.image'                                => 'File foto harus berupa gambar.',
            'photo.max'                                  => 'Ukuran foto maksimal 5MB.',
            'selfie.required'                            => 'Foto selfie wajib diambil.',
            'selfie.image'                               => 'File selfie harus berupa gambar.',
            'selfie.max'                                 => 'Ukuran selfie maksimal 5MB.',
            'lat.numeric'                                => 'Latitude harus berupa angka.',
            'lat.between'                                => 'Latitude harus antara -90 dan 90.',
            'lng.numeric'                                => 'Longitude harus berupa angka.',
            'lng.between'                                => 'Longitude harus antara -180 dan 180.',
            'damage_categories.*.category_id.required_with' => 'Kategori kerusakan harus dipilih.',
            'damage_categories.*.category_id.exists'     => 'Kategori kerusakan tidak ditemukan.',
            'damage_categories.*.severity.required_with' => 'Tingkat keparahan harus dipilih.',
            'damage_categories.*.severity.in'            => 'Tingkat keparahan tidak valid.',
            'damage_categories.*.damage_photo.required_with' => 'Foto kerusakan wajib diambil.',
            'damage_categories.*.damage_photo.image'     => 'File foto kerusakan harus berupa gambar.',
            'damage_categories.*.damage_photo.max'       => 'Ukuran foto kerusakan maksimal 5MB.',
            'damage_categories.required_if'              => 'Minimal satu kategori kerusakan harus dipilih jika kondisi rusak.',
            'damage_categories.min'                      => 'Deskirpsi kerusakan wajib diisi jika kondisi rusak.',
            // Anti-fraud field messages
            'mobile_verification_photo.image'            => 'File foto verifikasi harus berupa gambar.',

            // Supervisor repair assignment messages
            'assigned_teknisi_id.required'               => 'Teknisi pelaksana perbaikan wajib dipilih oleh Supervisor.',
            'assigned_teknisi_id.exists'                 => 'Teknisi yang dipilih tidak ditemukan.',
            'schedule_date.required'                     => 'Tanggal jadwal perbaikan wajib diisi.',
            'schedule_date.after_or_equal'               => 'Tanggal jadwal perbaikan tidak boleh di masa lalu.',
            'schedule_time.required'                     => 'Waktu jadwal perbaikan wajib diisi.',
            'schedule_time.date_format'                  => 'Format waktu perbaikan harus HH:mm (contoh: 09:00).',
        ];
    }

    /**
     * Cek apakah APAR yang diinspeksi adalah tipe mobile (berpindah/kendaraan).
     * Digunakan oleh Rule::requiredIf untuk menentukan apakah foto verifikasi mobile wajib.
     */
    private function isAparMobile(): bool
    {
        $aparId = $this->input('apar_id');
        if (!$aparId) {
            return false;
        }

        $apar = Apar::find($aparId);
        return $apar && $apar->location_type !== 'statis';
    }
}
