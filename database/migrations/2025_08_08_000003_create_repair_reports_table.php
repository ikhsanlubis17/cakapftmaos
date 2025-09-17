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
        Schema::create('repair_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_approval_id')->constrained()->onDelete('cascade');
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->text('repair_description');
            $table->string('before_photo_url'); // Foto sebelum perbaikan
            $table->string('after_photo_url'); // Foto setelah perbaikan
            $table->decimal('repair_lat', 10, 8)->nullable();
            $table->decimal('repair_lng', 11, 8)->nullable();
            $table->timestamp('repair_completed_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repair_reports');
    }
};
