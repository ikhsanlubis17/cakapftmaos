<?php

namespace Database\Seeders;

use App\Models\Inspection;
use App\Models\RepairApproval;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RepairApprovalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Mengaitkan tiket persetujuan perbaikan dengan temuan riil inspeksi lapangan.
     */
    public function run(): void
    {
        // Bersihkan data dummy perbaikan lama
        RepairApproval::query()->forceDelete();

        $supervisor = User::where('role', 'supervisor')->first();
        if (! $supervisor) {
            $this->command?->warn('RepairApprovalSeeder dilewati: Supervisor belum terdaftar.');
            return;
        }

        // Ambil inspeksi yang membutuhkan perbaikan
        $repairInspections = Inspection::where('requires_repair', true)->get();

        if ($repairInspections->isEmpty()) {
            $this->command?->info('Tidak ada temuan inspeksi yang memerlukan perbaikan.');
            return;
        }

        $createdCount = 0;
        foreach ($repairInspections as $index => $inspection) {
            $inspDate = $inspection->created_at ?? Carbon::now()->subDays(5);
            $isOld = $inspDate->copy()->diffInDays(Carbon::now()) > 7;

            // Status: inspeksi lampau diselesaikan (completed), yang terkini disetujui (approved/pending)
            if ($isOld || $index % 3 === 0) {
                $status = 'completed';
                $approvedAt = $inspDate->copy()->addDay();
                $completedAt = $inspDate->copy()->addDays(2);
                $adminNotes = 'Disetujui untuk penggantian tabung APAR cadangan dari Workshop DCM.';
                $repairNotes = 'Pergantian tabung cadangan telah selesai dilakukan oleh tim bengkel mitra MT FT Maos.';
                $inspection->update(['repair_status' => 'completed']);
            } elseif ($index % 2 === 0) {
                $status = 'approved';
                $approvedAt = $inspDate->copy()->addHours(6);
                $completedAt = null;
                $adminNotes = 'Disetujui. Silakan teknisi mengambil tabung cadangan siap pakai di Gudang DCM.';
                $repairNotes = null;
                $inspection->update(['repair_status' => 'in_progress']);
            } else {
                $status = 'pending';
                $approvedAt = null;
                $completedAt = null;
                $adminNotes = null;
                $repairNotes = null;
                $inspection->update(['repair_status' => 'pending_approval']);
            }

            RepairApproval::create([
                'inspection_id' => $inspection->id,
                'approved_by' => $status === 'pending' ? null : $supervisor->id,
                'status' => $status,
                'admin_notes' => $adminNotes,
                'repair_notes' => $repairNotes,
                'approved_at' => $approvedAt,
                'completed_at' => $completedAt,
                'created_at' => $inspDate,
                'updated_at' => $completedAt ?: ($approvedAt ?: $inspDate),
            ]);

            $createdCount++;
        }

        $this->command?->info("✓ Berhasil membuat {$createdCount} data persetujuan perbaikan riil.");
    }
}
