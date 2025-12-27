<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'phone', 'role', 'is_active', 'email_verified_at', 'blocked_until', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(['admin', 'supervisor', 'teknisi'])],
            'is_active' => 'boolean',
            'admin_password' => 'required|string', // Validation for admin password
        ]);

        // Validate admin password
        $admin = \Illuminate\Support\Facades\Auth::user();
        if (!Hash::check($request->admin_password, $admin->password)) {
            return response()->json([
                'message' => 'Password admin salah. Silakan coba lagi.',
                'errors' => ['admin_password' => ['Password admin salah.']]
            ], 422);
        }

        $activationToken = \Illuminate\Support\Str::uuid();
        $dummyPassword = \Illuminate\Support\Str::random(32); // Secure random password

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($dummyPassword),
            'phone' => $request->phone,
            'role' => $request->role,
            'is_active' => false, // Default to inactive until verified
            'activation_token' => $activationToken,
            'activation_expires_at' => now()->addHours(24),
        ]);
        
        // Send Activation Email
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\UserActivationMail($user));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send activation email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pengguna berhasil dibuat',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_active', 'email_verified_at', 'created_at'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(['admin', 'supervisor', 'teknisi'])],
            'is_active' => 'boolean',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'is_active' => $request->is_active ?? true,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Pengguna berhasil diperbarui',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting the last admin
        if ($user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Tidak dapat menghapus admin terakhir'
                ], 422);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'Pengguna berhasil dihapus'
        ]);
    }
    /**
     * Resend activation email
     */
    public function resendActivation(User $user)
    {
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Akun ini sudah aktif.'
            ], 422);
        }

        $activationToken = \Illuminate\Support\Str::uuid();
        $user->activation_token = $activationToken;
        $user->activation_expires_at = now()->addHours(24);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\UserActivationMail($user));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to resend activation email: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengirim email aktivasi. Silakan coba lagi.'
            ], 500);
        }

        return response()->json([
            'message' => 'Email aktivasi berhasil dikirim ulang.'
        ]);
    }

    /**
     * Unblock a user.
     */
    public function unblock(User $user)
    {
        // Clear rate limiter
        $throttleKey = 'login|' . $user->email;
        \Illuminate\Support\Facades\RateLimiter::clear($throttleKey);

        // Clear blocked_until
        $user->blocked_until = null;
        $user->save();

        return response()->json([
            'message' => 'Blokir pengguna berhasil dibuka'
        ]);
    }
} 