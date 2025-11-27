<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Login user and return JWT token
     */
    /**
     * Login user and return JWT token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Rate Limiting Logic
        $maxAttempts = \App\Models\Setting::getValue('max_login_attempts', 5);
        $lockoutMinutes = \App\Models\Setting::getValue('lockout_duration', 15);
        // Use email as key to allow admin unblocking (IP independent)
        $throttleKey = 'login|' . $request->email;

        $user = User::where('email', $request->email)->first();

        // Check if user is blocked in DB
        if ($user && $user->blocked_until && now()->lessThan($user->blocked_until)) {
            $minutes = (int) ceil(now()->floatDiffInMinutes($user->blocked_until));
            throw ValidationException::withMessages([
                'email' => ["Akun Anda diblokir sementara. Silakan coba lagi dalam {$minutes} menit."],
            ]);
        }

        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);

            // Sync lockout to DB if not already set
            if ($user && (!$user->blocked_until || now()->greaterThan($user->blocked_until))) {
                $user->blocked_until = now()->addSeconds($seconds);
                $user->save();
            }
            
            throw ValidationException::withMessages([
                'email' => ["Terlalu banyak percobaan login. Silakan coba lagi dalam {$minutes} menit."],
            ]);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            \Illuminate\Support\Facades\RateLimiter::hit($throttleKey, $lockoutMinutes * 60);
            $remaining = \Illuminate\Support\Facades\RateLimiter::remaining($throttleKey, $maxAttempts);
            
            // If this hit caused a lockout, update DB
            if ($remaining === 0 && $user) {
                $user->blocked_until = now()->addMinutes($lockoutMinutes);
                $user->save();
            }

            throw ValidationException::withMessages([
                'email' => ["Email atau password salah. Sisa percobaan: {$remaining}"],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun tidak aktif.'],
            ]);
        }

        // Clear rate limiter and blocked_until on successful login
        \Illuminate\Support\Facades\RateLimiter::clear($throttleKey);
        if ($user->blocked_until) {
            $user->blocked_until = null;
            $user->save();
        }

        $token = Auth::guard('api')->login($user);
        
        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => 'Login berhasil',
        ]);
    }

    /**
     * Refresh JWT token
     */
    public function refresh(Request $request)
    {
        try {

            $guard = Auth::guard('api');
            if (!$guard instanceof \Tymon\JWTAuth\JWTGuard) {
                return response()->json([
                    'message' => 'Invalid guard configuration',
                ], 500);
            }

            $newToken = $guard->refresh();

            return response()->json([
                'token' => $newToken,
                'message' => 'Token refreshed',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token refresh failed',
            ], 401);
        }
    }

    /**
     * Get authenticated user info
     */
    public function user(Request $request)
    {
        return response()->json(Auth::guard('api')->user());
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }
    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::guard('api')->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        /** @var \App\Models\User $user */
        $user->update($updateData);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user
        ]);
    }
}
