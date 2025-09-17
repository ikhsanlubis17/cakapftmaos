<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Illuminate\Support\Facades\Log;

class JwtMiddleware
{
    /**
     * Handle an incoming request.
     *
     *  @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Check if Authorization header exists
            $authHeader = $request->header('Authorization');
            if (!$authHeader) {
                return response()->json([
                    'message' => 'Authorization header not found',
                    'error' => 'missing_authorization_header'
                ], 401);
            }

            // Check if token format is correct
            if (!str_starts_with($authHeader, 'Bearer ')) {
                return response()->json([
                    'message' => 'Invalid authorization header format. Use: Bearer <token>',
                    'error' => 'invalid_authorization_format'
                ], 401);
            }

            // Extract token
            $token = substr($authHeader, 7);
            if (empty($token)) {
                return response()->json([
                    'message' => 'Token is empty',
                    'error' => 'empty_token'
                ], 401);
            }

            // Authenticate user
            $user = JWTAuth::setToken($token)->authenticate();
            if (!$user) {
                return response()->json([
                    'message' => 'User not found',
                    'error' => 'user_not_found'
                ], 401);
            }

            // Add user to request for use in controllers
            $request->merge(['auth_user' => $user]);

        } catch (TokenExpiredException $e) {
            return response()->json([
                'message' => 'Token expired',
                'error' => 'token_expired'
            ], 401);
        } catch (TokenInvalidException $e) {
            return response()->json([
                'message' => 'Token invalid',
                'error' => 'token_invalid'
            ], 401);
        } catch (\Exception $e) {
            Log::error('JWT authentication error', [
                'url' => $request->fullUrl(),
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Authentication failed',
                'error' => 'authentication_failed'
            ], 401);
        }

        return $next($request);
    }
}
