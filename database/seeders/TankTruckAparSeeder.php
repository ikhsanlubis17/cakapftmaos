<?php

namespace Database\Seeders;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\InspectionSchedule;
use App\Models\TankTruck;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TankTruckAparSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get AparType IDs by name
        $aparTypes = AparType::pluck('id', 'name')->toArray();

        // Ensure required APAR types exist
        $requiredTypes = ['co2', 'foam', 'dcp_pressure', 'dcp_cartridge'];
        foreach ($requiredTypes as $type) {
            if (! isset($aparTypes[$type])) {
                Log::error("Required APAR type '{$type}' not found in database");

                return;
            }
        }

        // Read CSV file
        $csvFile = base_path('APAR Maos.csv');
        if (! file_exists($csvFile)) {
            Log::error("CSV file not found: {$csvFile}");

            return;
        }

        // Read file content and detect/convert encoding
        $content = file_get_contents($csvFile);

        // Detect and convert encoding
        // Check for UTF-16 LE BOM (FF FE)
        if (substr($content, 0, 2) === "\xFF\xFE") {
            $content = mb_convert_encoding(substr($content, 2), 'UTF-8', 'UTF-16LE');
            Log::info('Detected UTF-16 LE encoding, converted to UTF-8');
        }
        // Check for UTF-16 BE BOM (FE FF)
        elseif (substr($content, 0, 2) === "\xFE\xFF") {
            $content = mb_convert_encoding(substr($content, 2), 'UTF-8', 'UTF-16BE');
            Log::info('Detected UTF-16 BE encoding, converted to UTF-8');
        }
        // Check for UTF-8 BOM (EF BB BF)
        elseif (substr($content, 0, 3) === "\xEF\xBB\xBF") {
            $content = substr($content, 3);
            Log::info('Detected UTF-8 BOM, removed');
        }

        // Write to temp file for fgetcsv processing
        $tempFile = tempnam(sys_get_temp_dir(), 'csv_');
        file_put_contents($tempFile, $content);

        // Open temp CSV file
        $handle = fopen($tempFile, 'r');
        if ($handle === false) {
            Log::error('Failed to open CSV file');
            unlink($tempFile);

            return;
        }

        // Read and skip header
        $header = fgetcsv($handle, 4096, ';', '"', '\\');
        Log::info("Starting CSV import from: {$csvFile}");

        $rowNumber = 1; // Start from 1 (header is row 0)
        $tankTrucksCreated = 0;
        $tankTrucksUpdated = 0;
        $aparsCreated = 0;
        $schedulesCreated = 0;
        $errors = 0;

        // Process each row
        while (($data = fgetcsv($handle, 4096, ';', '"', '\\')) !== false) {

            $rowNumber++;

            // Limit to 8 relevant columns
            $data = array_slice($data, 0, 8);

            // Skip empty rows (rows with only empty strings/semicolons)
            $trimmedData = array_map('trim', $data);
            if (empty(array_filter($trimmedData, fn ($v) => $v !== ''))) {
                Log::info("Skipping empty row {$rowNumber}");

                continue;
            }

            // Skip rows without valid data
            if (count($data) < 3 || empty(trim($data[1] ?? ''))) {
                Log::info("Skipping invalid row {$rowNumber}: Not enough columns or missing NOPOL");

                continue;
            }

            try {
                // Extract data from CSV columns
                // Column indices: 0=NO, 1=NOPOL, 2=TRANSPORTIR, 3=CO2 PERTAMA,
                // 4=CO2 KEDUA, 5=DCP PRESSURE, 6=FOAM, 7=DCP CATRIDGE
                $no = trim($data[0] ?? '');
                $nopol = strtoupper(trim($data[1] ?? ''));
                $transportir = trim($data[2] ?? '');
                $co2Pertama = trim($data[3] ?? '');
                $co2Kedua = trim($data[4] ?? '');
                $dcpPressure = trim($data[5] ?? '');
                $foam = trim($data[6] ?? '');
                $dcpCartridge = trim($data[7] ?? '');

                // Skip if no valid data
                if (empty($nopol) || empty($transportir)) {
                    Log::info("Skipping row {$rowNumber}: Missing NOPOL or transportir");

                    continue;
                }

                // Create or update tank truck
                $tankTruck = TankTruck::updateOrCreate(
                    ['plate_number' => $nopol],
                    [
                        'driver_name' => '(Update Nanti)',
                        'driver_phone' => '(Update Nanti)',
                        'description' => "Transportir: {$transportir}",
                        'status' => 'active',
                    ]
                );

                if ($tankTruck->wasRecentlyCreated) {
                    $tankTrucksCreated++;
                    Log::info("Created tank truck: {$nopol}");
                } else {
                    $tankTrucksUpdated++;
                    Log::info("Updated tank truck: {$nopol}");
                }

                // Define APAR configurations
                $aparConfigs = [
                    [
                        'type' => 'co2',
                        'suffix' => '-CO2-1',
                        'service_date' => $co2Pertama,
                    ],
                    [
                        'type' => 'co2',
                        'suffix' => '-CO2-2',
                        'service_date' => $co2Kedua,
                    ],
                    [
                        'type' => 'dcp_pressure',
                        'suffix' => '-DCP-Pressure',
                        'service_date' => $dcpPressure,
                    ],
                    [
                        'type' => 'foam',
                        'suffix' => '-FOAM',
                        'service_date' => $foam,
                    ],
                    [
                        'type' => 'dcp_cartridge',
                        'suffix' => '-DCP-Cartridge',
                        'service_date' => $dcpCartridge,
                    ],
                ];

                // Process each APAR configuration
                foreach ($aparConfigs as $config) {
                    // Skip if service date is empty or contains "cadangan"
                    if (empty($config['service_date']) ||
                        strtolower($config['service_date']) === 'cadangan') {
                        continue;
                    }

                    try {
                        // Parse service date from CSV format (DD/MM/YYYY)
                        $serviceDate = Carbon::createFromFormat('d/m/Y', $config['service_date']);
                        $serviceDate->setTime(0, 0, 0);

                        // Generate random capacity based on type
                        $capacity = $this->generateCapacity($config['type']);

                        // Create APAR
                        $apar = Apar::create([
                            'serial_number' => $nopol.$config['suffix'],
                            'qr_code' => 'APAR-'.Str::random(10),
                            'location_type' => 'mobile',
                            'location_name' => "{$nopol} - {$transportir}",
                            'latitude' => null,
                            'longitude' => null,
                            'valid_radius' => null,
                            'apar_type_id' => $aparTypes[$config['type']],
                            'capacity' => $capacity,
                            'manufactured_date' => Carbon::createFromDate(2024, 1, 1),
                            'expired_at' => Carbon::createFromDate(2030, 12, 31),
                            'tank_truck_id' => $tankTruck->id,
                            'status' => 'active',
                        ]);

                        $aparsCreated++;
                        Log::info(
                            "Created APAR: {$apar->serial_number} ({$config['type']}, capacity: {$capacity})"
                        );

                        // Create inspection schedule (service date + 6 months)
                        $nextInspectionDate = $serviceDate->copy()->addMonths(6);
                        $timezone = config('app.timezone', 'UTC');
                        $scheduleStart = $nextInspectionDate->copy()
                            ->setTime(8, 0, 0)
                            ->setTimezone($timezone);

                        InspectionSchedule::create([
                            'apar_id' => $apar->id,
                            'assigned_user_id' => null,
                            'start_at' => $scheduleStart,
                            'end_at' => $scheduleStart->copy()->addHour(),
                            'frequency' => 'once',
                            'is_active' => true,
                            'is_completed' => false,
                            'priority' => 'normal',
                            'notes' => "Jadwal inspeksi berdasarkan tanggal servis: {$serviceDate->format('d/m/Y')}",
                        ]);

                        $schedulesCreated++;
                        Log::info(
                            "Created schedule for {$apar->serial_number}: ".
                            $scheduleStart->format('d/m/Y H:i')
                        );

                    } catch (\Exception $e) {
                        Log::error(
                            "Error creating APAR for {$nopol} row {$rowNumber}: ".$e->getMessage()
                        );
                        $errors++;
                    }
                }

            } catch (\Exception $e) {
                Log::error(
                    "Error processing row {$rowNumber}: ".$e->getMessage()
                );
                $errors++;
            }
        }

        fclose($handle);
        unlink($tempFile); // Clean up temp file

        // Log summary
        Log::info('Import completed:');
        Log::info("- Tank trucks created: {$tankTrucksCreated}");
        Log::info("- Tank trucks updated: {$tankTrucksUpdated}");
        Log::info("- APARs created: {$aparsCreated}");
        Log::info("- Schedules created: {$schedulesCreated}");
        Log::info("- Errors encountered: {$errors}");
    }

    /**
     * Generate random capacity based on APAR type.
     */
    private function generateCapacity(string $type): int
    {
        return match ($type) {
            'co2' => rand(0, 1) === 0 ? 3 : 6, // 3 or 6 kg
            'dcp_pressure' => rand(0, 1) === 0 ? 3 : 6, // 3 or 6 kg
            'dcp_cartridge' => rand(0, 1) === 0 ? 3 : 6, // 3 or 6 kg
            'foam' => 9, // 9 liters (fixed)
            default => 3, // default fallback
        };
    }
}
