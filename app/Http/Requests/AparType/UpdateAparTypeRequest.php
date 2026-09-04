<?php

namespace App\Http\Requests\AparType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAparTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $aparType = $this->route('aparType');
        $aparTypeId = is_object($aparType) ? $aparType->id : $aparType;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('apar_types', 'name')->ignore($aparTypeId)],
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
