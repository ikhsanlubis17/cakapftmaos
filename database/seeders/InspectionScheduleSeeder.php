<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InspectionSchedule;
use App\Models\Apar;
use App\Models\User;
use Carbon\Carbon;

class InspectionScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get APARs and technicians
        $apars = Apar::all();
        $technicians = User::where('role', 'teknisi')->get();

        if ($apars->isEmpty() || $technicians->isEmpty()) {
            $this->command->info('No APARs or technicians found. Skipping schedule creation.');
            return;
        }

        // Clear existing schedules
        InspectionSchedule::query()->delete();

        // Create upcoming schedules for the next 7 days
        $appTimezone = config('app.timezone', 'UTC');
        $startDate = Carbon::today($appTimezone);

        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $apar = $apars->random();
            $technician = $technicians->random();
            $times = $this->getRandomTimeRange();

            $startAtLocal = Carbon::parse($date->toDateString() . ' ' . $times['start'], $appTimezone);
            $endAtLocal = Carbon::parse($date->toDateString() . ' ' . $times['end'], $appTimezone);

            if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
                $endAtLocal = $startAtLocal->copy()->addHour();
            }

            InspectionSchedule::create([
                'apar_id' => $apar->id,
                'assigned_user_id' => $technician->id,
                'start_at' => $startAtLocal->clone()->setTimezone('UTC'),
                'end_at' => $endAtLocal->clone()->setTimezone('UTC'),
                'frequency' => $this->getRandomFrequency(),
                'is_active' => true,
                'is_completed' => false,
                'notes' => $this->getRandomNotes(),
            ]);
        }

        // Create some overdue schedules (past dates)
        for ($i = 1; $i <= 3; $i++) {
            $date = $startDate->copy()->subDays($i);
            $apar = $apars->random();
            $technician = $technicians->random();
            $times = $this->getRandomTimeRange();

            $startAtLocal = Carbon::parse($date->toDateString() . ' ' . $times['start'], $appTimezone);
            $endAtLocal = Carbon::parse($date->toDateString() . ' ' . $times['end'], $appTimezone);

            if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
                $endAtLocal = $startAtLocal->copy()->addHour();
            }

            InspectionSchedule::create([
                'apar_id' => $apar->id,
                'assigned_user_id' => $technician->id,
                'start_at' => $startAtLocal->clone()->setTimezone('UTC'),
                'end_at' => $endAtLocal->clone()->setTimezone('UTC'),
                'frequency' => $this->getRandomFrequency(),
                'is_active' => true,
                'is_completed' => false,
                'notes' => $this->getRandomNotes(),
            ]);
        }

        // Create some completed schedules (past dates that have been completed)
        for ($i = 4; $i <= 6; $i++) {
            $date = $startDate->copy()->subDays($i);
            $apar = $apars->random();
            $technician = $technicians->random();
            $times = $this->getRandomTimeRange();

            $startAtLocal = Carbon::parse($date->toDateString() . ' ' . $times['start'], $appTimezone);
            $endAtLocal = Carbon::parse($date->toDateString() . ' ' . $times['end'], $appTimezone);

            if ($endAtLocal->lessThanOrEqualTo($startAtLocal)) {
                $endAtLocal = $startAtLocal->copy()->addHour();
            }

            InspectionSchedule::create([
                'apar_id' => $apar->id,
                'assigned_user_id' => $technician->id,
                'start_at' => $startAtLocal->clone()->setTimezone('UTC'),
                'end_at' => $endAtLocal->clone()->setTimezone('UTC'),
                'frequency' => $this->getRandomFrequency(),
                'is_active' => true,
                'is_completed' => true,
                'notes' => $this->getRandomNotes(),
            ]);
        }

        $this->command->info('Inspection schedules created successfully!');
        $this->command->info('Created schedules for the next 7 days and 3 overdue schedules.');
    }

    private function getRandomTimeRange(): array
    {
        $startTimes = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];
        $startTime = $startTimes[array_rand($startTimes)];

        // Add 2-4 hours to start time for end time
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end = $start->copy()->addHours(rand(2, 4));

        return [
            'start' => $startTime,
            'end' => $end->format('H:i')
        ];
    }

    private function getRandomFrequency(): string
    {
        $frequencies = ['daily', 'weekly', 'monthly'];
        return $frequencies[array_rand($frequencies)];
    }

    private function getRandomNotes(): string
    {
        $notes = [
            'Inspeksi rutin untuk memastikan APAR dalam kondisi baik',
            'Periksa tekanan dan kondisi fisik APAR',
            'Verifikasi tanggal kadaluarsa dan label APAR',
            'Inspeksi berkala sesuai standar keselamatan',
            'Pemeriksaan kondisi APAR dan area sekitarnya'
        ];
        return $notes[array_rand($notes)];
    }
}
