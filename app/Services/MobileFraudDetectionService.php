<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

/**
 * Layanan deteksi kecurangan untuk inspeksi APAR Mobile.
 *
 * APAR Mobile tidak dapat divalidasi dengan radius GPS statis,
 * sehingga diperlukan lapisan validasi berbasis metadata:
 *   1. Foto verifikasi ke-3 (tabung + plat nomor dalam satu frame)
 *   2. Analisis presisi GPS (accuracy) dari browser
 *   3. Pengecekan jeda timestamp foto vs waktu submit
 *   4. Pembacaan EXIF DateTimeOriginal untuk deteksi replay attack
 *   5. Deteksi sinyal mock/fake location dari frontend
 */
class MobileFraudDetectionService
{
    /**
     * Analisis metadata foto yang dikirim bersamaan dengan inspeksi.
     *
     * @param  UploadedFile  $photo            File foto APAR (untuk ekstraksi EXIF)
     * @param  string|null   $claimedCapturedAt Timestamp klaim frontend kapan foto diambil
     * @return array{flagged: bool, reasons: array<string>, details: array<string, mixed>}
     */
    public function analyzePhotoMetadata(UploadedFile $photo, ?string $claimedCapturedAt): array
    {
        $flags = [];
        $details = [];

        // Baca EXIF timestamp dari file foto (paling reliable, susah dipalsukan di sisi server)
        $exifTimestamp = $this->extractExifTimestamp($photo);
        $details['exif_timestamp'] = $exifTimestamp?->toIso8601String();
        $details['claimed_captured_at'] = $claimedCapturedAt;

        $maxPhotoDelaySeconds = (int) Setting::getValue('mobile_photo_delay_max_seconds', 1800);

        if ($exifTimestamp) {
            // Bandingkan EXIF time vs waktu submit sekarang
            $delayFromExif = abs(now()->diffInSeconds($exifTimestamp, false));
            $details['exif_delay_seconds'] = $delayFromExif;

            if ($delayFromExif > $maxPhotoDelaySeconds) {
                // EXIF menunjukkan foto diambil >30 menit sebelum submit — kemungkinan foto lama
                $flags[] = 'photo_exif_too_old';
                Log::warning('Mobile inspection: EXIF timestamp terlalu lama', [
                    'exif_time'         => $exifTimestamp->toIso8601String(),
                    'submit_time'       => now()->toIso8601String(),
                    'delay_seconds'     => $delayFromExif,
                    'threshold_seconds' => $maxPhotoDelaySeconds,
                ]);
            }
        }

        if ($claimedCapturedAt) {
            try {
                $claimedTime = Carbon::parse($claimedCapturedAt);
                $delayFromClaim = abs(now()->diffInSeconds($claimedTime, false));
                $details['claim_delay_seconds'] = $delayFromClaim;

                if ($delayFromClaim > $maxPhotoDelaySeconds) {
                    $flags[] = 'photo_timestamp_anomaly';
                }

                // Jika EXIF ada, bandingkan juga EXIF vs klaim frontend
                if ($exifTimestamp) {
                    $exifVsClaimDelta = abs($exifTimestamp->diffInSeconds($claimedTime, false));
                    $details['exif_vs_claim_delta_seconds'] = $exifVsClaimDelta;

                    // Selisih EXIF vs klaim >5 menit mencurigakan (EXIF dimanipulasi?)
                    if ($exifVsClaimDelta > 300) {
                        $flags[] = 'exif_claim_mismatch';
                    }
                }
            } catch (\Exception $e) {
                // Format timestamp tidak valid dari frontend
                $flags[] = 'invalid_photo_timestamp_format';
                $details['timestamp_parse_error'] = $e->getMessage();
            }
        }

        return [
            'flagged' => count($flags) > 0,
            'reasons' => $flags,
            'details' => $details,
        ];
    }

    /**
     * Analisis presisi GPS dari browser.
     *
     * @param  float|null  $accuracy  Nilai accuracy dalam meter (dari browser Geolocation API)
     * @return array{flagged: bool, reason: string|null, details: array<string, mixed>}
     */
    public function analyzeGpsAccuracy(?float $accuracy): array
    {
        if ($accuracy === null) {
            return [
                'flagged' => false,
                'reason'  => null,
                'details' => ['accuracy' => null, 'note' => 'Accuracy tidak dikirim'],
            ];
        }

        $threshold = (float) Setting::getValue('mobile_gps_accuracy_threshold', 150);

        $isFlagged = $accuracy > $threshold;

        return [
            'flagged' => $isFlagged,
            'reason'  => $isFlagged ? 'gps_accuracy_low' : null,
            'details' => [
                'accuracy_meters'   => $accuracy,
                'threshold_meters'  => $threshold,
                'assessment'        => $isFlagged ? 'presisi rendah — sinyal GPS buruk atau outdoor building block' : 'presisi memadai',
            ],
        ];
    }

