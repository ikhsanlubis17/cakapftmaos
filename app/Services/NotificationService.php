<?php

namespace App\Services;

use App\Models\User;
use App\Models\Notification;
use App\Models\RepairApproval;
use App\Models\InspectionSchedule;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Send bulk inspection reminders for today only
     */
    public function sendBulkInspectionReminders()
    {
        try {
            $sentCount = 0;
            $appTimezone = config('app.timezone', 'UTC');
            $todayLocal = Carbon::now($appTimezone);
            $startOfDayUtc = $todayLocal->copy()->startOfDay()->setTimezone('UTC');
            $endOfDayUtc = $todayLocal->copy()->endOfDay()->setTimezone('UTC');

            $todaySchedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->whereBetween('start_at', [$startOfDayUtc, $endOfDayUtc])
                ->get();
            
            Log::info("Found {$todaySchedules->count()} schedules for today: " . $todayLocal->toDateString());
            
            foreach ($todaySchedules as $schedule) {
                Log::info("Processing schedule ID: {$schedule->id}, Start: " . optional($schedule->startAtLocal())->toDateTimeString() . ', User: ' . ($schedule->assignedUser ? $schedule->assignedUser->email : 'No user'));
                
                if ($schedule->assignedUser && $schedule->assignedUser->email) {
                    $sent = $this->sendScheduleNotification($schedule, 'reminder');
                    if ($sent) {
                        $sentCount++;
                    }
                }
            }
            
            Log::info("Bulk inspection reminders sent for today: {$sentCount} notifications");
            return $sentCount;
            
        } catch (\Exception $e) {
            Log::error('Error sending bulk inspection reminders for today: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send bulk inspection reminders for all active schedules
     */
    public function sendBulkInspectionRemindersAll()
    {
        try {
            $sentCount = 0;
            $nowUtc = Carbon::now('UTC');
            
            $allActiveSchedules = InspectionSchedule::with(['apar', 'assignedUser'])
                ->where('is_active', true)
                ->where('start_at', '>=', $nowUtc)
                ->get();
            
            foreach ($allActiveSchedules as $schedule) {
                if ($schedule->assignedUser && $schedule->assignedUser->email) {
                    $sent = $this->sendScheduleNotification($schedule, 'reminder');
                    if ($sent) {
                        $sentCount++;
                    }
                }
            }
            
            Log::info("Bulk inspection reminders sent for all active schedules: {$sentCount} notifications");
            return $sentCount;
            
        } catch (\Exception $e) {
            Log::error('Error sending bulk inspection reminders for all schedules: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send schedule notification to assigned technician
     */
    public function sendScheduleNotification(InspectionSchedule $schedule, $action = 'created')
    {
        try {
            if (!$schedule->assignedUser || !$schedule->assignedUser->email) {
                Log::warning('Schedule notification skipped: No assigned user or email', [
                    'schedule_id' => $schedule->id,
                    'assigned_user_id' => $schedule->assigned_user_id
                ]);
                return false;
            }

            $apar = $schedule->apar;
            $technician = $schedule->assignedUser;
            
            $subject = '';
            $message = '';
            
            switch ($action) {
                case 'created':
                    $subject = 'Jadwal Inspeksi APAR Baru - CAKAP FT MAOS';
                    $message = $this->getScheduleCreatedMessage($schedule, $apar, $technician);
                    break;
                    
                case 'updated':
                    $subject = 'Jadwal Inspeksi APAR Diperbarui - CAKAP FT MAOS';
                    $message = $this->getScheduleUpdatedMessage($schedule, $apar, $technician);
                    break;
                    
                case 'reminder':
                    $subject = 'Pengingat Inspeksi APAR Hari Ini - CAKAP FT MAOS';
                    $message = $this->getScheduleReminderMessage($schedule, $apar, $technician);
                    break;
                    
                default:
                    $subject = 'Notifikasi Jadwal Inspeksi APAR - CAKAP FT MAOS';
                    $message = $this->getScheduleDefaultMessage($schedule, $apar, $technician);
            }

            // Send email
            Mail::raw($message, function ($mailMessage) use ($technician, $subject) {
                $mailMessage->to($technician->email)
                           ->subject($subject);
            });

            // Log notification
            Notification::create([
                'user_id' => $technician->id,
                'type' => 'email',
                'title' => $subject,
                'content' => $message,
                'data' => [
                    'schedule_id' => $schedule->id,
                    'apar_id' => $apar->id,
                    'action' => $action,
                    'start_at' => optional($schedule->startAtUtc())->toIso8601String(),
                    'end_at' => optional($schedule->endAtUtc())->toIso8601String(),
                    'frequency' => $schedule->frequency
                ],
                'status' => 'sent',
                'sent_at' => now('UTC')
            ]);

            Log::info("Schedule notification sent successfully", [
                'schedule_id' => $schedule->id,
                'technician_id' => $technician->id,
                'action' => $action
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error sending schedule notification: ' . $e->getMessage(), [
                'schedule_id' => $schedule->id,
                'action' => $action
            ]);
            return false;
        }
    }

    /**
     * Get message for newly created schedule
     */
    private function getScheduleCreatedMessage($schedule, $apar, $technician)
    {
        [$date, $time] = $this->getScheduleWindowStrings($schedule);
        $frequency = $this->getFrequencyText($schedule->frequency);
        
        return "Halo {$technician->name},\n\n" .
               "Anda telah ditugaskan untuk melakukan inspeksi APAR dengan detail sebagai berikut:\n\n" .
               "📋 Detail Inspeksi:\n" .
               "• APAR: {$apar->serial_number}\n" .
               "• Lokasi: {$apar->location_name}\n" .
               "• Tanggal: {$date}\n" .
               "• Waktu: {$time}\n" .
               "• Frekuensi: {$frequency}\n\n" .
               "📝 Catatan: " . ($schedule->notes ?: 'Tidak ada catatan') . "\n\n" .
               "Mohon lakukan inspeksi sesuai jadwal yang telah ditentukan.\n\n" .
               "Terima kasih,\n" .
               "Sistem CAKAP FT MAOS";
    }

    /**
     * Get message for updated schedule
     */
    private function getScheduleUpdatedMessage($schedule, $apar, $technician)
    {
        [$date, $time] = $this->getScheduleWindowStrings($schedule);
        $frequency = $this->getFrequencyText($schedule->frequency);
        
        return "Halo {$technician->name},\n\n" .
               "Jadwal inspeksi APAR Anda telah diperbarui dengan detail sebagai berikut:\n\n" .
               "📋 Detail Inspeksi (Diperbarui):\n" .
               "• APAR: {$apar->serial_number}\n" .
               "• Lokasi: {$apar->location_name}\n" .
               "• Tanggal: {$date}\n" .
               "• Waktu: {$time}\n" .
               "• Frekuensi: {$frequency}\n\n" .
               "📝 Catatan: " . ($schedule->notes ?: 'Tidak ada catatan') . "\n\n" .
               "Mohon perhatikan perubahan jadwal dan lakukan inspeksi sesuai waktu yang baru.\n\n" .
               "Terima kasih,\n" .
               "Sistem CAKAP FT MAOS";
    }



    /**
     * Get default schedule message
     */
    private function getScheduleDefaultMessage($schedule, $apar, $technician)
    {
        [$date, $time] = $this->getScheduleWindowStrings($schedule);
        $frequency = $this->getFrequencyText($schedule->frequency);
        
        return "Halo {$technician->name},\n\n" .
               "Anda memiliki jadwal inspeksi APAR dengan detail sebagai berikut:\n\n" .
               "📋 Detail Inspeksi:\n" .
               "• APAR: {$apar->serial_number}\n" .
               "• Lokasi: {$apar->location_name}\n" .
               "• Tanggal: {$date}\n" .
               "• Waktu: {$time}\n" .
               "• Frekuensi: {$frequency}\n\n" .
               "📝 Catatan: " . ($schedule->notes ?: 'Tidak ada catatan') . "\n\n" .
               "Mohon lakukan inspeksi sesuai jadwal yang telah ditentukan.\n\n" .
               "Terima kasih,\n" .
               "Sistem CAKAP FT MAOS";
    }

    /**
     * Get frequency text in Indonesian
     */
    private function getFrequencyText($frequency)
    {
        switch ($frequency) {
            case 'daily':
                return 'Harian';
            case 'weekly':
                return 'Mingguan';
            case 'monthly':
                return 'Bulanan';
            default:
                return $frequency;
        }
    }

    /**
     * Format schedule window for notifications.
     */
    private function getScheduleWindowStrings(InspectionSchedule $schedule): array
    {
        $startAtLocal = $schedule->startAtLocal();
        $endAtLocal = $schedule->endAtLocal();

        $date = $startAtLocal
            ? $startAtLocal->locale('id')->isoFormat('dddd, D MMMM Y')
            : '-';

        $startTime = $startAtLocal ? $startAtLocal->format('H:i') : '-';
        $endTime = $endAtLocal ? $endAtLocal->format('H:i') : null;

        $time = $endTime ? $startTime . ' - ' . $endTime : $startTime;

        return [$date, $time];
    }

    /**
     * Send repair approval notification to technician
     */
    public function sendRepairApprovalNotification(RepairApproval $repairApproval, $action = 'approved')
    {
        try {
            $technician = $repairApproval->inspection->user;
            $apar = $repairApproval->inspection->apar;
            $admin = $repairApproval->approver;

            if (!$technician || !$apar) {
                Log::warning('Missing technician or APAR data for notification', [
                    'repair_approval_id' => $repairApproval->id
                ]);
                return false;
            }

            $subject = '';
            $message = '';
            $notificationType = '';

            switch ($action) {
                case 'approved':
                    $subject = 'Permintaan Perbaikan APAR Disetujui - CAKAP FT MAOS';
                    $message = "Halo {$technician->name},\n\n" .
                               "Permintaan perbaikan APAR Anda telah disetujui oleh admin.\n\n" .
                               "📋 Detail APAR:\n" .
                               "• Serial Number: {$apar->serial_number}\n" .
                               "• Lokasi: {$apar->location_name}\n" .
                               "• Jenis: " . ($apar->aparType->name ?? 'N/A') . "\n\n" .
                               "Mohon lakukan perbaikan sesuai dengan permintaan yang telah disetujui.\n\n" .
                               "Terima kasih,\n" .
                               "Sistem CAKAP FT MAOS";
                    $notificationType = 'repair_approved';
                    break;

                case 'rejected':
                    $subject = 'Permintaan Perbaikan APAR Ditolak - CAKAP FT MAOS';
                    $message = "Halo {$technician->name},\n\n" .
                               "Permintaan perbaikan APAR Anda telah ditolak oleh admin.\n\n" .
                               "📋 Detail APAR:\n" .
                               "• Serial Number: {$apar->serial_number}\n" .
                               "• Lokasi: {$apar->location_name}\n" .
                               "• Jenis: " . ($apar->aparType->name ?? 'N/A') . "\n\n" .
                               "Mohon hubungi admin untuk informasi lebih lanjut.\n\n" .
                               "Terima kasih,\n" .
                               "Sistem CAKAP FT MAOS";
                    $notificationType = 'repair_rejected';
                    break;

                default:
                    return false;
            }

            // Send email
            Mail::raw($message, function ($mailMessage) use ($technician, $subject) {
                $mailMessage->to($technician->email)
                           ->subject($subject);
            });

            // Log notification
            Notification::create([
                'user_id' => $technician->id,
                'type' => $notificationType,
                'title' => $subject,
                'content' => $message,
                'data' => [
                    'repair_approval_id' => $repairApproval->id,
                    'apar_id' => $apar->id,
                    'action' => $action,
                    'admin_id' => $admin->id ?? null
                ],
                'status' => 'sent',
                'sent_at' => now()
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error sending repair approval notification: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get approval message for technician
     */
    private function getApprovalMessage($technician, $apar, $repairApproval, $admin)
    {
        $adminName = $admin ? $admin->name : 'Administrator';
        $adminNotes = $repairApproval->admin_notes ? "\n\nCatatan Admin: {$repairApproval->admin_notes}" : '';

        return "Halo {$technician->name},

Permintaan perbaikan APAR Anda telah DISETUJUI.

Detail APAR:
- Nomor Seri: {$apar->serial_number}
- Lokasi: {$apar->location_name}
- Jenis: " . ($apar->aparType ? $apar->aparType->name : 'N/A') . "
- Kapasitas: {$apar->capacity} kg

Status: DISETUJUI
Disetujui oleh: {$adminName}
Tanggal: " . now()->format('d/m/Y H:i') . "

{$adminNotes}

Silakan lakukan perbaikan sesuai dengan temuan inspeksi. Setelah selesai, jangan lupa untuk melaporkan hasil perbaikan melalui sistem.

Terima kasih,
Tim CAKAP FT MAOS";
    }

    /**
     * Get rejection message for technician
     */
    private function getRejectionMessage($technician, $apar, $repairApproval, $admin)
    {
        $adminName = $admin ? $admin->name : 'Administrator';
        $adminNotes = $repairApproval->admin_notes;

        return "Halo {$technician->name},

Permintaan perbaikan APAR Anda telah DITOLAK.

Detail APAR:
- Nomor Seri: {$apar->serial_number}
- Lokasi: {$apar->location_name}
- Jenis: " . ($apar->aparType ? $apar->aparType->name : 'N/A') . "
- Kapasitas: {$apar->capacity} kg

Status: DITOLAK
Ditolak oleh: {$adminName}
Tanggal: " . now()->format('d/m/Y H:i') . "

Alasan Penolakan: {$adminNotes}

Silakan periksa kembali data inspeksi dan pastikan semua informasi lengkap dan akurat sebelum mengajukan ulang permintaan perbaikan.

Terima kasih,
Tim CAKAP FT MAOS";
    }

    /**
     * Get completion message for technician
     */
    private function getCompletionMessage($technician, $apar, $repairApproval, $admin)
    {
        $adminName = $admin ? $admin->name : 'Administrator';

        return "Halo {$technician->name},

Perbaikan APAR telah berhasil diselesaikan dan dilaporkan.

Detail APAR:
- Nomor Seri: {$apar->serial_number}
- Lokasi: {$apar->location_name}
- Jenis: " . ($apar->aparType ? $apar->aparType->name : 'N/A') . "
- Kapasitas: {$apar->capacity} kg

Status: SELESAI
Dilaporkan oleh: {$technician->name}
Tanggal: " . now()->format('d/m/Y H:i') . "

APAR telah siap digunakan kembali. Terima kasih atas kerja keras Anda dalam melakukan perbaikan.

Terima kasih,
Tim CAKAP FT MAOS";
    }

    /**
     * Send email notification
     */
    private function sendEmail($email, $subject, $message)
    {
        try {
            Mail::raw($message, function ($message) use ($email, $subject) {
                $message->to($email)
                        ->subject($subject);
            });
        } catch (\Exception $e) {
            Log::error('Failed to send email notification', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create in-app notification
     */
    private function createInAppNotification($userId, $type, $message, $relatedId = null)
    {
        try {
            Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'channel' => 'in_app',
                'recipient' => null,
                'message' => $message,
                'related_id' => $relatedId,
                'status' => 'unread'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create in-app notification', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notify admin of repair completion
     */
    private function notifyAdminOfCompletion($repairApproval, $technician)
    {
        try {
            // Get admin users
            $admins = User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                $message = "Perbaikan APAR telah selesai dilaporkan oleh teknisi {$technician->name}.";
                
                if ($admin->email) {
                    $this->sendEmail($admin->email, 'Perbaikan APAR Selesai', $message);
                }
                
                $this->createInAppNotification($admin->id, 'repair_completed_admin', $message, $repairApproval->id);
            }
        } catch (\Exception $e) {
            Log::error('Failed to notify admin of completion', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send inspection reminder to technician
     */
    public function sendInspectionReminder($technician, $schedule)
    {
        try {
            $subject = 'Pengingat Inspeksi APAR';
            $message = $this->getInspectionReminderMessage($technician, $schedule);

            if ($technician->email) {
                $this->sendEmail($technician->email, $subject, $message);
            }

            $this->createInAppNotification($technician->id, 'inspection_reminder', $message, $schedule->id);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send inspection reminder', [
                'technician_id' => $technician->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get inspection reminder message
     */
    private function getInspectionReminderMessage($technician, $schedule)
    {
    [$date, $time] = $this->getScheduleWindowStrings($schedule);

    return "Halo {$technician->name},

Ini adalah pengingat untuk melakukan inspeksi APAR sesuai jadwal yang telah ditentukan.

Detail Jadwal:
- Tanggal: {$date}
- Waktu: {$time}
- Lokasi: " . $schedule->apar->location_name . "
- APAR: {$schedule->apar->serial_number}

Silakan lakukan inspeksi tepat waktu dan laporkan hasilnya melalui sistem.

Terima kasih,
Tim CAKAP FT MAOS";
    }

    /**
     * Send schedule reminder email to technician
     */
    public function sendScheduleReminder(InspectionSchedule $schedule)
    {
        try {
            if (!$schedule->assignedUser || !$schedule->assignedUser->email) {
                Log::warning('Schedule reminder skipped: No assigned user or email', [
                    'schedule_id' => $schedule->id,
                    'assigned_user_id' => $schedule->assigned_user_id
                ]);
                return false;
            }

            $apar = $schedule->apar;
            $technician = $schedule->assignedUser;
            
            $subject = 'Pengingat Inspeksi APAR - CAKAP FT MAOS';
            $message = $this->getScheduleReminderMessage($schedule, $apar, $technician);

            // Send email
            Mail::raw($message, function ($mailMessage) use ($technician, $subject) {
                $mailMessage->to($technician->email)
                           ->subject($subject);
            });

            // Log notification
            Notification::create([
                'user_id' => $technician->id,
                'type' => 'schedule_reminder',
                'title' => $subject,
                'content' => $message,
                'channel' => 'email',
                'recipient' => $technician->email,
                'related_id' => $schedule->id,
                'status' => 'sent'
            ]);

            Log::info("Schedule reminder sent successfully to {$technician->email} for schedule ID: {$schedule->id}");
            return true;

        } catch (\Exception $e) {
            Log::error('Failed to send schedule reminder', [
                'schedule_id' => $schedule->id,
                'technician_email' => $schedule->assignedUser->email ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get schedule reminder message content
     */
    private function getScheduleReminderMessage($schedule, $apar, $technician)
    {
    [$date, $time] = $this->getScheduleWindowStrings($schedule);
        
        return "Halo {$technician->name},

Ini adalah pengingat untuk melakukan inspeksi APAR sesuai jadwal yang telah ditentukan.

DETAIL JADWAL INSPSPEKSI:
================================
📅 Tanggal: {$date}
⏰ Waktu: {$time}
🏢 Lokasi: {$apar->location_name}
🔧 APAR: {$apar->serial_number}
📋 Jenis APAR: " . ($apar->aparType ? $apar->aparType->name : 'N/A') . "
📏 Kapasitas: {$apar->capacity} kg

INSTRUKSI:
================================
1. Pastikan Anda berada di lokasi tepat waktu
2. Lakukan inspeksi sesuai checklist yang telah ditentukan
3. Ambil foto APAR dan selfie sebagai bukti
4. Laporkan hasil inspeksi melalui aplikasi CAKAP
5. Jika ada kerusakan, laporkan detail kerusakannya

PENTING:
================================
• Inspeksi harus dilakukan tepat waktu sesuai jadwal
• Foto bukti inspeksi wajib diambil
• Laporkan hasil segera setelah inspeksi selesai
• Jika ada kendala, hubungi admin segera

Terima kasih telah melaksanakan tugas dengan baik.

Salam,
Tim CAKAP FT MAOS
Sistem Manajemen APAR";
    }
} 