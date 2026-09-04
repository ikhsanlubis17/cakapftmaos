<?php

namespace App\Http\Requests\Repair;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRepairReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxPhotoSize = config('inspection.photo.max_size', 5120);

        return [
            'repair_description' => 'sometimes|required|string',
            'before_photo' => "sometimes|required|image|max:{$maxPhotoSize}",
            'after_photo' => "sometimes|required|image|max:{$maxPhotoSize}",
            'repair_lat' => 'nullable|numeric|between:-90,90',
            'repair_lng' => 'nullable|numeric|between:-180,180',
            'repair_completed_at' => 'sometimes|required|date',
        ];
    }
}
