<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\InspectionLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $supervisor;
    protected User $teknisi;
    protected Apar $apar1;
    protected Apar $apar2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Budi Administrator',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->supervisor = User::factory()->create([
            'name' => 'Doni Supervisor',
            'role' => 'supervisor',
            'is_active' => true,
        ]);

        $this->teknisi = User::factory()->create([
            'name' => 'Ahmad Teknisi',
            'role' => 'teknisi',
            'is_active' => true,
        ]);

        $type = AparType::create([
            'name' => 'Dry Chemical Powder',
            'description' => 'DCP 6kg',
        ]);

        $this->apar1 = Apar::create([
            'serial_number' => 'APAR-MAOS-001',
            'apar_type_id' => $type->id,
            'location_name' => 'Tangki T-01',
            'location_type' => 'statis',
            'status' => 'active',
            'capacity' => 6,
            'pressure' => 15,
            'qr_code' => 'QR-APAR-001',
        ]);

        $this->apar2 = Apar::create([
            'serial_number' => 'APAR-MAOS-002',
            'apar_type_id' => $type->id,
            'location_name' => 'Filling Shed',
            'location_type' => 'statis',
            'status' => 'active',
            'capacity' => 6,
            'pressure' => 15,
            'qr_code' => 'QR-APAR-002',
        ]);

        // Seed some sample inspection logs
        InspectionLog::create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar1->id,
            'action' => 'scan_qr',
            'ip_address' => '10.0.0.15',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'is_successful' => true,
            'details' => 'Scan QR tabung berhasil',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        InspectionLog::create([
            'user_id' => $this->teknisi->id,
            'apar_id' => $this->apar1->id,
            'action' => 'submit_inspection',
            'ip_address' => '10.0.0.15',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'is_successful' => true,
            'details' => 'Inspeksi berhasil disubmit',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        $oldLog = InspectionLog::create([
            'user_id' => $this->supervisor->id,
            'apar_id' => $this->apar2->id,
            'action' => 'validation_failed',
            'ip_address' => '192.168.1.50',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'is_successful' => false,
            'details' => 'Radius GPS di luar jangkauan',
        ]);
        \Illuminate\Support\Facades\DB::table('inspection_logs')
            ->where('id', $oldLog->id)
            ->update(['created_at' => Carbon::now()->subDays(100)]);
    }

    public function test_admin_and_supervisor_can_list_audit_logs(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'total',
            ])
            ->assertJsonCount(3, 'data');

        $supResponse = $this->actingAs($this->supervisor, 'api')
            ->getJson('/api/audit-logs');

        $supResponse->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_audit_logs_can_be_filtered_by_user_name(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs?user_name=Ahmad');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_audit_logs_can_be_filtered_by_apar_serial(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs?apar_serial=MAOS-002');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.apar.serial_number', 'APAR-MAOS-002');
    }

    public function test_audit_logs_can_be_filtered_by_ip_address_and_action(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs?ip_address=192.168.1.50&action=validation_failed');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_successful', false);
    }

    public function test_audit_logs_can_be_filtered_by_is_successful(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs?is_successful=1');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $failedResponse = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs?is_successful=0');

        $failedResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_audit_log_stats_returns_expected_keys(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs/stats');

        $response->assertStatus(200)
            ->assertJson([
                'total_logs' => 3,
                'successful_logs' => 2,
                'failed_logs' => 1,
                'unique_users' => 2,
            ]);
    }

    public function test_cleanup_stats_returns_expected_keys(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs/cleanup-stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_logs',
                'logs_older_than_30_days',
                'logs_older_than_90_days',
                'logs_older_than_180_days',
                'logs_older_than_365_days',
            ])
            ->assertJson([
                'total_logs' => 3,
                'logs_older_than_90_days' => 1,
                'logs_older_than_180_days' => 0,
            ]);
    }

    public function test_admin_can_cleanup_old_logs_with_days_to_keep_or_days(): void
    {
        // Cleanup logs older than 90 days
        $response = $this->actingAs($this->admin, 'api')
            ->postJson('/api/audit-logs/cleanup', [
                'days' => 90,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'deleted_count' => 1,
            ]);

        $this->assertDatabaseCount('inspection_logs', 2);
    }

    public function test_supervisor_cannot_cleanup_audit_logs(): void
    {
        $response = $this->actingAs($this->supervisor, 'api')
            ->postJson('/api/audit-logs/cleanup', [
                'days_to_keep' => 90,
            ]);

        $response->assertStatus(403);
    }

    public function test_teknisi_cannot_access_audit_logs(): void
    {
        $response = $this->actingAs($this->teknisi, 'api')
            ->getJson('/api/audit-logs');

        $response->assertStatus(403);
    }

    public function test_audit_logs_export_json_endpoint(): void
    {
        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/audit-logs/export?user_name=Ahmad');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'total',
            ])
            ->assertJsonPath('total', 2);
    }
}
