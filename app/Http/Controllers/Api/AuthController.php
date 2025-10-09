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
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun tidak aktif.'],
            ]);
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
}
