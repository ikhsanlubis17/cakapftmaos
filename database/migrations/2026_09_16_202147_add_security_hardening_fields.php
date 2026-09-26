<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah field anti-fraud untuk APAR Mobile ke tabel inspections
        Schema::table('inspections', function (Blueprint $table) {
            // Foto wajib ke-3 untuk APAR mobile: tabung + plat nomor kendaraan dalam satu frame
            $table->string('mobile_verification_photo_url')->nullable()->after('selfie_url');

            // Status flag verifikasi: none = tidak perlu, flagged = mencurigakan, verified = sudah diverifikasi supervisor
            $table->enum('mobile_flag_status', ['none', 'flagged', 'verified'])->default('none')->after('mobile_verification_photo_url');

            // Alasan flag, comma-separated (contoh: "gps_accuracy_low,photo_timestamp_anomaly")
            $table->text('mobile_flag_reason')->nullable()->after('mobile_flag_status');

            // Presisi GPS dari browser API (meter) — lebih kecil = lebih akurat
            $table->decimal('gps_accuracy_meters', 8, 2)->nullable()->after('mobile_flag_reason');

            // Timestamp kapan foto diambil (diklaim frontend) untuk deteksi replay attack
            $table->timestamp('photo_captured_at')->nullable()->after('gps_accuracy_meters');

            // Flag bahwa mock location terdeteksi dari frontend (hard-block trigger)
            $table->boolean('is_mock_location_detected')->default(false)->after('photo_captured_at');

            $table->index('mobile_flag_status');
        });

        // Tambah kolom audit trail ke inspection_logs
        Schema::table('inspection_logs', function (Blueprint $table) {
            // Kategori event: success, blocked (hard-reject), flagged (soft-flag), error
            $table->enum('event_type', ['success', 'blocked', 'flagged', 'error'])->default('success')->after('is_successful');

            // Alasan flag spesifik untuk analisis pola kecurangan
            $table->string('flag_reason')->nullable()->after('event_type');

            // Presisi GPS saat action berlangsung
            $table->decimal('gps_accuracy_meters', 8, 2)->nullable()->after('flag_reason');

            // Timestamp foto yang diklaim frontend
            $table->timestamp('photo_captured_at')->nullable()->after('gps_accuracy_meters');

            // Alasan bypass jadwal untuk inspeksi darurat Admin/Supervisor
            $table->text('emergency_reason')->nullable()->after('photo_captured_at');

            $table->index('event_type');
        });

        // Tambah kolom SLA tracking ke repair_approvals
        Schema::table('repair_approvals', function (Blueprint $table) {
            // Waktu terakhir reminder dikirim (mencegah spam notifikasi)
            $table->timestamp('last_reminder_at')->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropIndex(['mobile_flag_status']);
            $table->dropColumn([
                'mobile_verification_photo_url',
                'mobile_flag_status',
                'mobile_flag_reason',
                'gps_accuracy_meters',
                'photo_captured_at',
                'is_mock_location_detected',
            ]);
        });

        Schema::table('inspection_logs', function (Blueprint $table) {
            $table->dropIndex(['event_type']);
            $table->dropColumn([
                'event_type',
                'flag_reason',
                'gps_accuracy_meters',
                'photo_captured_at',
                'emergency_reason',
            ]);
        });

        Schema::table('repair_approvals', function (Blueprint $table) {
            $table->dropColumn('last_reminder_at');
        });
    }
};
