<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InstitutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        Storage::fake('public');
    }

    /** @test */
    public function guest_can_view_active_institutions_on_mobile()
    {
        Institution::factory()->create(['name' => 'Active University', 'status' => 'active']);
        Institution::factory()->create(['name' => 'Suspended University', 'status' => 'suspended']);

        $response = $this->getJson('/api/v1/mobile/institutions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'name', 'email', 'status']
                    ]
                ]
            ]);

        $this->assertStringContainsString('Active University', $response->content());
        $this->assertStringNotContainsString('Suspended University', $response->content());
    }

    /** @test */
    public function system_admin_can_create_institution()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        $logo = UploadedFile::fake()->image('logo.png');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/web/institutions', [
                'name' => 'Test University',
                'email' => 'info@test.edu',
                'phone' => '+63 912 345 6789',
                'address' => '123 Test St',
                'city' => 'Test City',
                'country' => 'Philippines',
                'status' => 'active',
                'logo' => $logo,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'name', 'slug', 'email'],
                'message'
            ]);

        $this->assertDatabaseHas('institutions', [
            'name' => 'Test University',
            'slug' => 'test-university',
            'email' => 'info@test.edu',
        ]);

        Storage::disk('public')->assertExists('institutions/' . $logo->hashName());
    }

    /** @test */
    public function institution_creation_requires_valid_data()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/web/institutions', [
                'name' => '',
                'email' => 'invalid-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    /** @test */
    public function institution_email_must_be_unique()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        Institution::factory()->create(['email' => 'existing@test.edu']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/web/institutions', [
                'name' => 'New University',
                'email' => 'existing@test.edu',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function system_admin_can_update_institution()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        $institution = Institution::factory()->create(['name' => 'Original Name']);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/web/institutions/{$institution->id}", [
                'name' => 'Updated Name',
                'email' => 'updated@test.edu',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('institutions', [
            'id' => $institution->id,
            'name' => 'Updated Name',
            'email' => 'updated@test.edu',
        ]);
    }

    /** @test */
    public function system_admin_can_delete_institution()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        $institution = Institution::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/web/institutions/{$institution->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('institutions', [
            'id' => $institution->id,
        ]);
    }

    /** @test */
    public function can_search_institutions()
    {
        Institution::factory()->create(['name' => 'Ateneo University', 'status' => 'active']);
        Institution::factory()->create(['name' => 'La Salle University', 'status' => 'active']);

        $response = $this->getJson('/api/v1/mobile/institutions?search=ateneo');

        $response->assertStatus(200);
        $this->assertStringContainsString('Ateneo University', $response->content());
        $this->assertStringNotContainsString('La Salle University', $response->content());
    }

    /** @test */
    public function institution_slug_is_auto_generated()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/web/institutions', [
                'name' => 'Test University of Manila',
                'email' => 'info@tum.edu',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('institutions', [
            'name' => 'Test University of Manila',
            'slug' => 'test-university-of-manila',
        ]);
    }

    /** @test */
    public function institution_slug_handles_duplicates()
    {
        $user = User::factory()->create();
        $user->assignRole('system_admin');

        Institution::factory()->create(['name' => 'Test University', 'slug' => 'test-university']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/web/institutions', [
                'name' => 'Test University',
                'email' => 'info2@test.edu',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('institutions', [
            'name' => 'Test University',
            'slug' => 'test-university-1',
        ]);
    }
}
