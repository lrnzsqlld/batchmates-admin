<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    /** @test */
    public function authenticated_user_can_make_donation()
    {
        $institution = Institution::factory()->create();
        $campaign = Campaign::factory()->create([
            'institution_id' => $institution->id,
            'status' => 'active',
        ]);
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('donor');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/mobile/donations', [
                'campaign_id' => $campaign->id,
                'donor_name' => $user->name,
                'donor_email' => $user->email,
                'amount' => 5000,
                'payment_method' => 'gcash',
                'is_anonymous' => false,
                'message' => 'Happy to help!',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'amount', 'status'],
                'message'
            ]);

        $this->assertDatabaseHas('donations', [
            'campaign_id' => $campaign->id,
            'user_id' => $user->id,
            'amount' => 5000,
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function donation_requires_valid_amount()
    {
        $institution = Institution::factory()->create();
        $campaign = Campaign::factory()->create(['institution_id' => $institution->id]);
        $user = User::factory()->create();
        $user->assignRole('donor');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/mobile/donations', [
                'campaign_id' => $campaign->id,
                'amount' => -100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    /** @test */
    public function donation_can_be_anonymous()
    {
        $institution = Institution::factory()->create();
        $campaign = Campaign::factory()->create(['institution_id' => $institution->id]);
        $user = User::factory()->create();
        $user->assignRole('donor');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/mobile/donations', [
                'campaign_id' => $campaign->id,
                'amount' => 1000,
                'is_anonymous' => true,
                'payment_method' => 'credit_card',
            ]);

        $response->assertStatus(201);

        $donation = Donation::latest()->first();
        $this->assertTrue($donation->is_anonymous);
        $this->assertEquals('Anonymous Donor', $donation->donor_display_name);
    }

    /** @test */
    public function can_get_donation_statistics()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        Donation::factory()->count(5)->create([
            'institution_id' => $institution->id,
            'amount' => 1000,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/web/donations/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_donations',
                    'total_count',
                    'pending_count',
                ]
            ]);
    }

    /** @test */
    public function admin_can_view_all_donations()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        Donation::factory()->count(3)->create([
            'institution_id' => $institution->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/web/donations');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data.data');
    }

    /** @test */
    public function can_search_donations_by_donor()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        Donation::factory()->create([
            'institution_id' => $institution->id,
            'donor_name' => 'Juan Dela Cruz',
        ]);
        Donation::factory()->create([
            'institution_id' => $institution->id,
            'donor_name' => 'Maria Santos',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/web/donations?search=juan');

        $response->assertStatus(200);
        $this->assertStringContainsString('Juan Dela Cruz', $response->content());
        $this->assertStringNotContainsString('Maria Santos', $response->content());
    }

    /** @test */
    public function can_filter_donations_by_status()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        Donation::factory()->create([
            'institution_id' => $institution->id,
            'status' => 'completed',
        ]);
        Donation::factory()->create([
            'institution_id' => $institution->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/web/donations?status=pending');

        $response->assertStatus(200);

        $donations = $response->json('data.data');
        foreach ($donations as $donation) {
            $this->assertEquals('pending', $donation['status']);
        }
    }
}
