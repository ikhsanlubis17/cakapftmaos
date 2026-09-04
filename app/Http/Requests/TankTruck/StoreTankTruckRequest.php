<?php

namespace App\Http\Requests\TankTruck;

use Illuminate\Foundation\Http\FormRequest;

class StoreTankTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plate_number' => 'required|string|max:50|unique:tank_trucks,plate_number',
            'driver_name' => 'required|string|max:255',
            'driver_phone' => 'nullable|string|max:25',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
        ];
    }
}
