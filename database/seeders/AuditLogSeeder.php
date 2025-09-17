<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InspectionLog;
use App\Models\User;
use App\Models\Apar;
use Carbon\Carbon;

class AuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $apars = Apar::all();

        if ($users->isEmpty() || $apars->isEmpty()) {
            $this->command->info('No users or APARs found. Please seed users and APARs first.');
            return;
        }

        $actions = ['scan_qr', 'start_inspection', 'submit_inspection', 'validation_failed'];
        $ipAddresses = ['192.168.1.100', '192.168.1.101', '192.168.1.102', '10.0.0.50', '10.0.0.51'];
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        ];

        $deviceInfos = [
            ['browser' => 'Chrome', 'platform' => 'Windows'],
            ['browser' => 'Chrome', 'platform' => 'Mac'],
            ['browser' => 'Safari', 'platform' => 'iOS'],
            ['browser' => 'Firefox', 'platform' => 'Android'],
            ['browser' => 'Firefox', 'platform' => 'Windows']
        ];

        // Generate logs for the last 30 days
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            $apar = $apars->random();
            $action = $actions[array_rand($actions)];
            $ipAddress = $ipAddresses[array_rand($ipAddresses)];
            $userAgent = $userAgents[array_rand($userAgents)];
            $deviceInfo = $deviceInfos[array_rand($deviceInfos)];
            
            // Random date within last 30 days
            $createdAt = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));
            
            // Random coordinates (Jakarta area)
            $lat = -6.2088 + (rand(-100, 100) / 1000);
            $lng = 106.8456 + (rand(-100, 100) / 1000);
            
            $isSuccessful = $action !== 'validation_failed';
            
            $details = match($action) {
                'scan_qr' => 'QR code scanned successfully',
                'start_inspection' => 'Inspection started',
                'submit_inspection' => $isSuccessful ? 'Inspection submitted successfully' : 'Inspection submitted but location validation failed',
                'validation_failed' => 'Location validation failed - outside valid radius',
                default => 'Action performed'
            };

            InspectionLog::create([
                'apar_id' => $apar->id,
                'user_id' => $user->id,
                'inspection_id' => null, // Set to null to avoid foreign key constraint
                'action' => $action,
                'lat' => $lat,
                'lng' => $lng,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'device_info' => $deviceInfo,
                'details' => $details,
                'is_successful' => $isSuccessful,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        $this->command->info('Sample audit logs created successfully!');
    }
} 