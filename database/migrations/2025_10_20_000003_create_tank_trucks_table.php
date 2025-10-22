<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tank_trucks', function (Blueprint $table) {
            $table->id();
            $table->string('plate_number')->unique();
            $table->string('driver_name');
            $table->string('driver_phone')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->timestamps();

            // performance indexes
            $table->index(['status']);
            $table->index(['plate_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tank_trucks');
    }
};
