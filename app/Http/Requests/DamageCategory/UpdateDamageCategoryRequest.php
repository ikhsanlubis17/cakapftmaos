<?php

namespace App\Http\Requests\DamageCategory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\DamageSeverity;

class UpdateDamageCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'type' => 'required|string|max:100',
            'severity' => ['required', Rule::in(DamageSeverity::values())],
        ];
    }
}
