<?php

namespace App\Http\Requests\AparType;

use Illuminate\Foundation\Http\FormRequest;

class StoreAparTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|unique:apar_types,name|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
