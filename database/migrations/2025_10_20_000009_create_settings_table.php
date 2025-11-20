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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->string('type')->default('string'); // string, integer, boolean, array
            $table->string('group')->default('general'); // gps, schedule, notification, inspection, security, system
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        $this->insertDefaultSettings();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }

    private function insertDefaultSettings(): void
    {
        $settingsMeta = config('system_settings_meta.settings');
        $defaultSettings = [];

        foreach ($settingsMeta as $key => $meta) {
            $value = $meta['default'];
            
            // Convert value to string for storage
            if (is_array($value)) {
                $value = json_encode($value);
            } elseif (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            } else {
                $value = (string) $value;
            }

            $defaultSettings[] = [
                'key' => $key,
                'value' => $value,
                'type' => $meta['type'],
                'group' => $meta['group'],
                'description' => $meta['description'],
            ];
        }

        foreach ($defaultSettings as $setting) {
            DB::table('settings')->insert($setting);
        }
    }
};
