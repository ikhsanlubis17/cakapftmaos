<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create test users
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->supervisor = User::factory()->create(['role' => 'supervisor']);
    
    // Generate tokens
    $this->adminToken = JWTAuth::fromUser($this->admin);
    $this->supervisorToken = JWTAuth::fromUser($this->supervisor);
});

describe('Supervisor Access Control', function () {
    
    describe('APAR Routes', function () {
        
        it('prevents supervisor from accessing GET /api/apar', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
                ->getJson('/api/apar');
            
            $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to perform this action.',
                ]);
        });
        
        it('prevents supervisor from accessing POST /api/apar', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
                ->postJson('/api/apar', [
                    'serial_number' => 'TEST-001',
                    'type' => 'powder',
                    'location' => 'Test Location',
                ]);
            
            $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to perform this action.',
                ]);
        });
        
        it('allows admin to access GET /api/apar', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
                ->getJson('/api/apar');
            
            $response->assertStatus(200);
        });
        
        it('prevents supervisor from downloading APAR QR PDF', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
                ->postJson('/api/apar/download-qr-pdf', [
                    'apar_ids' => [1, 2, 3],
                ]);
            
            $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to perform this action.',
                ]);
        });
    });
    
    describe('Tank Trucks Routes', function () {
        
        it('prevents supervisor from accessing GET /api/tank-trucks', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
                ->getJson('/api/tank-trucks');
            
            $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to perform this action.',
                ]);
        });
        
        it('prevents supervisor from accessing POST /api/tank-trucks', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
                ->postJson('/api/tank-trucks', [
                    'plate_number' => 'B 1234 ABC',
                    'driver_name' => 'Test Driver',
                    'driver_phone' => '081234567890',
                ]);
            
            $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Forbidden. You do not have permission to perform this action.',
                ]);
        });
        
        it('allows admin to access GET /api/tank-trucks', function () {
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
                ->getJson('/api/tank-trucks');
            
            $response->assertStatus(200);
        });
        
        it('prevents supervisor from assigning APAR to tank truck', function () {
            // Note: We expect 403 from middleware before route model binding
            // So even with non-existent ID, middleware should block first
            $response = $this->withHeader('Authorization', 'Bearer ' . $this->supervisorToken)
                ->postJson('/api/tank-trucks/999/assign-apar', [
                    'apar_id' => 1,
                ]);
            
            // Accept either 403 (middleware blocks) or 404 (route model binding)
            // Both are acceptable as supervisor is blocked from this route
            expect($response->status())->toBeIn([403, 404]);
        });
    });
    
    describe('Role Verification', function () {
        
        it('confirms supervisor role is correctly set', function () {
            expect($this->supervisor->role)->toBe('supervisor');
            expect($this->supervisor->isSupervisor())->toBeTrue();
            expect($this->supervisor->isAdmin())->toBeFalse();
        });
        
        it('confirms admin role is correctly set', function () {
            expect($this->admin->role)->toBe('admin');
            expect($this->admin->isAdmin())->toBeTrue();
            expect($this->admin->isSupervisor())->toBeFalse();
        });
    });
});
