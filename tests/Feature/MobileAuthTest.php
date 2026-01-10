<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_mobile_user_can_register_with_token(): void
    {
        $response = $this->postJson('/api/v1/mobile/auth/register', [
            'name' => 'Mobile User',
            'email' => 'mobile@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'donor',
            'device_name' => 'iPhone 15 Pro',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email', 'roles'],
                    'token'
                ],
                'message'
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'mobile@example.com',
        ]);

        $this->assertNotNull($response->json('data.token'));
    }

    public function test_mobile_registration_requires_device_name(): void
    {
        $response = $this->postJson('/api/v1/mobile/auth/register', [
            'name' => 'Mobile User',
            'email' => 'mobile@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['device_name']);
    }

    public function test_mobile_user_can_login_with_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'mobile@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('donor');

        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => 'mobile@example.com',
            'password' => 'password123',
            'device_name' => 'iPhone 15 Pro',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user',
                    'token'
                ],
                'message'
            ]);

        $this->assertNotNull($response->json('data.token'));
    }

    public function test_mobile_login_requires_device_name(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'mobile@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('donor');

        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => 'mobile@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['device_name']);
    }

    public function test_mobile_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => 'wrong@example.com',
            'password' => 'wrongpassword',
            'device_name' => 'iPhone',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_suspended_mobile_user_cannot_login(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => bcrypt('password123'),
            'status' => 'suspended',
        ]);
        $user->assignRole('donor');

        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => 'suspended@example.com',
            'password' => 'password123',
            'device_name' => 'iPhone',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Your account is suspended or pending approval'
            ]);
    }

    public function test_authenticated_mobile_user_can_get_profile(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('donor');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/mobile/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'permissions'
                ]
            ]);
    }

    public function test_mobile_user_can_logout(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('donor');
        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/mobile/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_mobile_user_can_logout_all_devices(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('donor');

        $user->createToken('device-1')->plainTextToken;
        $token2 = $user->createToken('device-2')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->postJson('/api/v1/mobile/auth/logout-all');

        $response->assertStatus(200);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_mobile_user_can_view_all_devices(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('donor');

        $user->createToken('iPhone 15')->plainTextToken;
        $user->createToken('Android Tablet')->plainTextToken;
        $token = $user->createToken('MacBook Pro')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/mobile/auth/devices');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'last_used_at', 'created_at']
                ]
            ]);
    }

    public function test_mobile_user_can_revoke_specific_device(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('donor');

        $device1 = $user->createToken('device-1');
        $device2Token = $user->createToken('device-2')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $device2Token)
            ->deleteJson('/api/v1/mobile/auth/devices/' . $device1->accessToken->id);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $device1->accessToken->id,
        ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'device-2',
        ]);
    }

    public function test_mobile_user_can_save_device_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'mobile@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('donor');

        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => 'mobile@example.com',
            'password' => 'password123',
            'device_name' => 'iPhone',
            'device_token' => 'firebase_token_abc123',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'device_token' => 'firebase_token_abc123',
        ]);
    }
}
