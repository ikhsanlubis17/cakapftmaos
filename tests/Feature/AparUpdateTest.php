<?php

namespace Tests\Feature;

use App\Models\Apar;
use App\Models\AparType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AparUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_update_apar_status_to_active()
    {
        $this->withoutExceptionHandling();
        $user = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'Foam', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'capacity' => 6,
        ]);
        
        $this->actingAs($user, 'api');

        $response = $this->putJson("/api/apar/{$apar->id}", [
            'serial_number' => $apar->serial_number,
            'location_type' => $apar->location_type,
            'location_name' => $apar->location_name,
            'apar_type_id' => $apar->apar_type_id,
            'capacity' => $apar->capacity,
            'status' => 'active',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('apars', [
            'id' => $apar->id,
            'status' => 'active',
        ]);
    }

    public function test_can_update_apar_status_to_damaged()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'Powder', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'capacity' => 6,
        ]);
        
        $this->actingAs($user, 'api');

        $response = $this->putJson("/api/apar/{$apar->id}", [
            'serial_number' => $apar->serial_number,
            'location_type' => $apar->location_type,
            'location_name' => $apar->location_name,
            'apar_type_id' => $apar->apar_type_id,
            'capacity' => $apar->capacity,
            'status' => 'needs_repair', // Was damaged, now needs_repair
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('apars', [
            'id' => $apar->id,
            'status' => 'needs_repair',
        ]);
    }

    public function test_cannot_update_apar_with_invalid_status()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'CO2', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'capacity' => 6,
        ]);
        
        $this->actingAs($user, 'api');

        $response = $this->putJson("/api/apar/{$apar->id}", [
            'serial_number' => $apar->serial_number,
            'location_type' => $apar->location_type,
            'location_name' => $apar->location_name,
            'apar_type_id' => $apar->apar_type_id,
            'capacity' => $apar->capacity,
            'status' => 'invalid_status',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_cannot_update_apar_with_old_frontend_value()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $aparType = AparType::create(['name' => 'Water', 'is_active' => true]);
        $apar = Apar::factory()->create([
            'status' => 'active',
            'apar_type_id' => $aparType->id,
            'capacity' => 6,
        ]);
        
        $this->actingAs($user, 'api');

        // 'damaged' is now OLD/INVALID value, needs_repair is the new one
        $response = $this->putJson("/api/apar/{$apar->id}", [
            'serial_number' => $apar->serial_number,
            'location_type' => $apar->location_type,
            'location_name' => $apar->location_name,
            'apar_type_id' => $apar->apar_type_id,
            'capacity' => $apar->capacity,
            'status' => 'damaged', 
        ]);

        $response->assertStatus(422); 
        $response->assertJsonValidationErrors(['status']);
    }
}
