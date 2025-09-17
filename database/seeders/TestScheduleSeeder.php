<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InspectionSchedule;
use App\Models\User;
use App\Models\Apar;
use Carbon\Carbon;

class TestScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Ikhsanul Arifin user
        $teknisi = User::where('email', 'lubis163774@gmail.com')->first();
        
        if (!$teknisi) {
            $this->command->error('User Ikhsanul Arifin not found!');
            return;
        }

        // Get some APARs
        $apars = Apar::take(3)->get();
        
        if ($apars->isEmpty()) {
            $this->command->error('No APARs found! Please run AparSeeder first.');
            return;
        }

        // Create test schedules for today
        $today = Carbon::today();
        
        foreach ($apars as $index => $apar) {
            InspectionSchedule::create([
                'apar_id' => $apar->id,
                'assigned_user_id' => $teknisi->id,
                'scheduled_date' => $today->addDays($index)->toDateString(),
                'scheduled_time' => '08:00:00',
                'start_time' => '08:00:00',
                'end_time' => '12:00:00',
                'frequency' => 'weekly',
                'is_active' => true,
                'notes' => 'Test jadwal inspeksi untuk teknisi Ikhsanul Arifin - ' . ($index + 1),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Create a schedule for today specifically
        InspectionSchedule::create([
            'apar_id' => $apars->first()->id,
            'assigned_user_id' => $teknisi->id,
            'scheduled_date' => $today->toDateString(),
            'scheduled_time' => '14:00:00',
            'start_time' => '14:00:00',
            'end_time' => '17:00:00',
            'frequency' => 'weekly',
            'is_active' => true,
            'notes' => 'Jadwal inspeksi hari ini untuk teknisi Ikhsanul Arifin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('Test schedules created successfully for Ikhsanul Arifin!');
        $this->command->info('Email: lubis163774@gmail.com');
        $this->command->info('Total schedules created: ' . ($apars->count() + 1));
    }
}
