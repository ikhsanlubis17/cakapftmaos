<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SystemSettingsMeta;
use Illuminate\Http\Request;

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

    /**
     * Send a test email via SMTP to verify configuration.
     */
    public function testEmail(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Alamat email tujuan pengujian wajib diisi',
            'email.email' => 'Format email tujuan tidak valid',
        ]);

        $recipientEmail = $validated['email'];

        try {
            \Illuminate\Support\Facades\Mail::send(
                'emails.layouts.pertamina',
                [
                    'preheader' => 'Uji Coba Pengiriman Email Sistem CAKAP FT MAOS',
                    'headerBadge' => 'TEST KONEKSI SMTP',
                    'headerBadgeColor' => '#10B981',
                    'content' => '
                        <div style="font-size: 15px; line-height: 1.6; color: #1E293B;">
                            <h2 style="font-size: 18px; color: #041562; margin-top: 0;">Konfigurasi Gmail SMTP Berhasil!</h2>
                            <p>Email ini dikirim secara otomatis oleh sistem <strong>CAKAP FT MAOS</strong> untuk memverifikasi bahwa konfigurasi server mail (SMTP) berfungsi dengan baik dan siap mengirimkan notifikasi operasional HSSE.</p>
                            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                                <div style="font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">Informasi Sistem</div>
                                <div style="font-size: 14px; color: #334155; margin-bottom: 4px;"><strong>Waktu Kirim:</strong> ' . now()->format('d M Y H:i:s T') . '</div>
                                <div style="font-size: 14px; color: #334155; margin-bottom: 4px;"><strong>Penerima Uji Coba:</strong> ' . htmlspecialchars($recipientEmail) . '</div>
                                <div style="font-size: 14px; color: #334155;"><strong>Status Layanan:</strong> Siap & Aktif</div>
                            </div>
                        </div>
                    ',
                ],
                function ($message) use ($recipientEmail) {
                    $message->to($recipientEmail)
                            ->subject('[TEST KONEKSI] Verifikasi Layanan Email CAKAP FT MAOS');
                }
            );

            return response()->json([
                'success' => true,
                'message' => "Email uji coba berhasil dikirim ke {$recipientEmail}. Silakan periksa kotak masuk atau folder spam.",
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('SMTP Test email failed: ' . $e->getMessage(), [
                'recipient' => $recipientEmail,
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email uji coba: ' . $e->getMessage(),
            ], 500);
        }
    }
} 