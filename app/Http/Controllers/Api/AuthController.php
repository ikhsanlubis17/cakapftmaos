<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Notifications\ResetPasswordNotification;

class AuthController extends Controller
{
    /**
     * Login user and return JWT token
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

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
                'email' => ['Akun tidak aktif (banned).'],
            ]);
        }

        if (!$user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Email belum diverifikasi. Silakan cek email Anda untuk aktivasi akun.'],
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
                'message' => 'Unauthenticated.',
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
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = Auth::guard('api')->user();
        $validated = $request->validated();

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        /** @var \App\Models\User $user */
        $user->update($updateData);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user
        ]);
    }

    /**
     * Activate user account via token
     */
    public function activate(Request $request) 
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('activation_token', $request->token)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Token aktivasi tidak valid.'
            ], 400);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Akun sudah aktif.',
            ], 200);
        }

        if ($user->activation_expires_at && now()->greaterThan($user->activation_expires_at)) {
            return response()->json([
                'message' => 'Token aktivasi sudah kadaluarsa. Silakan hubungi admin untuk mengirim ulang email aktivasi.'
            ], 400);
        }

        $user->password = Hash::make($request->password); // Set new password
        $user->email_verified_at = now();
        $user->is_active = true; // Activate user
        // $user->activation_token = null; // Keep token for idempotency
        $user->activation_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'Akun berhasil diaktivasi. Silakan login.',
        ]);
    }

    /**
     * Send password reset link to the user's email.
     */
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $email = $request->validated()['email'];
        $user  = User::where('email', $email)->first();

        // Always return success to prevent user enumeration
        if (!$user) {
            return response()->json([
                'message' => 'Jika email terdaftar, instruksi pemulihan kata sandi telah dikirim.',
            ]);
        }

        // Generate a secure token valid for 60 minutes
        $token   = \Illuminate\Support\Str::random(64);
        $expires = now()->addMinutes(60);

        $user->update([
            'password_reset_token'      => $token,
            'password_reset_expires_at' => $expires,
        ]);

        // Send notification (log driver in dev, SMTP in prod)
        $user->notify(new ResetPasswordNotification($token, $email, $user->name));

        return response()->json([
            'message' => 'Jika email terdaftar, instruksi pemulihan kata sandi telah dikirim.',
        ]);
    }

    /**
     * Reset user password using the token from email.
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])
            ->where('password_reset_token', $validated['token'])
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Token reset tidak valid atau email tidak ditemukan.',
            ], 400);
        }

        if ($user->password_reset_expires_at && now()->greaterThan($user->password_reset_expires_at)) {
            return response()->json([
                'message' => 'Token reset sudah kedaluwarsa. Silakan minta link reset baru.',
            ], 400);
        }

        $user->update([
            'password'                  => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'password_reset_token'      => null,
            'password_reset_expires_at' => null,
        ]);

        return response()->json([
            'message' => 'Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru Anda.',
        ]);
    }
}

