<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Photo Upload Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for photo uploads during inspections, including maximum
    | file sizes and image compression settings.
    |
    */

    'photo' => [
        // Maximum photo size in kilobytes (5MB)
        'max_size' => env('INSPECTION_PHOTO_MAX_SIZE', 5120),
        
        // Image compression quality (0-100)
        'compression_quality' => env('INSPECTION_PHOTO_QUALITY', 80),
        
        // Maximum image dimensions
        'max_width' => env('INSPECTION_PHOTO_MAX_WIDTH', 1920),
        'max_height' => env('INSPECTION_PHOTO_MAX_HEIGHT', 1080),
    ],

    'selfie' => [
        // Maximum selfie size in kilobytes (5MB)
        'max_size' => env('INSPECTION_SELFIE_MAX_SIZE', 5120),
        
        // Image compression quality (0-100)
        'compression_quality' => env('INSPECTION_SELFIE_QUALITY', 80),
        
        // Maximum image dimensions
        'max_width' => env('INSPECTION_SELFIE_MAX_WIDTH', 1280),
        'max_height' => env('INSPECTION_SELFIE_MAX_HEIGHT', 720),
    ],

    'damage_photo' => [
        // Maximum damage photo size in kilobytes (5MB)
        'max_size' => env('INSPECTION_DAMAGE_PHOTO_MAX_SIZE', 5120),
        
        // Image compression quality (0-100)
        'compression_quality' => env('INSPECTION_DAMAGE_PHOTO_QUALITY', 80),
        
        // Maximum image dimensions
        'max_width' => env('INSPECTION_DAMAGE_PHOTO_MAX_WIDTH', 1920),
        'max_height' => env('INSPECTION_DAMAGE_PHOTO_MAX_HEIGHT', 1080),
    ],

    /*
    |--------------------------------------------------------------------------
    | Time Validation Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for inspection time validation, including time windows
    | and normal operating hours.
    |
    */

    'time' => [
        // Time window before/after scheduled time (in hours)
        'window_hours' => env('INSPECTION_TIME_WINDOW_HOURS', 2),
        
        // Normal operating hours (24-hour format)
        'normal_hours_start' => env('INSPECTION_NORMAL_HOURS_START', 6),
        'normal_hours_end' => env('INSPECTION_NORMAL_HOURS_END', 22),
        
        // Maximum photo age in hours
        'photo_max_age_hours' => env('INSPECTION_PHOTO_MAX_AGE_HOURS', 24),
    ],

    /*
    |--------------------------------------------------------------------------
    | Location Validation Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for GPS location validation during inspections.
    |
    */

    'location' => [
        // Photo GPS coordinate tolerance in meters
        'photo_tolerance_distance' => env('INSPECTION_PHOTO_TOLERANCE_DISTANCE', 100),
        
        // Earth's radius in meters (for Haversine formula)
        'earth_radius_meters' => 6371000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Inspection Status Configuration
    |--------------------------------------------------------------------------
    |
    | Valid inspection conditions and statuses.
    |
    */

    'conditions' => [
        'good',
        'damaged',
    ],

    'statuses' => [
        'pending',
        'completed',
        'failed',
    ],

    'repair_statuses' => [
        'none',
        'pending_approval',
        'approved',
        'rejected',
        'completed',
    ],

    /*
    |--------------------------------------------------------------------------
    | Damage Category Configuration
    |--------------------------------------------------------------------------
    |
    | Valid severity levels for damage categories.
    |
    */

    'damage_severity_levels' => [
        'low',
        'medium',
        'high',
        'critical',
    ],

];
