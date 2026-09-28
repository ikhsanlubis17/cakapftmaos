<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds repair tracking fields to inspection_damages table.
     * This allows tracking which damage items have been repaired,
     * along with after photos and repair notes.
     */
    public function up(): void
    {
        Schema::table('inspection_damages', function (Blueprint $table) {
            // Repair status for individual damage items
            $table->boolean('is_repaired')->default(false)->after('severity');
            $table->text('repair_notes')->nullable()->after('is_repaired');
            $table->string('after_photo_url')->nullable()->after('repair_notes');
            $table->timestamp('repaired_at')->nullable()->after('after_photo_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_damages', function (Blueprint $table) {
            $table->dropColumn([
                'is_repaired',
                'repair_notes',
                'after_photo_url',
                'repaired_at',
            ]);
        });
    }
};
