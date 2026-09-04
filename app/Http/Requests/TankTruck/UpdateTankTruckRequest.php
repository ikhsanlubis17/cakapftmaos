<?php

namespace App\Http\Requests\TankTruck;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTankTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tankTruck = $this->route('tankTruck');
        $tankTruckId = is_object($tankTruck) ? $tankTruck->id : $tankTruck;

        return [
            'plate_number' => ['required', 'string', 'max:50', Rule::unique('tank_trucks', 'plate_number')->ignore($tankTruckId)],
            'driver_name' => 'required|string|max:255',
            'driver_phone' => 'nullable|string|max:25',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
        ];
    }
}