    /**
     * Ekstrak timestamp DateTimeOriginal dari EXIF foto.
     *
     * @param  UploadedFile  $photo
     * @return Carbon|null
     */
    public function extractExifTimestamp(UploadedFile $photo): ?Carbon
    {
        // Hanya cek untuk JPEG/TIFF yang mendukung EXIF
        $mimeType = $photo->getMimeType();
        if (!in_array($mimeType, ['image/jpeg', 'image/jpg', 'image/tiff'])) {
            return null;
        }

        try {
            $exif = @exif_read_data($photo->getPathname(), 'EXIF', true);

            if (!$exif || !isset($exif['EXIF']['DateTimeOriginal'])) {
                return null;
            }

            // Format EXIF: "2026:09:16 20:15:00"
            return Carbon::createFromFormat('Y:m:d H:i:s', $exif['EXIF']['DateTimeOriginal']);
        } catch (\Exception $e) {
            Log::debug('Gagal membaca EXIF timestamp', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Analisis menyeluruh untuk satu submission inspeksi APAR mobile.
     *
     * @param  array{
     *   photo?: UploadedFile,
     *   mobile_verification_photo?: UploadedFile,
     *   photo_captured_at?: string,
     *   gps_accuracy?: float|null,
     *   is_mock_location?: bool,
     *   lat?: float|null,
     *   lng?: float|null,
     * }  $data  Data yang dikirim dari form inspeksi
     * @param  int  $userId
     * @return array{
     *   is_valid: bool,
     *   is_flagged: bool,
     *   hard_blocked: bool,
     *   flag_reasons: array<string>,
     *   message: string,
     *   details: array<string, mixed>
     * }
     */
    public function analyze(array $data, int $userId): array
    {
        $flags       = [];
        $details     = [];
        $hardBlocked = false;

        // ── HARD BLOCK ─────────────────────────────────────────────────────────
        // 1. Mock/Fake Location terdeteksi dari frontend
        if (!empty($data['is_mock_location'])) {
            // Mock location = sinyal terkuat bahwa lokasi dipalsu — tolak total
            Log::warning('Mobile inspection HARD-BLOCKED: mock location detected', [
                'user_id' => $userId,
                'lat'     => $data['lat'] ?? null,
                'lng'     => $data['lng'] ?? null,
            ]);

            return [
                'is_valid'    => false,
                'is_flagged'  => true,
                'hard_blocked'=> true,
                'flag_reasons'=> ['mock_location_detected'],
                'message'     => 'Fake GPS / Mock Location terdeteksi. Nonaktifkan aplikasi lokasi palsu dan coba lagi.',
                'details'     => ['is_mock_location' => true],
            ];
        }

        // 2. Foto verifikasi ke-3 bersifat opsional (tidak hard-block jika kosong)

        // ── SOFT FLAG ──────────────────────────────────────────────────────────
        // 3. Analisis presisi GPS
        $gpsResult = $this->analyzeGpsAccuracy($data['gps_accuracy'] ?? null);
        $details['gps_analysis'] = $gpsResult['details'];
        if ($gpsResult['flagged'] && $gpsResult['reason']) {
            $flags[] = $gpsResult['reason'];
        }

        // 4. Analisis metadata foto (EXIF + timestamp klaim)
        if (!empty($data['photo'])) {
            $photoResult = $this->analyzePhotoMetadata(
                $data['photo'],
                $data['photo_captured_at'] ?? null
            );
            $details['photo_analysis'] = $photoResult['details'];
            $flags = array_merge($flags, $photoResult['reasons']);
        }

        $isFlagged = count($flags) > 0;

        return [
            'is_valid'    => true, // Soft-flag tidak memblokir submit
            'is_flagged'  => $isFlagged,
            'hard_blocked'=> false,
            'flag_reasons'=> $flags,
            'message'     => $isFlagged
                ? 'Inspeksi mobile berhasil disimpan, namun ditandai untuk verifikasi supervisor (' . implode(', ', $flags) . ')'
                : 'Inspeksi mobile berhasil disimpan',
            'details'     => $details,
        ];
    }
}
