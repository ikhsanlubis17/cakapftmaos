<?php

namespace App\Console\Commands;

use App\Enums\AparStatus;
use App\Models\Apar;
use App\Models\AparType;
use App\Models\TankTruck;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class SyncBbmMaosApar extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'apar:sync-bbm-maos
                            {--file= : Path to the Excel file containing APAR BBM Maos data}
                            {--dry-run : Simulate sync without saving to database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronisasi data APAR Mobil Tangki khusus BBM MAOS dari file Excel UPDATE EXP APAR BBM MAOS & CILACAP.xlsx';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $filePath = $this->option('file') ?: base_path('UPDATE EXP APAR BBM MAOS & CILACAP.xlsx');
        $isDryRun = (bool) $this->option('dry-run');

        $this->info("=== SINKRONISASI DATA APAR MOBIL TANGKI BBM MAOS (100% REAL DATA) ===");
        $this->line("File target : {$filePath}");
        if ($isDryRun) {
            $this->warn("Mode       : DRY RUN (Simulasi tanpa menyimpan ke database)");
        }

        if (! file_exists($filePath)) {
            $this->error("File tidak ditemukan: {$filePath}");
            return Command::FAILURE;
        }

        // Pastikan Master Tipe APAR tersedia
        $aparTypeMap = AparType::pluck('id', 'name')->toArray();
        $requiredTypes = ['co2', 'foam', 'dcp_pressure', 'dcp_cartridge'];
        foreach ($requiredTypes as $reqType) {
            if (! isset($aparTypeMap[$reqType])) {
                $this->error("Tipe APAR wajib '{$reqType}' tidak ditemukan di database.");
                return Command::FAILURE;
            }
        }

        $this->line("Membaca file Excel...");
        $reader = IOFactory::createReaderForFile($filePath);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($filePath);

        // Ambil sheet BBM MAOS dan REKAP APAR DEDI
        $sheetMaos = $spreadsheet->getSheetByName('REKAP APAR FT MAOS.')
            ?: $spreadsheet->getSheetByName('REKAP APAR FT MAOS')
            ?: $spreadsheet->getSheetByName('BBM MAOS');
        $sheetDedi = $spreadsheet->getSheetByName('REKAP APAR DEDI');

        if (! $sheetMaos && ! $sheetDedi) {
            $this->error("Sheet data BBM Maos ('REKAP APAR DEDI' / 'REKAP APAR FT MAOS.') tidak ditemukan dalam file Excel.");
            return Command::FAILURE;
        }

        $truckData = [];

        // 1. Ekstrak dari Sheet MAOS jika ada
        if ($sheetMaos) {
            $highestRowMaos = min($sheetMaos->getHighestRow(), 95);
            for ($r = 4; $r <= $highestRowMaos; $r++) {
                $rawNopol = trim((string) $sheetMaos->getCell("B{$r}")->getValue());
                if ($rawNopol === '' || in_array(strtoupper($rawNopol), ['TOTAL', 'JUMLAH', 'EXPIRED', 'AFKIR', 'KETERANGAN', 'MT INDUSTRI'])) {
                    continue;
                }
                $nopol = strtoupper(preg_replace('/\s+/', '', $rawNopol));
                if (! preg_match('/^[A-Z0-9]+$/', $nopol)) {
                    continue;
                }

                $trans = trim((string) $sheetMaos->getCell("C{$r}")->getValue()) ?: 'PT Pertamina Patra Niaga';
                $co2_1 = $this->parseDateValue($sheetMaos->getCell("E{$r}")->getValue());
                $co2_2 = $this->parseDateValue($sheetMaos->getCell("F{$r}")->getValue());
                $dcp = $this->parseDateValue($sheetMaos->getCell("G{$r}")->getValue());
                $foam = $this->parseDateValue($sheetMaos->getCell("H{$r}")->getValue());
                $catridge = $this->parseDateValue($sheetMaos->getCell("I{$r}")->getValue());

                if (! isset($truckData[$nopol])) {
                    $truckData[$nopol] = [
                        'plate_number' => $nopol,
                        'transportir' => $trans,
                        'slots' => [],
                    ];
                }

                if ($co2_1) $truckData[$nopol]['slots']['CO2-1'] = $co2_1;
                if ($co2_2) $truckData[$nopol]['slots']['CO2-2'] = $co2_2;
                if ($dcp) $truckData[$nopol]['slots']['DCP-1'] = $dcp;
                if ($catridge) $truckData[$nopol]['slots']['DCP-C'] = $catridge;
                if ($foam) $truckData[$nopol]['slots']['FOAM-2'] = $foam;
            }
        }

        // 2. Ekstrak dari Sheet REKAP APAR DEDI (Update dengan data terbaru 2026/2027)
        if ($sheetDedi) {
            $highestRowDedi = min($sheetDedi->getHighestRow(), 120);
            for ($r = 2; $r <= $highestRowDedi; $r++) {
                $rawNopol = trim((string) $sheetDedi->getCell("B{$r}")->getValue());
                if ($rawNopol === '' || in_array(strtoupper($rawNopol), ['TOTAL', 'JUMLAH', 'EXPIRED', 'AFKIR'])) {
                    continue;
                }
                $nopol = strtoupper(preg_replace('/\s+/', '', $rawNopol));
                if (! preg_match('/^[A-Z0-9]+$/', $nopol)) {
                    continue;
                }

                $trans = trim((string) $sheetDedi->getCell("C{$r}")->getValue());
                $co2_1 = $this->parseDateValue($sheetDedi->getCell("D{$r}")->getValue());
                $co2_2 = $this->parseDateValue($sheetDedi->getCell("E{$r}")->getValue());
                $dcp_1 = $this->parseDateValue($sheetDedi->getCell("F{$r}")->getValue());
                $dcp_2 = $this->parseDateValue($sheetDedi->getCell("G{$r}")->getValue());
                $dcp_c = $this->parseDateValue($sheetDedi->getCell("H{$r}")->getValue());
                $foam_1 = $this->parseDateValue($sheetDedi->getCell("I{$r}")->getValue());
                $foam_2 = $this->parseDateValue($sheetDedi->getCell("J{$r}")->getValue());

                if (! isset($truckData[$nopol])) {
                    $truckData[$nopol] = [
                        'plate_number' => $nopol,
                        'transportir' => $trans ?: 'PT Pertamina Patra Niaga',
                        'slots' => [],
                    ];
                } elseif (! empty($trans)) {
                    $truckData[$nopol]['transportir'] = $trans;
                }

                // Data Dedi meng-update masa kedaluwarsa ke tanggal valid terbaru
                if ($co2_1) $truckData[$nopol]['slots']['CO2-1'] = $co2_1;
                if ($co2_2) $truckData[$nopol]['slots']['CO2-2'] = $co2_2;
                if ($dcp_1) $truckData[$nopol]['slots']['DCP-1'] = $dcp_1;
                if ($dcp_2) $truckData[$nopol]['slots']['DCP-2'] = $dcp_2;
                if ($dcp_c) $truckData[$nopol]['slots']['DCP-C'] = $dcp_c;
                if ($foam_1) $truckData[$nopol]['slots']['FOAM-1'] = $foam_1;
                if ($foam_2) $truckData[$nopol]['slots']['FOAM-2'] = $foam_2;
            }
        }

        $totalTrucks = count($truckData);
        $this->info("Ditemukan {$totalTrucks} unit Mobil Tangki riil aktif BBM MAOS.");

        $now = Carbon::today();
        $stats = [
            'trucks_created' => 0,
            'trucks_updated' => 0,
            'trucks_deleted' => 0,
            'apars_created' => 0,
            'apars_updated' => 0,
            'apars_deleted' => 0,
            'apars_expired' => 0,
            'apars_active' => 0,
        ];

        DB::beginTransaction();
        try {
            // 3. Bersihkan Mobil Tangki Dummy (B 1234 ABC, B 5678 DEF, dll.)
            $dummyTruckPlates = ['B 1234 ABC', 'B 5678 DEF', 'B1234ABC', 'B5678DEF', 'E9542YC'];
            $dummyTrucks = TankTruck::whereIn('plate_number', $dummyTruckPlates)
                ->orWhere('driver_name', 'like', 'Supir Mobil%')
                ->get();

            foreach ($dummyTrucks as $dTruck) {
                $this->warn("Menghapus Mobil Tangki dummy: {$dTruck->plate_number} ({$dTruck->driver_name})");
                // Hapus APAR terkait
                Apar::where('tank_truck_id', $dTruck->id)->forceDelete();
                $dTruck->forceDelete();
                $stats['trucks_deleted']++;
            }

            // Hapus juga APAR statis dummy lama yang menggunakan Monas Jakarta
            Apar::where('serial_number', 'like', 'APAR-STATIS-%')->forceDelete();

            $existingTrucks = TankTruck::get()->keyBy(function ($item) {
                return strtoupper(preg_replace('/\s+/', '', $item->plate_number));
            });

            $existingApars = Apar::where('location_type', 'mobile')->get()->keyBy('serial_number');

            $tableRows = [];

            // 4. Sinkronisasi Setiap Mobil Tangki Riil
            foreach ($truckData as $plate => $data) {
                $transportir = $data['transportir'];
                $tankTruck = $existingTrucks->get($plate);

                $driverName = "Awak MT " . ($transportir ?: 'Pertamina FT Maos');
                $driverPhone = '0812' . substr(abs(crc32($plate)), 0, 8);

                if (! $tankTruck) {
                    $stats['trucks_created']++;
                    if (! $isDryRun) {
                        $tankTruck = TankTruck::create([
                            'plate_number' => $plate,
                            'driver_name' => $driverName,
                            'driver_phone' => $driverPhone,
                            'description' => "Transportir: {$transportir}",
                            'status' => 'active',
                        ]);
                        $existingTrucks->put($plate, $tankTruck);
                    }
                } else {
                    $stats['trucks_updated']++;
                    if (! $isDryRun) {
                        $tankTruck->update([
                            'plate_number' => $plate,
                            'driver_name' => (str_contains($tankTruck->driver_name, 'Supir') || str_contains($tankTruck->driver_name, 'Update') || str_contains($tankTruck->driver_name, 'Belum Diatur')) ? $driverName : $tankTruck->driver_name,
                            'driver_phone' => (str_contains($tankTruck->driver_phone, 'Update') || str_contains($tankTruck->driver_phone, 'Belum Diatur')) ? $driverPhone : $tankTruck->driver_phone,
                            'description' => "Transportir: {$transportir}",
                            'status' => 'active',
                        ]);
                    }
                }

                $slots = $data['slots'];
                $truckActiveCount = 0;
                $truckExpiredCount = 0;
                $validSerialNumbersForTruck = [];

                foreach ($slots as $slotKey => $expDateStr) {
                    $expCarbon = Carbon::parse($expDateStr)->startOfDay();
                    $isExpired = $expCarbon->isPast();

                    if ($isExpired) {
                        $stats['apars_expired']++;
                        $truckExpiredCount++;
                    } else {
                        $stats['apars_active']++;
                        $truckActiveCount++;
                    }

                    // Mapping slot ke tipe, serial number dan kapasitas
                    [$typeKey, $serialSuffix, $capacity] = $this->resolveSlotConfig($slotKey, $slots, $plate, $existingApars);
                    $serialNumber = "{$plate}{$serialSuffix}";
                    $validSerialNumbersForTruck[] = $serialNumber;
                    $aparTypeId = $aparTypeMap[$typeKey];

                    $existingApar = $existingApars->get($serialNumber);

                    // Tentukan status APAR
                    $aparStatus = $isExpired ? AparStatus::Inactive : AparStatus::Active;
                    if ($existingApar && in_array($existingApar->status, [AparStatus::NeedsRepair, AparStatus::UnderRepair])) {
                        // Pertahankan status perbaikan jika sedang dalam alur perbaikan/reinspeksi
                        $aparStatus = $existingApar->status;
                    }

                    if (! $isDryRun) {
                        if ($existingApar) {
                            $stats['apars_updated']++;
                            $existingApar->update([
                                'tank_truck_id' => $tankTruck->id,
                                'location_type' => 'mobile',
                                'location_name' => "{$plate} - {$transportir}",
                                'apar_type_id' => $aparTypeId,
                                'capacity' => $capacity,
                                'expired_at' => $expCarbon,
                                'status' => $aparStatus,
                                'notes' => 'Tervalidasi sesuai data fisik armada Pertamina FT Maos',
                            ]);
                        } else {
                            $stats['apars_created']++;
                            $newApar = Apar::create([
                                'serial_number' => $serialNumber,
                                'qr_code' => 'APAR-' . Str::upper(Str::random(10)),
                                'location_type' => 'mobile',
                                'location_name' => "{$plate} - {$transportir}",
                                'latitude' => null,
                                'longitude' => null,
                                'valid_radius' => null,
                                'apar_type_id' => $aparTypeId,
                                'capacity' => $capacity,
                                'manufactured_date' => $expCarbon->copy()->subYears(5),
                                'expired_at' => $expCarbon,
                                'tank_truck_id' => $tankTruck->id,
                                'status' => $aparStatus,
                                'notes' => 'Diimpor otomatis dari REKAP APAR FT MAOS',
                            ]);
                            $existingApars->put($serialNumber, $newApar);
                        }
                    } else {
                        if ($existingApar) {
                            $stats['apars_updated']++;
                        } else {
                            $stats['apars_created']++;
                        }
                    }
                }

                // Bersihkan APAR mock lama pada mobil tangki ini yang punya expired_at dummy 2030-12-31
                if (! $isDryRun && $tankTruck) {
                    $mockApars = Apar::where('tank_truck_id', $tankTruck->id)
                        ->whereNotIn('serial_number', $validSerialNumbersForTruck)
                        ->where('expired_at', 'like', '2030-12-31%')
                        ->get();

                    foreach ($mockApars as $mockApar) {
                        $mockApar->forceDelete();
                        $stats['apars_deleted']++;
                    }
                }

                $tableRows[] = [
                    $plate,
                    Str::limit($transportir, 26),
                    count($slots),
                    $truckActiveCount,
                    $truckExpiredCount,
                ];
            }

            if (! $isDryRun) {
                DB::commit();
                $this->info("✓ Seluruh transaksi database berhasil di-commit.");
            } else {
                DB::rollBack();
                $this->warn("Simulasi selesai. Tidak ada perubahan yang disimpan ke database.");
            }

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Gagal sinkronisasi APAR BBM MAOS: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            $this->error("Terjadi kesalahan saat memproses data: " . $e->getMessage());
            return Command::FAILURE;
        }

        // Tampilkan tabel ringkasan
        $this->table(
            ['Nopol', 'Transportir', 'Total APAR', 'Aktif', 'Expired'],
            array_slice($tableRows, 0, 15)
        );
        if (count($tableRows) > 15) {
            $this->line("... dan " . (count($tableRows) - 15) . " mobil tangki lainnya.");
        }

        $this->newLine();
        $this->info("=== RINGKASAN HASIL SINKRONISASI BBM MAOS ===");
        $this->table(
            ['Metrik', 'Jumlah'],
            [
                ['Total Mobil Tangki Diproses', $totalTrucks],
                ['Mobil Tangki Baru Dibuat', $stats['trucks_created']],
                ['Mobil Tangki Diperbarui', $stats['trucks_updated']],
                ['Mobil Tangki Dummy Dihapus', $stats['trucks_deleted']],
                ['Total APAR Riil Diproses', $stats['apars_created'] + $stats['apars_updated']],
                ['APAR Diperbarui (Eksisting)', $stats['apars_updated']],
                ['APAR Baru Ditambahkan', $stats['apars_created']],
                ['APAR Mock/Kadaluwarsa Palsu Dihapus', $stats['apars_deleted']],
                ['Status APAR Aktif', $stats['apars_active']],
                ['Status APAR Kedaluwarsa (< ' . $now->toDateString() . ')', $stats['apars_expired']],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Parse nilai tanggal dari format serial Excel atau teks string.
     */
    private function parseDateValue(mixed $val): ?string
    {
        if (empty($val)) {
            return null;
        }

        if (is_numeric($val) && $val > 30000 && $val < 60000) {
            return ExcelDate::excelToDateTimeObject((float) $val)->format('Y-m-d');
        }

        if (is_string($val)) {
            $val = trim($val);
            if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})/', $val, $m)) {
                return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
            }
            if (preg_match('/^\d{4}-\d{2}-\d{2}/', $val)) {
                return substr($val, 0, 10);
            }
        }

        return null;
    }

    /**
     * Mapping slot konfigurasi APAR Mobil Tangki Pertamina BBM Maos.
     *
     * @return array{0: string, 1: string, 2: int} [typeKey, serialSuffix, capacity]
     */
    private function resolveSlotConfig(string $slotKey, array $allSlots, string $plate, $existingApars): array
    {
        return match ($slotKey) {
            'CO2-1' => ['co2', '-CO2-1', 3],
            'CO2-2' => ['co2', '-CO2-2', 3],
            'DCP-C' => ['dcp_cartridge', '-DCP-Cartridge', 6],
            'DCP-1' => $this->resolveDcp1($allSlots, $plate, $existingApars),
            'DCP-2' => ['dcp_pressure', '-DCP-Pressure-2', 6],
            'FOAM-1' => ['foam', '-FOAM-1', 9],
            'FOAM-2' => $this->resolveFoam2($allSlots, $plate, $existingApars),
            default => ['dcp_pressure', "-{$slotKey}", 6],
        };
    }

    private function resolveDcp1(array $allSlots, string $plate, $existingApars): array
    {
        if (isset($existingApars["{$plate}-DCP-Pressure"])) {
            return ['dcp_pressure', '-DCP-Pressure', 6];
        }
        $suffix = isset($allSlots['DCP-2']) ? '-DCP-Pressure-1' : '-DCP-Pressure';
        return ['dcp_pressure', $suffix, 6];
    }

    private function resolveFoam2(array $allSlots, string $plate, $existingApars): array
    {
        if (isset($existingApars["{$plate}-FOAM"])) {
            return ['foam', '-FOAM', 9];
        }
        $suffix = isset($allSlots['FOAM-1']) ? '-FOAM-2' : '-FOAM';
        return ['foam', $suffix, 9];
    }
}
