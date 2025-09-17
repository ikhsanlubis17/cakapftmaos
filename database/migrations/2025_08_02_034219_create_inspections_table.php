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
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};
