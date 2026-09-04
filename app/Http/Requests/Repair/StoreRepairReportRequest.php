<?php

namespace App\Http\Requests\Repair;

use Illuminate\Foundation\Http\FormRequest;

class StoreRepairReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxPhotoSize = config('inspection.photo.max_size', 5120);

        return [
            'repair_approval_id' => 'required|exists:repair_approvals,id',
            'repair_description' => 'required|string',
            'before_photo' => "required|image|max:{$maxPhotoSize}",
            'after_photo' => "required|image|max:{$maxPhotoSize}",
            'repair_lat' => 'nullable|numeric|between:-90,90',
            'repair_lng' => 'nullable|numeric|between:-180,180',
            'repair_completed_at' => 'required|date',
            'needs_reinspection' => 'boolean',
            'damage_photos' => 'nullable|array',
            'damage_photos.*' => "image|max:{$maxPhotoSize}",
        ];
    }
}
