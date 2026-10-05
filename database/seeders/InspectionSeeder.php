<?php

namespace Database\Seeders;

use App\Enums\InspectionCondition;
use App\Models\Apar;
use App\Models\DamageCategory;
use App\Models\Inspection;
use App\Models\TankTruck;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class InspectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Mengimpor data inspeksi lapangan riil dari sheet SUMBER REKAP APAR
     * pada file UPDATE EXP APAR BBM MAOS & CILACAP.xlsx
     */
    public function run(): void
    {
        $excelFile = base_path('UPDATE EXP APAR BBM MAOS & CILACAP.xlsx');
        if (! file_exists($excelFile)) {
            $this->command?->warn("File Excel tidak ditemukan: {$excelFile}. Melewati import inspeksi riil.");
            return;
        }

        // Ambil teknisi riil dan supervisor
        $supervisor = User::where('role', 'supervisor')->first();
        $technicians = User::where('role', 'teknisi')->get();

        if ($technicians->isEmpty()) {
            $this->command?->error("Teknisi belum terdaftar di database. Jalankan UserSeeder terlebih dahulu.");
            return;
        }

        $techMap = [
            'akbar noeh' => $technicians->firstWhere('email', 'teknisi1@cakap-pertamina.com') ?: $technicians->first(),
            'ade tri nazril ilham' => $technicians->firstWhere('email', 'ade.tri@cakap-pertamina.com') ?: $technicians->first(),
            'arga nurul hidayah putra' => $technicians->firstWhere('email', 'arga.putra@cakap-pertamina.com') ?: $technicians->first(),
            'hendi pranata' => $technicians->firstWhere('email', 'hendi.pranata@cakap-pertamina.com') ?: $technicians->first(),
            'sahrul dwi julianto' => $technicians->firstWhere('email', 'sahrul.dwi@cakap-pertamina.com') ?: $technicians->first(),
            'teguh' => $technicians->firstWhere('email', 'teguh@cakap-pertamina.com') ?: $technicians->first(),
        ];

        // Bersihkan data dummy inspeksi lama
        Inspection::query()->forceDelete();

        $reader = IOFactory::createReaderForFile($excelFile);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($excelFile);

        $sheet = $spreadsheet->getSheetByName('SUMBER REKAP APAR');
        if (! $sheet) {
            $this->command?->error("Sheet 'SUMBER REKAP APAR' tidak ditemukan.");
            return;
        }

        $highestRow = $sheet->getHighestRow();
        $importedCount = 0;

        // Gunakan foto sampel inspeksi dan selfie generik (bukan foto pribadi)
        $samplePhoto = '/storage/inspections/photos/sample_apar.jpg';
        $sampleSelfie = '/storage/inspections/selfies/sample_selfie.jpg';

        for ($r = 2; $r <= $highestRow; $r++) {
            $rawInspector = $this->extractCellVal((string) $sheet->getCell("D{$r}")->getValue());
            $rawSubmittedAt = $this->extractCellVal((string) $sheet->getCell("C{$r}")->getValue());
            $rawCheckDate = $this->extractCellVal((string) $sheet->getCell("E{$r}")->getValue());
            $rawNopol = $this->extractCellVal((string) $sheet->getCell("F{$r}")->getValue());
            $rawNotes = $this->extractCellVal((string) $sheet->getCell("Q{$r}")->getValue());

            if (empty($rawInspector) || $rawInspector === 'NAMA INSPECTOR' || str_starts_with($rawInspector, '=')) {
                continue;
            }

            $cleanNopol = strtoupper(preg_replace('/\s+/', '', $rawNopol));
            if (empty($cleanNopol)) {
                continue;
            }

            // Cari Mobil Tangki
            $truck = TankTruck::where('plate_number', $cleanNopol)
                ->orWhere('plate_number', preg_replace('/([A-Z]+)(\d+)([A-Z]+)/', '$1 $2 $3', $cleanNopol))
                ->first();

            if (! $truck) {
                continue;
            }

            // Cari APAR yang sesuai pada mobil tangki ini
            $noteLower = strtolower($rawNotes);
            $aparsOnTruck = Apar::where('tank_truck_id', $truck->id)->get();
            if ($aparsOnTruck->isEmpty()) {
                continue;
            }

            $matchedApar = null;
            if (str_contains($noteLower, 'dcp')) {
                $matchedApar = $aparsOnTruck->first(fn ($a) => str_contains($a->serial_number, 'DCP'));
            } elseif (str_contains($noteLower, 'foam')) {
                $matchedApar = $aparsOnTruck->first(fn ($a) => str_contains($a->serial_number, 'FOAM'));
            } elseif (str_contains($noteLower, 'co2')) {
                $matchedApar = $aparsOnTruck->first(fn ($a) => str_contains($a->serial_number, 'CO2'));
            }
            $targetApar = $matchedApar ?: $aparsOnTruck->first();

            // Tentukan Teknisi
            $inspectorKey = strtolower(trim($rawInspector));
            $assignedUser = $techMap[$inspectorKey] ?? $technicians->first();

            // Tanggal Inspeksi
            $createdAt = Carbon::now()->subDays(rand(3, 14));
            if (is_numeric($rawSubmittedAt) && $rawSubmittedAt > 40000) {
                $createdAt = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $rawSubmittedAt));
            } elseif (is_numeric($rawCheckDate) && $rawCheckDate > 40000) {
                $createdAt = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $rawCheckDate))->setTime(rand(8, 16), rand(10, 50));
            }

            // Kondisi & Status Perbaikan berdasarkan catatan riil
            $hasDefect = ! empty($rawNotes) && (
                str_contains($noteLower, 'cadangan') ||
                str_contains($noteLower, 'ganti') ||
                str_contains($noteLower, 'expired') ||
                str_contains($noteLower, 'stiker')
            );

            if ($hasDefect) {
                $condition = str_contains($noteLower, 'expired') ? InspectionCondition::Expired : InspectionCondition::Damaged;
                $notes = "Temuan riil teknisi: " . $rawNotes;
                $requiresRepair = true;
                $repairStatus = 'pending_approval';
                $status = 'completed';
            } else {
                $condition = InspectionCondition::Good;
                $notes = 'Inspeksi rutin berkala APAR mobil tangki Pertamina FT Maos. Kondisi fisik, tekanan gas, dan kelengkapan pin segel prima.';
                $requiresRepair = false;
                $repairStatus = 'none';
                $status = 'completed';
            }

            $inspection = Inspection::create([
                'apar_id' => $targetApar->id,
                'user_id' => $assignedUser->id,
                'photo_url' => $samplePhoto,
                'selfie_url' => $sampleSelfie,
                'mobile_flag_status' => 'verified',
                'condition' => $condition,
                'notes' => $notes,
                'identification_method' => 'qr_code',
                'inspection_lat' => -7.621532 + (rand(-100, 100) / 100000),
                'inspection_lng' => 109.141876 + (rand(-100, 100) / 100000),
                'location_valid' => true,
                'is_valid' => true,
                'status' => $status,
                'inspection_status' => 'approved',
                'reviewed_by' => $supervisor?->id,
                'reviewed_at' => $createdAt->copy()->addHours(2),
                'requires_repair' => $requiresRepair,
                'repair_status' => $repairStatus,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $importedCount++;
        }

        // Tambahkan juga riwayat inspeksi untuk APAR Statis Fasilitas FT Maos
        $staticApars = Apar::where('location_type', 'statis')->take(6)->get();
        foreach ($staticApars as $sApar) {
            $tech = $technicians->random();
            $inspDate = Carbon::now()->subDays(rand(1, 5))->setTime(9, rand(10, 45));

            Inspection::create([
                'apar_id' => $sApar->id,
                'user_id' => $tech->id,
                'photo_url' => $samplePhoto,
                'selfie_url' => $sampleSelfie,
                'condition' => InspectionCondition::Good,
                'notes' => "Pemeriksaan fisik sarana proteksi kebakaran statis {$sApar->location_name}. Pressure gauge di zona hijau, selang dan tabung bersih terawat.",
                'identification_method' => 'qr_code',
                'inspection_lat' => $sApar->latitude,
                'inspection_lng' => $sApar->longitude,
                'location_valid' => true,
                'is_valid' => true,
                'status' => 'completed',
                'inspection_status' => 'approved',
                'reviewed_by' => $supervisor?->id,
                'reviewed_at' => $inspDate->copy()->addHours(1),
                'requires_repair' => false,
                'created_at' => $inspDate,
                'updated_at' => $inspDate,
            ]);
            $importedCount++;
        }

        $this->command?->info("✓ Berhasil mengimpor {$importedCount} data inspeksi riil ke dalam sistem.");
    }

    private function extractCellVal(string $raw): string
    {
        if (empty($raw)) {
            return '';
        }
        if (preg_match('/,([0-9\.]+)\)$/', $raw, $m)) {
            return $m[1];
        }
        if (preg_match('/,"([^"]*)"\)$/', $raw, $m)) {
            return $m[1];
        }
        return $raw;
    }
}