<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_damages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained()->onDelete('cascade');
            $table->foreignId('damage_category_id')->constrained()->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->string('damage_photo_url'); // Photo of damage
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_damages');
    }
};
