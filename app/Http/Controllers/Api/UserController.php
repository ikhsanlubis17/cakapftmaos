<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\UserActivationMail;

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
    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        // Validate admin password
        $admin = Auth::user();
        if (!Hash::check($validated['admin_password'], $admin->password)) {
            return response()->json([
                'message' => 'Password admin salah. Silakan coba lagi.',
                'errors' => ['admin_password' => ['Password admin salah.']]
            ], 422);
        }

        $activationToken = Str::uuid();
        $dummyPassword = Str::random(32);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($dummyPassword),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'is_active' => false,
            'activation_token' => $activationToken,
            'activation_expires_at' => now()->addHours(24),
        ]);
        
        // Send Activation Email
        try {
            Mail::to($user->email)->send(new UserActivationMail($user));
        } catch (\Exception $e) {
            Log::error('Failed to send activation email: ' . $e->getMessage());
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
    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
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