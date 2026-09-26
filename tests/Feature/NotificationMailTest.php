<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\Inspection;
use App\Models\InspectionSchedule;
use App\Models\RepairApproval;
use App\Models\RepairReport;
use App\Models\Setting;
use App\Models\User;
use App\Mail\CriticalDamageAlertMail;
use App\Mail\RepairAssignmentMail;
use App\Mail\RepairCompletedReviewMail;
use App\Mail\DailyShiftReminderMail;
use App\Mail\AparExpiryAlertMail;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class NotificationMailTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $supervisor;
    protected User $supervisor2;
    protected User $teknisi;
    protected string $adminToken;
    protected string $supervisorToken;
    protected string $teknisiToken;
    protected Apar $apar;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin.hsse@pertamina.com',
        ]);
        $this->supervisor = User::factory()->create([
            'role' => 'supervisor',
            'email' => 'spv1.hsse@pertamina.com',
        ]);
        $this->supervisor2 = User::factory()->create([
            'role' => 'supervisor',
            'email' => 'spv2.hsse@pertamina.com',
        ]);
        $this->teknisi = User::factory()->create([
            'role' => 'teknisi',
            'email' => 'teknisi.lapangan@pertamina.com',
        ]);

        $this->adminToken = JWTAuth::fromUser($this->admin);
        $this->supervisorToken = JWTAuth::fromUser($this->supervisor);
        $this->teknisiToken = JWTAuth::fromUser($this->teknisi);

        $this->apar = Apar::create([
            'serial_number' => 'SN-APAR-TEST-001',
            'qr_code' => 'QR-APAR-TEST-001',
            'location_type' => 'statis',
            'location_name' => 'Tangki Timbun 01 FT Maos',
            'status' => 'active',
            'capacity' => 9,
            'manufactured_date' => now()->subYear(),
            'expired_at' => now()->addMonths(6),
        ]);
    }

    /**
     * Test: Damaged APAR triggers critical damage email ONLY to supervisors.
     * (Pertamina directive: "kirimkan langsung ke email seluruh user ber-role supervisor saja")
     */
    public function test_critical_damage_notification_sent_to_all_supervisors_only()
    {
        Mail::fake();

        $inspection = Inspection::create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->teknisi->id,
            'inspection_date' => now(),
            'condition' => 'damaged',
            'photo_url' => 'https://pertamina.test/storage/inspections/test.jpg',
            'is_valid_location' => true,
            'inspection_status' => 'pending_review',
            'notes' => 'Pin segel hilang dan selang retak berat',
        ]);

        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->notifyCriticalDamage($inspection);

        $this->assertEquals(2, $sentCount);

        // Queued to supervisor 1 & supervisor 2
        Mail::assertQueued(CriticalDamageAlertMail::class, function ($mail) {
            return $mail->hasTo('spv1.hsse@pertamina.com');
        });
        Mail::assertQueued(CriticalDamageAlertMail::class, function ($mail) {
            return $mail->hasTo('spv2.hsse@pertamina.com');
        });

        // NOT queued to admin
        Mail::assertNotQueued(CriticalDamageAlertMail::class, function ($mail) {
            return $mail->hasTo('admin.hsse@pertamina.com');
        });
    }

    /**
     * Test: Toggle in settings disables critical damage email dispatch.
     */
    public function test_setting_toggle_disables_critical_damage_notification()
    {
        Mail::fake();
        Setting::setValue('notify_on_damaged_apar', false, 'boolean', 'notification');

        $inspection = Inspection::create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->teknisi->id,
            'inspection_date' => now(),
            'condition' => 'damaged',
            'photo_url' => 'https://pertamina.test/storage/inspections/test.jpg',
            'is_valid_location' => true,
            'inspection_status' => 'pending_review',
        ]);

        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->notifyCriticalDamage($inspection);

        $this->assertEquals(0, $sentCount);
        Mail::assertNothingQueued();
    }

    /**
     * Test: Approving repair sends assignment email to the assigned technician.
     */
    public function test_repair_approval_queues_assignment_email_to_technician()
    {
        Mail::fake();

        $inspection = Inspection::create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->teknisi->id,
            'inspection_date' => now(),
            'condition' => 'damaged',
            'photo_url' => 'https://pertamina.test/storage/inspections/test.jpg',
            'is_valid_location' => true,
            'inspection_status' => 'pending_review',
        ]);

        $repairApproval = RepairApproval::create([
            'inspection_id' => $inspection->id,
            'status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
            ->postJson("/api/repair-approvals/{$repairApproval->id}/approve", [
                'supervisor_notes' => 'Ganti selang dan pasang pin segel standar baru hari ini.',
                'assigned_teknisi_id' => $this->teknisi->id,
                'schedule_date' => now()->toDateString(),
                'schedule_time' => '10:00',
            ]);

        $response->assertStatus(200);

        Mail::assertQueued(RepairAssignmentMail::class, function ($mail) {
            return $mail->hasTo('teknisi.lapangan@pertamina.com');
        });
    }

    /**
     * Test: Submitting a repair report sends review email to supervisors.
     */
    public function test_repair_report_submission_queues_review_email_to_supervisors()
    {
        Mail::fake();

        $inspection = Inspection::create([
            'apar_id' => $this->apar->id,
            'user_id' => $this->teknisi->id,
            'inspection_date' => now(),
            'condition' => 'damaged',
            'photo_url' => 'https://pertamina.test/storage/inspections/test.jpg',
            'is_valid_location' => true,
            'inspection_status' => 'approved',
        ]);

        $repairApproval = RepairApproval::create([
            'inspection_id' => $inspection->id,
            'status' => 'approved',
            'assigned_user_id' => $this->teknisi->id,
            'approved_by' => $this->supervisor->id,
        ]);

        $repairReport = RepairReport::create([
            'repair_approval_id' => $repairApproval->id,
            'reported_by' => $this->teknisi->id,
            'repair_description' => 'Selang telah diganti dengan part ori dan segel telah dikencangkan.',
            'before_photo_url' => 'https://pertamina.test/storage/repairs/before.jpg',
            'after_photo_url' => 'https://pertamina.test/storage/repairs/after.jpg',
            'repair_lat' => -7.6033,
            'repair_lng' => 109.1394,
            'repair_completed_at' => now(),
            'status' => 'pending_review',
        ]);

        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->notifyRepairCompleted($repairReport);

        $this->assertEquals(2, $sentCount);

        Mail::assertQueued(RepairCompletedReviewMail::class, function ($mail) {
            return $mail->hasTo('spv1.hsse@pertamina.com');
        });
        Mail::assertQueued(RepairCompletedReviewMail::class, function ($mail) {
            return $mail->hasTo('spv2.hsse@pertamina.com');
        });
    }

    /**
     * Test: Daily shift reminder queues digest to technicians with schedules today (07:00 WIB).
     */
    public function test_daily_shift_reminder_queues_digest_for_today_schedules()
    {
        Mail::fake();

        $appTimezone = config('app.timezone', 'Asia/Jakarta');
        $nowLocal = Carbon::now($appTimezone);

        // Schedule for today
        InspectionSchedule::create([
            'apar_id' => $this->apar->id,
            'assigned_user_id' => $this->teknisi->id,
            'start_at' => $nowLocal->copy()->setTime(8, 0),
            'end_at' => $nowLocal->copy()->setTime(16, 0),
            'frequency' => 'monthly',
            'is_active' => true,
            'is_completed' => false,
        ]);

        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->sendDailyShiftReminders();

        $this->assertEquals(1, $sentCount);

        Mail::assertQueued(DailyShiftReminderMail::class, function ($mail) {
            return $mail->hasTo('teknisi.lapangan@pertamina.com')
                && $mail->schedules->count() === 1;
        });
    }

    /**
     * Test: APAR expiry alerts command queues digest for near-expired units.
     */
    public function test_apar_expiry_alert_command_queues_digest()
    {
        Mail::fake();

        // Unit near expiry (15 days remaining)
        $expiringApar = Apar::create([
            'serial_number' => 'SN-APAR-EXPIRING',
            'qr_code' => 'QR-APAR-EXPIRING',
            'location_type' => 'statis',
            'location_name' => 'Pos Satpam Barat',
            'status' => 'active',
            'capacity' => 6,
            'manufactured_date' => now()->subYears(5),
            'expired_at' => now()->addDays(15),
        ]);

        $this->artisan('apar:send-expiry-alerts --days=30')
            ->assertSuccessful();

        Mail::assertQueued(AparExpiryAlertMail::class, function ($mail) {
            return $mail->hasTo('spv1.hsse@pertamina.com')
                || $mail->hasTo('admin.hsse@pertamina.com');
        });
    }

    /**
     * Test: Admin can send SMTP test email.
     */
    public function test_admin_can_send_smtp_test_email()
    {
        Mail::fake();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/settings/test-email', [
                'email' => 'test.target@pertamina.com',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * Test: Technician cannot access admin-only SMTP test email endpoint.
     */
    public function test_technician_cannot_send_smtp_test_email()
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->teknisiToken)
            ->postJson('/api/settings/test-email', [
                'email' => 'test.target@pertamina.com',
            ]);

        $response->assertStatus(403);
    }
}
