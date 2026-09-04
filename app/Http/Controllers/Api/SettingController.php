<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SystemSettingsMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    /**
     * Display public system settings (branding, contact, public metadata).
     */
    public function publicSettings()
    {
        return response()->json(Setting::getPublicSettings());
    }

    /**
     * Display system settings.
     */
    public function index()
    {
        // Get all settings from database
        $settings = Setting::getAllSettings();

        // If no settings in database, return defaults from config
        if (empty($settings)) {
            $settings = SystemSettingsMeta::defaults();
        }

        return response()->json($settings);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        // Get validation rules from SystemSettingsMeta
        $validationRules = SystemSettingsMeta::validationRules();

        // Validate request
        $validated = $request->validate($validationRules);

        // Get allowed keys from SystemSettingsMeta
        $allowedKeys = SystemSettingsMeta::keys();

        // Extract only allowed settings
        $settings = $request->only($allowedKeys);

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