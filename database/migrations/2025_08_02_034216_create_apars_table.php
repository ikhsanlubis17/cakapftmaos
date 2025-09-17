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
        Schema::create('apars', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->string('qr_code')->unique();
            $table->enum('location_type', ['statis', 'mobile'])->default('statis');
            $table->string('location_name');
            $table->decimal('latitude', 10, 8)->nullable();   // untuk statis
            $table->decimal('longitude', 11, 8)->nullable(); // untuk statis
            $table->integer('valid_radius')->nullable();     // radius jangkauan
            $table->enum('type', ['powder', 'co2', 'foam', 'liquid'])->default('powder');
            $table->integer('capacity');                     // dalam kg
            $table->date('manufactured_date');
            $table->date('expired_at');
            $table->enum('status', ['active', 'refill', 'expired', 'damaged'])->default('active');
            $table->foreignId('tank_truck_id')->nullable()->constrained()->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apars');
    }
};