<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    /**
     * Display system settings.
     */
    public function index()
    {
        // Get all settings from database
        $settings = Setting::getAllSettings();

        // If no settings in database, return defaults
        if (empty($settings)) {
            $settings = [
                // GPS & Location Settings
                'gps_radius_validation' => 50,
                'inspection_time_window' => 30,
                'working_hours_start' => '06:00',
                'working_hours_end' => '22:00',
                
                // Schedule & Interval Settings
                'default_inspection_interval' => 30,
                'reminder_notification_days' => 3,
                'escalation_notification_days' => 7,
                'auto_schedule_generation' => true,
                
                // Notification Settings
                'notification_email' => true,
                'notification_interval' => 24,
                
                // Inspection Settings
                'auto_block_inspection' => true,
                'require_photo' => true,
                'require_selfie' => false,
                'require_location_validation' => true,
                'max_photo_size' => 5,
                'allowed_photo_types' => ['jpg', 'jpeg', 'png'],
                
                // Security & Session Settings
                'session_timeout' => 60,
                'max_login_attempts' => 5,
                'lockout_duration' => 15,
                'require_password_change' => 90,
                
                // System Settings
                'maintenance_mode' => false,
                'debug_mode' => false,
                'log_retention_days' => 90,
                'backup_frequency' => 7,
            ];
        }

        return response()->json($settings);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            // GPS & Location Settings
            'gps_radius_validation' => 'required|integer|min:10|max:1000',
            'inspection_time_window' => 'required|integer|min:5|max:120',
            'working_hours_start' => 'required|date_format:H:i',
            'working_hours_end' => 'required|date_format:H:i|after:working_hours_start',
            
            // Schedule & Interval Settings
            'default_inspection_interval' => 'required|integer|min:1|max:365',
            'reminder_notification_days' => 'required|integer|min:1|max:30',
            'escalation_notification_days' => 'required|integer|min:1|max:90',
            'auto_schedule_generation' => 'boolean',
            
            // Notification Settings
            'notification_email' => 'boolean',
            'notification_interval' => 'required|integer|min:1|max:168',
            
            // Inspection Settings
            'auto_block_inspection' => 'boolean',
            'require_photo' => 'boolean',
            'require_selfie' => 'boolean',
            'require_location_validation' => 'boolean',
            'max_photo_size' => 'required|integer|min:1|max:20',
            'allowed_photo_types' => 'array',
            
            // Security & Session Settings
            'session_timeout' => 'required|integer|min:15|max:480',
            'max_login_attempts' => 'required|integer|min:3|max:10',
            'lockout_duration' => 'required|integer|min:5|max:60',
            'require_password_change' => 'required|integer|min:30|max:365',
            
            // System Settings
            'maintenance_mode' => 'boolean',
            'debug_mode' => 'boolean',
            'log_retention_days' => 'required|integer|min:30|max:365',
            'backup_frequency' => 'required|integer|min:1|max:30',
        ]);

        $settings = $request->only([
            // GPS & Location Settings
            'gps_radius_validation',
            'inspection_time_window',
            'working_hours_start',
            'working_hours_end',
            
            // Schedule & Interval Settings
            'default_inspection_interval',
            'reminder_notification_days',
            'escalation_notification_days',
            'auto_schedule_generation',
            
            // Notification Settings
            'notification_email',
            'notification_interval',
            
            // Inspection Settings
            'auto_block_inspection',
            'require_photo',
            'require_selfie',
            'require_location_validation',
            'max_photo_size',
            'allowed_photo_types',
            
            // Security & Session Settings
            'session_timeout',
            'max_login_attempts',
            'lockout_duration',
            'require_password_change',
            
            // System Settings
            'maintenance_mode',
            'debug_mode',
            'log_retention_days',
            'backup_frequency',
        ]);

        // Store settings in database
        $success = Setting::bulkUpdate($settings);

        if (!$success) {
            return response()->json([
                'message' => 'Gagal menyimpan pengaturan',
                'error' => 'Database error'
            ], 500);
        }

        // Clear all settings cache
        Setting::clearCache();

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan',
            'settings' => $settings
        ]);
    }
} 