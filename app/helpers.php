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
    function getAparStatusLabel(string $status): string
    {
        return match ($status) {
            'active' => 'Aktif',
            'inactive' => 'Non-Aktif',
            'needs_repair' => 'Perlu Perbaikan',
            'under_repair' => 'Sedang Diperbaiki',
            'not_fixable' => 'Tidak Dapat Diperbaiki',
            default => ucfirst(str_replace('_', ' ', $status)),
        };
    }
}

if (! function_exists('getAparStatusClass')) {
    /**
     * Get CSS class for APAR status badge
     */
    function getAparStatusClass(string $status): string
    {
        return match ($status) {
            'active' => 'status-active',
            'inactive' => 'status-inactive',
            'needs_repair' => 'status-needs-repair',
            'under_repair' => 'status-under-repair',
            'not_fixable' => 'status-not-fixable',
            default => 'status-inactive',
        };
    }
}

if (! function_exists('getFrequencyLabel')) {
    /**
     * Get human-readable frequency label
     */
    function getFrequencyLabel(string $frequency): string
    {
        return match ($frequency) {
            'daily' => 'Harian',
            'weekly' => 'Mingguan',
            'monthly' => 'Bulanan',
            'quarterly' => 'Triwulanan',
            'yearly' => 'Tahunan',
            'once' => 'Sekali',
            default => ucfirst($frequency),
        };
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
            default => ucfirst(str_replace('_', ' ', $action)),
        };
    }
}

if (! function_exists('getActionClass')) {
    /**
     * Get CSS class for action in audit logs
     */
    function getActionClass(string $action): string
    {
        return match ($action) {
            'scan_qr' => 'scan',
            'start_inspection' => 'inspection',
            'submit_inspection' => 'inspection',
            'validation_failed' => 'validation',
            default => 'default',
        };
    }
}
