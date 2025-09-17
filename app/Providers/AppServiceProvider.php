<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Suppress vendor package type warnings if configured
        if (Config::get('app.suppress_vendor_warnings', true)) {
            $this->suppressVendorWarnings();
        }
        
        // Suppress QR code specific warnings if configured
        if (env('SUPPRESS_QR_CODE_WARNINGS', true)) {
            $this->suppressQrCodeWarnings();
        }
        
        // Set error reporting level from configuration
        $errorReporting = Config::get('app.error_reporting', E_ALL & ~E_WARNING & ~E_NOTICE);
        error_reporting($errorReporting);
    }

    /**
     * Suppress specific vendor package warnings that are not critical
     */
    private function suppressVendorWarnings(): void
    {
        // Custom error handler for vendor packages
        set_error_handler(function ($severity, $message, $file, $line) {
            // Suppress specific bacon-qr-code type warnings
            if (strpos($file, 'vendor/bacon/bacon-qr-code') !== false) {
                // Log the warning for debugging but don't display it
                Log::debug("Bacon QR Code warning suppressed", [
                    'message' => $message,
                    'file' => $file,
                    'line' => $line,
                    'severity' => $severity
                ]);
                return true; // Suppress the warning
            }
            
            // Suppress other vendor package warnings
            if (strpos($file, 'vendor/') !== false) {
                // Log the warning for debugging but don't display it
                Log::warning("Vendor package warning suppressed", [
                    'message' => $message,
                    'file' => $file,
                    'line' => $line,
                    'severity' => $severity
                ]);
                return true; // Suppress the warning
            }
            
            // For non-vendor files, use default error handling
            return false;
        });
    }

    /**
     * Suppress QR code specific warnings
     */
    private function suppressQrCodeWarnings(): void
    {
        // Set specific error handler for QR code related warnings
        set_error_handler(function ($severity, $message, $file, $line) {
            // Check if this is a QR code related warning
            if (strpos($file, 'bacon-qr-code') !== false || 
                strpos($file, 'simple-qrcode') !== false ||
                strpos($message, 'Expected type') !== false ||
                strpos($message, 'SplFixedArray') !== false) {
                
                // Log the warning for debugging but don't display it
                Log::debug("QR Code type warning suppressed", [
                    'message' => $message,
                    'file' => $file,
                    'line' => $line,
                    'severity' => $severity
                ]);
                return true; // Suppress the warning
            }
            
            // For other warnings, use default error handling
            return false;
        }, E_WARNING | E_NOTICE);
    }
}
