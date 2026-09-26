<?php

if (! function_exists('setting')) {
    /**
     * Get setting value by key
     */
    function setting(string $key, $default = null)
    {
        return \App\Models\Setting::getValue($key, $default);
    }
}

if (! function_exists('set_setting')) {
    /**
     * Set setting value by key
     */
    function set_setting(
        string $key,
        mixed $value,
        string $type = 'string',
        string $group = 'general',
        ?string $description = null
    ): bool {
        return \App\Models\Setting::setValue($key, $value, $type, $group, $description);
    }
}

if (! function_exists('getAparStatusLabel')) {
    /**
     * Get human-readable APAR status label
     */
    function getAparStatusLabel(string|\App\Enums\AparStatus|null $status): string
    {
        if ($status instanceof \App\Enums\AparStatus) {
            return $status->label();
        }
        if ($status === null) {
            return '-';
        }
        $enum = \App\Enums\AparStatus::tryFrom($status);
        return $enum ? $enum->label() : ucfirst(str_replace('_', ' ', (string) $status));
    }
}

if (! function_exists('getAparStatusClass')) {
    /**
     * Get CSS class for APAR status badge
     */
    function getAparStatusClass(string|\App\Enums\AparStatus|null $status): string
    {
        if ($status instanceof \App\Enums\AparStatus) {
            return $status->badgeClass();
        }
        if ($status === null) {
            return 'status-inactive';
        }
        $enum = \App\Enums\AparStatus::tryFrom($status);
        return $enum ? $enum->badgeClass() : 'status-inactive';
    }
}

if (! function_exists('getFrequencyLabel')) {
    /**
     * Get human-readable frequency label
     */
    function getFrequencyLabel(string $frequency): string
    {
        $enum = \App\Enums\ScheduleFrequency::tryFrom($frequency);
        return $enum ? $enum->label() : ucfirst($frequency);
    }
}

if (! function_exists('getActionLabel')) {
    /**
     * Get human-readable action label for audit logs
     */
    function getActionLabel(string $action): string
    {
        return match ($action) {
            'scan_qr' => 'Scan QR Code',
            'start_inspection' => 'Mulai Inspeksi',
            'submit_inspection' => 'Submit Inspeksi',
            'validation_failed' => 'Validasi Gagal',
            'update_inspection' => 'Update Inspeksi',
            'delete_inspection' => 'Hapus Inspeksi',
            'view_inspection' => 'Lihat Inspeksi',
            default => ucfirst(str_replace('_', ' ', $action)),
        };
    }
}

if (! function_exists('haversine_distance_meters')) {
    /**
     * Calculate distance between two coordinates in meters using Haversine formula.
     * Shared across InspectionService, AuditLogService, and Apar model.
     */
    function haversine_distance_meters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = config('inspection.location.earth_radius_meters', 6371000);

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
