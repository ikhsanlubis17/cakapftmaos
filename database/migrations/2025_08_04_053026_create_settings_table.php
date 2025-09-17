<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Added missing import for DB facade

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->string('type')->default('string'); // string, integer, boolean, array
            $table->string('group')->default('general'); // gps, schedule, notification, inspection, security, system
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        $this->insertDefaultSettings();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }

    /**
     * Insert default settings
     */
    private function insertDefaultSettings(): void
    {
        $defaultSettings = [
            // GPS & Location Settings
            ['key' => 'gps_radius_validation', 'value' => '50', 'type' => 'integer', 'group' => 'gps', 'description' => 'Jarak maksimal dari lokasi APAR untuk validasi inspeksi (meter)'],
            ['key' => 'inspection_time_window', 'value' => '30', 'type' => 'integer', 'group' => 'gps', 'description' => 'Toleransi waktu sebelum/sesudah jadwal inspeksi (menit)'],
            ['key' => 'working_hours_start', 'value' => '06:00', 'type' => 'string', 'group' => 'gps', 'description' => 'Jam mulai periode kerja untuk validasi inspeksi'],
            ['key' => 'working_hours_end', 'value' => '22:00', 'type' => 'string', 'group' => 'gps', 'description' => 'Jam selesai periode kerja untuk validasi inspeksi'],
            
            // Schedule & Interval Settings
            ['key' => 'default_inspection_interval', 'value' => '30', 'type' => 'integer', 'group' => 'schedule', 'description' => 'Interval default untuk jadwal inspeksi APAR (hari)'],
            ['key' => 'reminder_notification_days', 'value' => '3', 'type' => 'integer', 'group' => 'schedule', 'description' => 'Berapa hari sebelum jadwal untuk kirim reminder'],
            ['key' => 'escalation_notification_days', 'value' => '7', 'type' => 'integer', 'group' => 'schedule', 'description' => 'Berapa hari sebelum jadwal untuk kirim escalation'],
            ['key' => 'auto_schedule_generation', 'value' => 'true', 'type' => 'boolean', 'group' => 'schedule', 'description' => 'Otomatis generate jadwal inspeksi'],
            
            // Notification Settings
            ['key' => 'notification_email', 'value' => 'true', 'type' => 'boolean', 'group' => 'notification', 'description' => 'Aktifkan notifikasi Email'],
            ['key' => 'notification_sms', 'value' => 'false', 'type' => 'boolean', 'group' => 'notification', 'description' => 'Aktifkan notifikasi SMS'],
            ['key' => 'notification_interval', 'value' => '24', 'type' => 'integer', 'group' => 'notification', 'description' => 'Interval notifikasi (jam)'],
            
            // Inspection Settings
            ['key' => 'auto_block_inspection', 'value' => 'true', 'type' => 'boolean', 'group' => 'inspection', 'description' => 'Otomatis blokir inspeksi di luar jam kerja'],
            ['key' => 'require_photo', 'value' => 'true', 'type' => 'boolean', 'group' => 'inspection', 'description' => 'Wajib upload foto saat inspeksi'],
            ['key' => 'require_selfie', 'value' => 'false', 'type' => 'boolean', 'group' => 'inspection', 'description' => 'Wajib selfie saat inspeksi'],
            ['key' => 'require_location_validation', 'value' => 'true', 'type' => 'boolean', 'group' => 'inspection', 'description' => 'Wajib validasi lokasi saat inspeksi'],
            ['key' => 'max_photo_size', 'value' => '5', 'type' => 'integer', 'group' => 'inspection', 'description' => 'Ukuran maksimal foto (MB)'],
            ['key' => 'allowed_photo_types', 'value' => '["jpg","jpeg","png"]', 'type' => 'array', 'group' => 'inspection', 'description' => 'Tipe file foto yang diizinkan'],
            
            // Security & Session Settings
            ['key' => 'session_timeout', 'value' => '60', 'type' => 'integer', 'group' => 'security', 'description' => 'Timeout session (menit)'],
            ['key' => 'max_login_attempts', 'value' => '5', 'type' => 'integer', 'group' => 'security', 'description' => 'Maksimal percobaan login'],
            ['key' => 'lockout_duration', 'value' => '15', 'type' => 'integer', 'group' => 'security', 'description' => 'Durasi lockout (menit)'],
            ['key' => 'require_password_change', 'value' => '90', 'type' => 'integer', 'group' => 'security', 'description' => 'Wajib ganti password setiap (hari)'],
            
            // System Settings
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'system', 'description' => 'Mode maintenance'],
            ['key' => 'debug_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'system', 'description' => 'Mode debug'],
            ['key' => 'log_retention_days', 'value' => '90', 'type' => 'integer', 'group' => 'system', 'description' => 'Retensi log (hari)'],
            ['key' => 'backup_frequency', 'value' => '7', 'type' => 'integer', 'group' => 'system', 'description' => 'Frekuensi backup (hari)'],
        ];

        foreach ($defaultSettings as $setting) {
            DB::table('settings')->insert($setting);
        }
    }
};
