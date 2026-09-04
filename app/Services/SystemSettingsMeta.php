<?php

namespace App\Services;

class SystemSettingsMeta
{
    /**
     * Get all settings metadata definition
     */
    public static function all(): array
    {
        return config('system_settings_meta.settings', []);
    }

    /**
     * Get default values for all settings
     */
    public static function defaults(): array
    {
        $settings = self::all();
        $defaults = [];

        foreach ($settings as $key => $meta) {
            $defaults[$key] = $meta['default'];
        }

        return $defaults;
    }

    /**
     * Get validation rules for all settings
     */
    public static function validationRules(): array
    {
        $settings = self::all();
        $rules = [];

        foreach ($settings as $key => $meta) {
            $rules[$key] = $meta['validation'];
        }

        return $rules;
    }

    /**
     * Get settings keys only
     */
    public static function keys(): array
    {
        return array_keys(self::all());
    }

    /**
     * Get settings metadata by group
     */
    public static function byGroup(string $group): array
    {
        $settings = self::all();
        return array_filter($settings, fn ($meta) => ($meta['group'] ?? null) === $group);
    }
}
