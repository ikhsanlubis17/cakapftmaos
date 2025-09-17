<?php

if (!function_exists('setting')) {
    /**
     * Get setting value by key
     */
    function setting(string $key, $default = null)
    {
        return \App\Models\Setting::getValue($key, $default);
    }
}

if (!function_exists('set_setting')) {
    /**
     * Set setting value by key
     */
    function set_setting(
        string $key,
        mixed $value,
        string $type = 'string',
        string $group = 'general',
        ?string $description = null 
    ): bool {
        return \App\Models\Setting::setValue($key, $value, $type, $group, $description);
    }
}