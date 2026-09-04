<?php

namespace App\Services;

class DeviceDetectorService
{
    /**
     * Get device information from user agent for audit logging
     */
    public static function getDeviceInfo(?string $userAgent = null): array
    {
        $userAgent = $userAgent ?? request()->userAgent() ?? '';
        $browser = 'Unknown';
        $platform = 'Unknown';

        // Detect browser
        if (strpos($userAgent, 'Firefox') !== false) {
            $browser = 'Firefox';
        } elseif (strpos($userAgent, 'Chrome') !== false) {
            $browser = 'Chrome';
        } elseif (strpos($userAgent, 'Safari') !== false) {
            $browser = 'Safari';
        } elseif (strpos($userAgent, 'Opera') !== false) {
            $browser = 'Opera';
        } elseif (strpos($userAgent, 'MSIE') !== false || strpos($userAgent, 'Trident') !== false) {
            $browser = 'Internet Explorer';
        } elseif (strpos($userAgent, 'Edge') !== false) {
            $browser = 'Edge';
        }

        // Detect OS / Platform
        if (strpos($userAgent, 'iPhone') !== false || strpos($userAgent, 'iPad') !== false) {
            $platform = 'iOS';
        } elseif (strpos($userAgent, 'Android') !== false) {
            $platform = 'Android';
        } elseif (strpos($userAgent, 'Mac') !== false) {
            $platform = 'Mac';
        } elseif (strpos($userAgent, 'Windows') !== false) {
            $platform = 'Windows';
        } elseif (strpos($userAgent, 'Linux') !== false) {
            $platform = 'Linux';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
        ];
    }
}
