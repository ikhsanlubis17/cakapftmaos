<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RepairApproval;
use App\Models\User;
use App\Models\Notification;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EscalateOverdueApprovals extends Command
{
    /**
     * Nama dan signature command.
     * Dijalankan secara terjadwal setiap jam untuk memantau SLA approval supervisor.
     */
    protected $signature = 'inspection:escalate-approvals
                            {--dry-run : Tampilkan saja daftar approval yang akan di-eskalasi, tanpa kirim notifikasi}';

    protected $description = 'Kirim pengingat dan eskalasi approval perbaikan APAR yang melewati SLA ke supervisor';

    public function handle(): int
    {
        $slaPrimaryHours   = (int) Setting::getValue('approval_sla_hours', 24);
        $slaEscalateHours  = (int) Setting::getValue('approval_escalate_hours', 48);
        $reminderInterval  = (int) Setting::getValue('approval_reminder_interval_hours', 6);

        $isDryRun = $this->option('dry-run');

        $this->info('=== Escalate Overdue Approvals ===');
        $this->line("SLA Primer: {$slaPrimaryHours}h | Eskalasi Penuh: {$slaEscalateHours}h | Min. jeda antar reminder: {$reminderInterval}h");

        $overdueApprovals = RepairApproval::with([
            'inspection.apar',
            'inspection.user', // Teknisi penginspeksi
            'approver',        // Supervisor yang approve/reject
        ])
            ->where('status', 'pending')
            ->where('created_at', '<', now()->subHours($slaPrimaryHours))
            ->get();

        if ($overdueApprovals->isEmpty()) {
            $this->info('Tidak ada approval yang melewati SLA.');
            return self::SUCCESS;
        }

        $this->info("Ditemukan {$overdueApprovals->count()} approval melewati SLA.");

        $reminderCount   = 0;
        $escalationCount = 0;

        // Ambil semua supervisor aktif untuk eskalasi penuh
        $allSupervisors = User::where('is_active', true)
            ->where(function ($q) {
                $q->where('role', 'supervisor')->orWhere('role', 'admin');
            })
            ->get();

        foreach ($overdueApprovals as $approval) {
            $hoursOverdue = $approval->created_at->diffInHours(now());
            $isEscalation = $hoursOverdue >= $slaEscalateHours;

            // Anti-spam: jangan kirim reminder jika sudah dikirim dalam interval minimum
            if ($approval->last_reminder_at) {
                $hoursSinceLastReminder = Carbon::parse($approval->last_reminder_at)->diffInHours(now());
                if ($hoursSinceLastReminder < $reminderInterval) {
                    $this->line("  ↷ Skip approval #{$approval->id} (reminder terakhir {$hoursSinceLastReminder}h yang lalu)");
                    continue;
                }
            }

            $apar        = $approval->inspection?->apar;
            $inspeksiBy  = $approval->inspection?->user;
            $aparLabel   = $apar ? "APAR {$apar->serial_number}" : "APAR #?";
            $inspLabel   = $inspeksiBy ? "oleh {$inspeksiBy->name}" : '';

            $message = "⚠️ ESKALASI SLA Approval Perbaikan APAR\n\n" .
                "Permintaan perbaikan {$aparLabel} {$inspLabel} telah menunggu persetujuan selama " .
                "**{$hoursOverdue} jam** (SLA: {$slaPrimaryHours} jam).\n\n" .
                "ID Approval: #{$approval->id}\n" .
                "Waktu Submit: {$approval->created_at->format('d M Y H:i')}\n\n" .
                ($isEscalation
                    ? "🔴 ESKALASI PENUH: Melebihi {$slaEscalateHours} jam — semua supervisor diberitahu.\n"
                    : "🟠 PENGINGAT: Harap segera tinjau dan beri keputusan.\n") .
                "\nLogin ke CAKAP FT MAOS untuk meninjau permintaan ini.";

            if ($isDryRun) {
                $this->warn("  [DRY-RUN] Approval #{$approval->id} ({$aparLabel}) — {$hoursOverdue}h overdue" .
                    ($isEscalation ? ' [ESKALASI PENUH]' : ' [REMINDER]'));
                continue;
            }

            // Tentukan penerima: reminder biasa ke semua supervisor, eskalasi ke SEMUA supervisor aktif
            $recipients = $isEscalation ? $allSupervisors : User::where('is_active', true)
                ->where(function ($q) {
                    $q->where('role', 'supervisor')->orWhere('role', 'admin');
                })
                ->get();

            foreach ($recipients as $supervisor) {
                if (!$supervisor->email) {
                    continue;
                }

                try {
                    Mail::raw($message, function ($mail) use ($supervisor, $aparLabel) {
                        $mail->to($supervisor->email)
                             ->subject("⚠️ [CAKAP FT MAOS] Eskalasi SLA — {$aparLabel} Menunggu Approval");
                    });

                    // Simpan ke tabel notifications
                    Notification::create([
                        'user_id' => $supervisor->id,
                        'type'    => 'email',
                        'title'   => "Eskalasi SLA — {$aparLabel} menunggu approval",
                        'content' => $message,
                        'data'    => [
                            'repair_approval_id' => $approval->id,
                            'hours_overdue'      => $hoursOverdue,
                            'is_escalation'      => $isEscalation,
                        ],
                        'status'  => 'sent',
                        'sent_at' => now('UTC'),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Gagal kirim notifikasi SLA escalation', [
                        'approval_id'  => $approval->id,
                        'supervisor_id'=> $supervisor->id,
                        'error'        => $e->getMessage(),
                    ]);
                }
            }

            // Update last_reminder_at untuk mencegah spam
            $approval->update(['last_reminder_at' => now()]);

            if ($isEscalation) {
                $escalationCount++;
                $this->error("  ✗ Eskalasi penuh: Approval #{$approval->id} ({$aparLabel}) — {$hoursOverdue}h overdue");
            } else {
                $reminderCount++;
                $this->warn("  ! Reminder: Approval #{$approval->id} ({$aparLabel}) — {$hoursOverdue}h overdue");
            }

            Log::warning('SLA Escalation: approval melebihi batas waktu', [
                'approval_id'   => $approval->id,
                'hours_overdue' => $hoursOverdue,
                'is_escalation' => $isEscalation,
                'apar_id'       => $apar?->id,
            ]);
        }

        if (!$isDryRun) {
            $this->info("Selesai: {$reminderCount} reminder, {$escalationCount} eskalasi penuh dikirim.");
        }

        return self::SUCCESS;
    }
}
