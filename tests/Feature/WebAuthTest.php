<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_web_user_can_register_with_session(): void
    {
        $response = $this->postJson('/api/v1/web/auth/register', [
            'name' => 'Web User',
            'email' => 'web@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user' => ['id', 'name', 'email', 'roles']
                ],
                'message'
            ])
            ->assertJsonMissing(['token']);

        $this->assertDatabaseHas('users', [
            'email' => 'web@example.com',
        ]);
    }

    public function test_web_registration_does_not_return_token(): void
    {
        $response = $this->postJson('/api/v1/web/auth/register', [
            'name' => 'Web User',
            'email' => 'web@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonMissing(['token']);
    }

    public function test_web_user_can_login_with_session(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'web@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('admin');

        $response = $this->postJson('/api/v1/web/auth/login', [
            'email' => 'web@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'user'
                ],
                'message'
            ])
            ->assertJsonMissing(['token']);
    }

    public function test_web_login_does_not_require_device_name(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'web@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('admin');

        $response = $this->postJson('/api/v1/web/auth/login', [
            'email' => 'web@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
    }

    public function test_web_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/web/auth/login', [
            'email' => 'wrong@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_suspended_web_user_cannot_login(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => bcrypt('password123'),
            'status' => 'suspended',
        ]);
        $user->assignRole('admin');

        $response = $this->postJson('/api/v1/web/auth/login', [
            'email' => 'suspended@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Your account is suspended or pending approval'
            ]);
    }

    public function test_authenticated_web_user_can_get_profile(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/web/auth/me');

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

    public function test_web_user_can_logout(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('admin');

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/web/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
    }

    public function test_web_does_not_save_device_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'web@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->assignRole('admin');

        $response = $this->postJson('/api/v1/web/auth/login', [
            'email' => 'web@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'device_token' => null,
        ]);
    }

    public function test_web_registration_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/web/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_web_registration_validates_unique_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/v1/web/auth/register', [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_web_registration_validates_password_confirmation(): void
    {
        $response = $this->postJson('/api/v1/web/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
