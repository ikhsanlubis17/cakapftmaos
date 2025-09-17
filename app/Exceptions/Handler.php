<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Log all exceptions for monitoring
            Log::error('Application Error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'url' => request()->fullUrl(),
                'method' => request()->method(),
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        // Handle JWT exceptions
        $this->renderable(function (TokenExpiredException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Token telah kadaluarsa',
                    'error' => 'token_expired'
                ], 401);
            }
        });

        $this->renderable(function (TokenInvalidException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Token tidak valid',
                    'error' => 'token_invalid'
                ], 401);
            }
        });

        // Handle validation exceptions
        $this->renderable(function (ValidationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Data tidak valid',
                    'errors' => $e->errors()
                ], 422);
            }
        });

        // Handle authentication exceptions
        $this->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Tidak terautentikasi',
                    'error' => 'unauthenticated'
                ], 401);
            }
        });

        // Handle model not found exceptions
        $this->renderable(function (ModelNotFoundException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Data tidak ditemukan',
                    'error' => 'model_not_found'
                ], 404);
            }
        });

        // Handle route not found exceptions
        $this->renderable(function (NotFoundHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Endpoint tidak ditemukan',
                    'error' => 'not_found'
                ], 404);
            }
        });

        // Handle method not allowed exceptions
        $this->renderable(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Method tidak diizinkan',
                    'error' => 'method_not_allowed'
                ], 405);
            }
        });

        // Handle general exceptions
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->expectsJson()) {
                // Check if it's an HTTP exception that has getStatusCode method
                $statusCode = 500;
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $statusCode = $e->getStatusCode();
                }
                
                $response = [
                    'message' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan pada server',
                    'error' => 'server_error'
                ];

                if (config('app.debug')) {
                    $response['debug'] = [
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString()
                    ];
                }

                return response()->json($response, $statusCode);
            }
        });
    }
} 