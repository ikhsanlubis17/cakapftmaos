<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->enum('repair_status', ['none', 'pending_approval', 'approved', 'rejected', 'completed'])->default('none')->after('status');
            $table->text('repair_notes')->nullable()->after('repair_status');
            $table->boolean('requires_repair')->default(false)->after('repair_notes');
            $table->boolean('photo_required')->default(true)->after('requires_repair');
            $table->boolean('selfie_required')->default(true)->after('photo_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropColumn(['repair_status', 'repair_notes', 'requires_repair', 'photo_required', 'selfie_required']);
        });
    }
};
