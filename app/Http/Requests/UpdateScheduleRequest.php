<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\User;

class UpdateScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin and supervisor can update schedules
        return $this->user() && ($this->user()->isAdmin() || $this->user()->isSupervisor());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'apar_id' => 'required|exists:apars,id',
            'assigned_user_id' => 'required|exists:users,id',
            'scheduled_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'frequency' => ['required', Rule::in(['weekly', 'monthly', 'quarterly', 'semiannual'])],
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:1000',
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
            // Validate that assigned user is a technician
            if ($this->assigned_user_id) {
                $assignedUser = User::find($this->assigned_user_id);
                if (!$assignedUser || $assignedUser->role !== 'teknisi') {
                    $validator->errors()->add(
                        'assigned_user_id',
                        'User yang ditugaskan harus berperan sebagai teknisi'
                    );
                }

                // Validate that technician has email
                if ($assignedUser && !$assignedUser->email) {
                    $validator->errors()->add(
                        'assigned_user_id',
                        'Teknisi yang ditugaskan harus memiliki email untuk menerima notifikasi'
                    );
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
            'apar_id.required' => 'APAR harus dipilih.',
            'apar_id.exists' => 'APAR tidak ditemukan.',
            'assigned_user_id.required' => 'Teknisi harus dipilih.',
            'assigned_user_id.exists' => 'Teknisi tidak ditemukan.',
            'scheduled_date.required' => 'Tanggal jadwal harus diisi.',
            'scheduled_date.date' => 'Tanggal jadwal tidak valid.',
            'start_time.required' => 'Waktu mulai harus diisi.',
            'start_time.date_format' => 'Format waktu mulai tidak valid (HH:MM).',
            'end_time.required' => 'Waktu selesai harus diisi.',
            'end_time.date_format' => 'Format waktu selesai tidak valid (HH:MM).',
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
            'frequency.required' => 'Frekuensi harus dipilih.',
            'frequency.in' => 'Frekuensi tidak valid.',
            'notes.max' => 'Catatan maksimal 1000 karakter.',
        ];
    }
}
