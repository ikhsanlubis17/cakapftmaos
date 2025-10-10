<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;


pest()->use(RefreshDatabase::class);

beforeEach(function () {
    $this->user = \App\Models\User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password123'),
        'is_active' => true,
    ]);
});

it('can refresh a valid token', function () {
    $token = JWTAuth::fromUser($this->user);

    $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
        ->postJson('/api/refresh');

    $response->assertStatus(200)
        ->assertJsonStructure(['token', 'message'])
        ->assertJson(['message' => 'Token refreshed']);

    expect($response->json('token'))
        ->not->toBe($token)
        ->not->toBeEmpty();
});


it('fails to refresh without token', function () {
    $this->postJson('/api/refresh')
        ->assertStatus(401);
});

it('fails to refresh with invalid token', function () {
    $this->withHeader('Authorization', 'Bearer invalid_token_here')
        ->postJson('/api/refresh')
        ->assertStatus(401)
        ->assertJson(['message' => 'Unauthenticated.']);
});

it('fails to refresh with expired token', function () {
    $token = JWTAuth::fromUser($this->user);
    JWTAuth::setToken($token)->invalidate();

    $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/refresh')
        ->assertStatus(401)
        ->assertJson(['message' => 'Unauthenticated.']);
});

it('fails to refresh with malformed token', function () {
    $this->withHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
        ->postJson('/api/refresh')
        ->assertStatus(401)
        ->assertJson(['message' => 'Unauthenticated.']);
});

it('can use refreshed token for authentication', function () {
    $token = JWTAuth::fromUser($this->user);

    $newToken = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/refresh')
        ->json('token');

    $response = $this->withHeader('Authorization', 'Bearer ' . $newToken)
        ->getJson('/api/user');

    $response->assertStatus(200)
        ->assertJson([
            'id' => $this->user->id,
            'email' => $this->user->email,
        ]);
});

