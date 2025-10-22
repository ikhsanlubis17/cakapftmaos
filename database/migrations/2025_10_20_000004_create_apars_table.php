<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // APAR master table
        Schema::create('apars', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->string('qr_code')->unique();
            $table->enum('location_type', ['statis', 'mobile'])->default('statis');
            $table->string('location_name');
            $table->decimal('latitude', 10, 8)->nullable();   // for static locations
            $table->decimal('longitude', 11, 8)->nullable(); // for static locations
            $table->integer('valid_radius')->nullable();     // radius in meters

            // Replace legacy 'type' enum with foreign key to 'apar_types'
            $table->foreignId('apar_type_id')->nullable()->constrained('apar_types')->nullOnDelete();

            $table->integer('capacity')->nullable();                     // in kg
            $table->date('manufactured_date')->nullable();
            $table->date('expired_at')->nullable();
            $table->enum('status', ['active', 'refill', 'expired', 'damaged'])->default('active');
            $table->foreignId('tank_truck_id')->nullable()->constrained()->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            // performance indexes
            $table->index(['status', 'location_type']);
            $table->index(['expired_at']);
            $table->index(['tank_truck_id']);
            $table->index(['serial_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apars');
    }
};
