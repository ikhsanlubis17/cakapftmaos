<?php

return [
    /*
    |--------------------------------------------------------------------------
    | System Settings Metadata
    |--------------------------------------------------------------------------
    |
    | This file serves as the Single Source of Truth for all system settings.
    | It defines default values, data types, validation rules, and metadata
    | for all configurable settings in the application.
    |
    */

    'settings' => [
        // GPS & Location Settings
        'gps_radius_validation' => [
            'default' => 50,
            'type' => 'integer',
            'group' => 'gps',
            'label' => 'Radius Validasi GPS (meter)',
            'description' => 'Jarak maksimal dari lokasi APAR untuk validasi inspeksi (meter)',
            'help_text' => 'Jarak maksimal dari lokasi APAR untuk validasi inspeksi',
            'validation' => 'required|integer|min:10|max:1000',
        ],
        'inspection_time_window' => [
            'default' => 30,
            'type' => 'integer',
            'group' => 'gps',
            'label' => 'Jendela Waktu Inspeksi (menit)',
            'description' => 'Toleransi waktu sebelum/sesudah jadwal inspeksi (menit)',
            'help_text' => 'Toleransi waktu sebelum/sesudah jadwal inspeksi',
            'validation' => 'required|integer|min:5|max:120',
        ],
        'working_hours_start' => [
            'default' => '06:00',
            'type' => 'string',
            'group' => 'gps',
            'label' => 'Jam Kerja Mulai',
            'description' => 'Jam mulai periode kerja untuk validasi inspeksi',
            'help_text' => 'Jam mulai periode kerja untuk validasi inspeksi',
            'validation' => 'required|date_format:H:i',
        ],
        'working_hours_end' => [
            'default' => '22:00',
            'type' => 'string',
            'group' => 'gps',
            'label' => 'Jam Kerja Selesai',
            'description' => 'Jam selesai periode kerja untuk validasi inspeksi',
            'help_text' => 'Jam selesai periode kerja untuk validasi inspeksi',
            'validation' => 'required|date_format:H:i|after:working_hours_start',
        ],

        // Schedule & Interval Settings
        'default_inspection_interval' => [
            'default' => 30,
            'type' => 'integer',
            'group' => 'schedule',
            'label' => 'Interval Inspeksi Default (hari)',
            'description' => 'Interval default untuk jadwal inspeksi APAR (hari)',
            'help_text' => 'Interval default untuk jadwal inspeksi APAR',
            'validation' => 'required|integer|min:1|max:365',
        ],
        'reminder_notification_days' => [
            'default' => 3,
            'type' => 'integer',
            'group' => 'schedule',
            'label' => 'Hari Notifikasi Reminder',
            'description' => 'Berapa hari sebelum jadwal untuk kirim reminder',
            'help_text' => 'Berapa hari sebelum jadwal untuk kirim reminder',
            'validation' => 'required|integer|min:1|max:30',
        ],
        'escalation_notification_days' => [
            'default' => 7,
            'type' => 'integer',
            'group' => 'schedule',
            'label' => 'Hari Notifikasi Eskalasi',
            'description' => 'Berapa hari setelah jadwal untuk notifikasi eskalasi',
            'help_text' => 'Berapa hari setelah jadwal untuk notifikasi eskalasi',
            'validation' => 'required|integer|min:1|max:90',
        ],
        'auto_schedule_generation' => [
            'default' => true,
            'type' => 'boolean',
            'group' => 'schedule',
            'label' => 'Generate Jadwal Otomatis',
            'description' => 'Otomatis generate jadwal inspeksi',
            'help_text' => 'Buat jadwal inspeksi secara otomatis',
            'validation' => 'boolean',
        ],

        // Notification Settings
        'notification_email' => [
            'default' => true,
            'type' => 'boolean',
            'group' => 'notification',
            'label' => 'Notifikasi Email',
            'description' => 'Aktifkan notifikasi Email',
            'help_text' => 'Kirim reminder inspeksi via email',
            'validation' => 'boolean',
        ],
        'notification_interval' => [
            'default' => 24,
            'type' => 'integer',
            'group' => 'notification',
            'label' => 'Interval Notifikasi (jam)',
            'description' => 'Interval notifikasi (jam)',
            'help_text' => 'Interval pengiriman notifikasi reminder',
            'validation' => 'required|integer|min:1|max:168',
        ],

        // Inspection Settings
        'auto_block_inspection' => [
            'default' => true,
            'type' => 'boolean',
            'group' => 'inspection',
            'label' => 'Blokir Inspeksi Otomatis',
            'description' => 'Otomatis blokir inspeksi di luar jam kerja',
            'help_text' => 'Blokir inspeksi di luar jadwal',
            'validation' => 'boolean',
        ],
        'require_photo' => [
            'default' => true,
            'type' => 'boolean',
            'group' => 'inspection',
            'label' => 'Wajib Foto APAR',
            'description' => 'Wajib upload foto saat inspeksi',
            'help_text' => 'Teknisi harus mengambil foto APAR',
            'validation' => 'boolean',
        ],
        'require_location_validation' => [
            'default' => true,
            'type' => 'boolean',
            'group' => 'inspection',
            'label' => 'Validasi Lokasi Wajib',
            'description' => 'Wajib validasi lokasi saat inspeksi',
            'help_text' => 'Wajib validasi GPS saat inspeksi',
            'validation' => 'boolean',
        ],
        'max_photo_size' => [
            'default' => 5,
            'type' => 'integer',
            'group' => 'inspection',
            'label' => 'Ukuran Maksimal Foto (MB)',
            'description' => 'Ukuran maksimal foto (MB)',
            'help_text' => 'Ukuran maksimal file foto yang diupload',
            'validation' => 'required|integer|min:1|max:20',
        ],

        // Security & Session Settings
        'session_timeout' => [
            'default' => 60,
            'type' => 'integer',
            'group' => 'security',
            'label' => 'Timeout Sesi (menit)',
            'description' => 'Timeout session (menit)',
            'help_text' => 'Waktu timeout untuk sesi pengguna',
            'validation' => 'required|integer|min:15|max:480',
        ],
        'max_login_attempts' => [
            'default' => 5,
            'type' => 'integer',
            'group' => 'security',
            'label' => 'Maksimal Percobaan Login',
            'description' => 'Maksimal percobaan login',
            'help_text' => 'Jumlah maksimal percobaan login sebelum blokir',
            'validation' => 'required|integer|min:3|max:10',
        ],
        'lockout_duration' => [
            'default' => 15,
            'type' => 'integer',
            'group' => 'security',
            'label' => 'Durasi Blokir (menit)',
            'description' => 'Durasi lockout (menit)',
            'help_text' => 'Durasi blokir setelah melebihi maksimal percobaan',
            'validation' => 'required|integer|min:5|max:60',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Get default values for all settings
     */
    'defaults' => function () {
        $settings = config('system_settings_meta.settings');
        $defaults = [];
        
        foreach ($settings as $key => $meta) {
            $defaults[$key] = $meta['default'];
        }
        
        return $defaults;
    },

    /**
     * Get validation rules for all settings
     */
    'validation_rules' => function () {
        $settings = config('system_settings_meta.settings');
        $rules = [];
        
        foreach ($settings as $key => $meta) {
            $rules[$key] = $meta['validation'];
        }
        
        return $rules;
    },

    /**
     * Get settings keys only
     */
    'keys' => function () {
        return array_keys(config('system_settings_meta.settings'));
    },

    /**
     * Get settings by group
     */
    'by_group' => function (string $group) {
        $settings = config('system_settings_meta.settings');
        return array_filter($settings, fn($meta) => $meta['group'] === $group);
    },
];
