<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description'
    ];

    /**
     * Get setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        // Try cache first
        $cacheKey = "setting.{$key}";
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Get from database
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        // Convert value based on type
        $value = self::convertValue($setting->value, $setting->type);
        
        // Cache for 1 hour
        Cache::put($cacheKey, $value, now()->addHour());
        
        return $value;
    }

    /**
     * Set setting value by key
     */
    public static function setValue(string $key, $value, string $type = 'string', string $group = 'general', ?string $description = null): bool
    {
        try {
            $setting = self::updateOrCreate(
                ['key' => $key],
                [
                    'value' => is_array($value) ? json_encode($value) : (string) $value,
                    'type' => $type,
                    'group' => $group,
                    'description' => $description
                ]
            );

            // Clear cache
            Cache::forget("setting.{$key}");
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get all settings as array
     */
    public static function getAllSettings(): array
    {
        $settings = self::all();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting->key] = self::convertValue($setting->value, $setting->type);
        }

        return $result;
    }

    /**
     * Get settings by group
     */
    public static function getSettingsByGroup(string $group): array
    {
        $settings = self::where('group', $group)->get();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting->key] = self::convertValue($setting->value, $setting->type);
        }

        return $result;
    }

    /**
     * Convert value based on type
     */
    private static function convertValue($value, string $type)
    {
        switch ($type) {
            case 'integer':
                return (int) $value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'array':
                return json_decode($value, true) ?: [];
            case 'float':
                return (float) $value;
            default:
                return $value;
        }
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $settings = self::all();
        foreach ($settings as $setting) {
            Cache::forget("setting.{$setting->key}");
        }
    }

    /**
     * Get setting with description
     */
    public static function getSettingWithDescription(string $key)
    {
        return self::where('key', $key)->first();
    }

    /**
     * Bulk update settings
     */
    public static function bulkUpdate(array $settings): bool
    {
        try {
            foreach ($settings as $key => $value) {
                $setting = self::where('key', $key)->first();
                if ($setting) {
                    $setting->update([
                        'value' => is_array($value) ? json_encode($value) : (string) $value
                    ]);
                    Cache::forget("setting.{$key}");
                }
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
