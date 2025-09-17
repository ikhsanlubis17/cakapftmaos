<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeService
{
    /**
     * Generate QR code with suppressed warnings
     */
    public function generateQrCode(string $data, array $options = []): string
    {
        // Suppress warnings during QR code generation
        $previousErrorReporting = error_reporting();
        error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
        
        try {
            $qrCode = QrCode::format('svg')
                ->size(200)
                ->errorCorrection('H')
                ->margin(1);
            
            // Apply custom options
            if (isset($options['size'])) {
                $qrCode->size($options['size']);
            }
            
            if (isset($options['margin'])) {
                $qrCode->margin($options['margin']);
            }
            
            if (isset($options['errorCorrection'])) {
                $qrCode->errorCorrection($options['errorCorrection']);
            }
            
            $result = $qrCode->generate($data);
            
            // Restore error reporting
            error_reporting($previousErrorReporting);
            
            return $result;
            
        } catch (\Exception $e) {
            // Restore error reporting
            error_reporting($previousErrorReporting);
            
            // Log the error
            Log::error('QR Code generation failed', [
                'data' => $data,
                'options' => $options,
                'error' => $e->getMessage()
            ]);
            
            // Return a fallback or re-throw
            throw $e;
        }
    }

    /**
     * Generate QR code PNG with suppressed warnings
     */
    public function generateQrCodePng(string $data, array $options = []): string
    {
        // Suppress warnings during QR code generation
        $previousErrorReporting = error_reporting();
        error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
        
        try {
            $qrCode = QrCode::format('png')
                ->size(200)
                ->errorCorrection('H')
                ->margin(1);
            
            // Apply custom options
            if (isset($options['size'])) {
                $qrCode->size($options['size']);
            }
            
            if (isset($options['margin'])) {
                $qrCode->margin($options['margin']);
            }
            
            if (isset($options['errorCorrection'])) {
                $qrCode->errorCorrection($options['errorCorrection']);
            }
            
            $result = $qrCode->generate($data);
            
            // Restore error reporting
            error_reporting($previousErrorReporting);
            
            return $result;
            
        } catch (\Exception $e) {
            // Restore error reporting
            error_reporting($previousErrorReporting);
            
            // Log the error
            Log::error('QR Code PNG generation failed', [
                'data' => $data,
                'options' => $options,
                'error' => $e->getMessage()
            ]);
            
            // Return a fallback or re-throw
            throw $e;
        }
    }

    /**
     * Check if QR code generation is working
     */
    public function isWorking(): bool
    {
        try {
            $this->generateQrCode('test');
            return true;
        } catch (\Exception $e) {
            Log::warning('QR Code service test failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}
