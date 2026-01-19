<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    /** @test */
    public function admin_can_view_all_users()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        User::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'first_name', 'last_name', 'email', 'roles']
                    ]
                ]
            ]);
    }

    /** @test */
    public function can_search_users_by_name_or_email()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        User::factory()->create(['first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
        User::factory()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/users?search=juan');

        $response->assertStatus(200);
        $this->assertStringContainsString('Juan', $response->content());
        $this->assertStringNotContainsString('Maria', $response->content());
    }

    /** @test */
    public function can_filter_users_by_role()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        $donor = User::factory()->create();
        $donor->assignRole('donor');

        $institutionAdmin = User::factory()->create();
        $institutionAdmin->assignRole('institution_admin');

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/users?role=donor');

        $response->assertStatus(200);

        $users = $response->json('data.data');
        foreach ($users as $user) {
            if (!empty($user['roles'])) {
                $this->assertEquals('donor', $user['roles'][0]['name']);
            }
        }
    }

    /** @test */
    public function admin_can_update_user()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        $user = User::factory()->create(['first_name' => 'Old Name']);

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$user->id}", [
                'first_name' => 'New Name',
                'last_name' => 'Updated',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'New Name',
        ]);
    }

    /** @test */
    public function admin_can_change_user_role()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        $user = User::factory()->create();
        $user->assignRole('donor');

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$user->id}", [
                'role' => 'committee_member',
            ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue($user->hasRole('committee_member'));
        $this->assertFalse($user->hasRole('donor'));
    }

    /** @test */
    public function admin_can_delete_user()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        $user = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/users/{$user->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('users', [
            'id' => $user->id,
        ]);
    }

    /** @test */
    public function can_get_available_roles()
    {
        $admin = User::factory()->create();
        $admin->assignRole('system_admin');

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name']
                ]
            ]);
    }
}
