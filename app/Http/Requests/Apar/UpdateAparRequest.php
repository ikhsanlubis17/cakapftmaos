<?php

namespace App\Http\Requests\Apar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\AparStatus;

class UpdateAparRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $apar = $this->route('apar');
        $aparId = is_object($apar) ? $apar->id : $apar;

        return [
            'serial_number' => 'required|string|max:100|unique:apars,serial_number,' . $aparId,
            'location_type' => 'required|in:statis,mobile',
            'location_name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'valid_radius' => 'nullable|integer|min:1',
            'apar_type_id' => 'required|exists:apar_types,id',
            'capacity' => 'required|integer|min:1',
            'manufactured_date' => 'nullable|date',
            'expired_at' => 'nullable|date',
            'status' => ['required', Rule::in(AparStatus::values())],
            'tank_truck_id' => 'nullable|exists:tank_trucks,id',
            'notes' => 'nullable|string',
        ];
    }
}
