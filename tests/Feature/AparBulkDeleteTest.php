<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AparBulkDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_bulk_delete_apars(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'Powder', 'is_active' => true]);

        $apar1 = Apar::factory()->create([
            'apar_type_id' => $aparType->id,
            'serial_number' => 'APAR-BULK-001',
        ]);
        $apar2 = Apar::factory()->create([
            'apar_type_id' => $aparType->id,
            'serial_number' => 'APAR-BULK-002',
        ]);
        $apar3 = Apar::factory()->create([
            'apar_type_id' => $aparType->id,
            'serial_number' => 'APAR-BULK-003',
        ]);

        $this->actingAs($admin, 'api');

        $response = $this->postJson('/api/apar/bulk-delete', [
            'ids' => [$apar1->id, $apar2->id],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'deleted_count' => 2,
            ]);

        // Verifikasi soft delete
        $this->assertSoftDeleted('apars', ['id' => $apar1->id]);
        $this->assertSoftDeleted('apars', ['id' => $apar2->id]);
        $this->assertDatabaseHas('apars', ['id' => $apar3->id, 'deleted_at' => null]);
    }

    public function test_non_admin_cannot_bulk_delete_apars(): void
    {
        $technician = User::factory()->create(['role' => 'teknisi']);
        $aparType = AparType::create(['name' => 'Powder', 'is_active' => true]);
        $apar = Apar::factory()->create(['apar_type_id' => $aparType->id]);

        $this->actingAs($technician, 'api');

        $response = $this->postJson('/api/apar/bulk-delete', [
            'ids' => [$apar->id],
        ]);

        $response->assertStatus(403);
    }

    public function test_bulk_delete_validates_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'api');

        // Empty array
        $response = $this->postJson('/api/apar/bulk-delete', [
            'ids' => [],
        ]);
        $response->assertStatus(422);

        // Non-existent ID
        $response = $this->postJson('/api/apar/bulk-delete', [
            'ids' => [999999],
        ]);
        $response->assertStatus(422);
    }
}
