<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove WhatsApp notification setting from settings table
        DB::table('settings')->where('key', 'notification_whatsapp')->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add WhatsApp notification setting
        DB::table('settings')->insert([
            'key' => 'notification_whatsapp',
            'value' => 'true',
            'type' => 'boolean',
            'group' => 'notification',
            'description' => 'Aktifkan notifikasi WhatsApp',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
