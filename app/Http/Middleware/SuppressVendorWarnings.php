<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SuppressVendorWarnings
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Store the current error reporting level
        $previousErrorReporting = error_reporting();
        
        // Suppress vendor package warnings
        error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
        
        // Set custom error handler for vendor packages
        $this->setVendorErrorHandler();
        
        try {
            $response = $next($request);
            
            // Restore error reporting
            error_reporting($previousErrorReporting);
            
            return $response;
            
        } catch (\Exception $e) {
            // Restore error reporting
            error_reporting($previousErrorReporting);
            
            // Re-throw the exception
            throw $e;
        }
    }

    /**
     * Set custom error handler for vendor packages
     */
    private function setVendorErrorHandler(): void
    {
        set_error_handler(function ($severity, $message, $file, $line) {
            // Suppress bacon-qr-code specific warnings
            if (strpos($file, 'vendor/bacon/bacon-qr-code') !== false) {
                Log::debug("Bacon QR Code warning suppressed in middleware", [
                    'message' => $message,
                    'file' => $file,
                    'line' => $line,
                    'severity' => $severity
                ]);
                return true; // Suppress the warning
            }
            
            // Suppress other vendor package warnings
            if (strpos($file, 'vendor/') !== false) {
                Log::debug("Vendor package warning suppressed in middleware", [
                    'message' => $message,
                    'file' => $file,
                    'line' => $line,
                    'severity' => $severity
                ]);
                return true; // Suppress the warning
            }
            
            // For non-vendor files, use default error handling
            return false;
        }, E_WARNING | E_NOTICE);
    }
}
