<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('apar_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('photo_url'); // Photo of APAR
            $table->string('selfie_url')->nullable(); // Selfie of teknisi
            $table->enum('condition', ['good', 'needs_refill', 'expired', 'damaged'])->default('good');
            $table->text('notes')->nullable();
            $table->decimal('inspection_lat', 10, 8)->nullable(); // GPS location during inspection
            $table->decimal('inspection_lng', 11, 8)->nullable();
            $table->boolean('location_valid')->default(true); // Whether GPS validation passed
            $table->boolean('is_valid')->default(true); // Overall validation

            // status and schedule linkage
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->foreignId('schedule_id')->nullable()->constrained('inspection_schedules')->onDelete('set null');

            // repair workflow fields
            $table->enum('repair_status', ['none', 'pending_approval', 'approved', 'rejected', 'completed'])->default('none');
            $table->text('repair_notes')->nullable();
            $table->boolean('requires_repair')->default(false);
            $table->boolean('photo_required')->default(true);
            $table->boolean('selfie_required')->default(true);

            $table->timestamps();

            // indexes for performance
            $table->index(['apar_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['condition']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};
