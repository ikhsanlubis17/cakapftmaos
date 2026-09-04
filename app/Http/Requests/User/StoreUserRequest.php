<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\UserRole;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(UserRole::values())],
            'is_active' => 'boolean',
            'admin_password' => 'required|string',
        ];
    }
}
