<?php

namespace App\Http\Requests\Repair;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\RepairApproval;

class StoreRepairReportRequest extends FormRequest
{
    /**
     * Verifikasi bahwa teknisi yang melaporkan perbaikan adalah teknisi yang di-assign
     * oleh supervisor, atau merupakan Admin/Supervisor.
     *
     * Ini mencegah teknisi lain melaporkan perbaikan yang bukan tanggung jawabnya,
     * yang bisa menjadi vektor manipulasi data audit.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        // Sesuai aturan bisnis HSSE, hanya teknisi yang ditugaskan yang boleh melakukan
        // dan melaporkan perbaikan fisik tabung. Supervisor bertugas menugaskan & mereview.
        if (!$user->isTeknisi()) {
            return false;
        }

        // Teknisi harus cocok dengan assigned_user_id di repair_approval
        $repairApproval = RepairApproval::find($this->input('repair_approval_id'));
        if (!$repairApproval) {
            return false;
        }

        return $repairApproval->assigned_user_id === $user->id;
    }

    public function rules(): array
    {
        $maxPhotoSize = config('inspection.photo.max_size', 5120);

        return [
            'repair_approval_id'  => 'required|exists:repair_approvals,id',
            'repair_description'  => 'required|string',
            'before_photo'        => "required|image|max:{$maxPhotoSize}",
            'after_photo'         => "required|image|max:{$maxPhotoSize}",
            'repair_completed_at' => 'required|date',
            'needs_reinspection'  => 'boolean',
            'damage_photos'       => 'nullable|array',
            'damage_photos.*'     => "image|max:{$maxPhotoSize}",

            // Lokasi perbaikan — untuk validasi APAR statis yang sedang diperbaiki
            'repair_lat'          => 'nullable|numeric|between:-90,90',
            'repair_lng'          => 'nullable|numeric|between:-180,180',
            'gps_accuracy'        => 'nullable|numeric|min:0',

            // Timestamp foto untuk deteksi replay attack
            'photo_captured_at'   => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'repair_approval_id.required' => 'ID persetujuan perbaikan wajib diisi.',
            'repair_approval_id.exists'   => 'Persetujuan perbaikan tidak ditemukan.',
            'repair_description.required' => 'Deskripsi perbaikan wajib diisi.',
            'before_photo.required'       => 'Foto sebelum perbaikan wajib diunggah.',
            'after_photo.required'        => 'Foto sesudah perbaikan wajib diunggah.',
            'repair_completed_at.required'=> 'Tanggal selesai perbaikan wajib diisi.',
        ];
    }
}

