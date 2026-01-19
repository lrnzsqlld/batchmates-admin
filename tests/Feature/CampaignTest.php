<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Institution;
use App\Models\User;
use App\Models\CampaignApproval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CampaignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        Storage::fake('public');
    }

    /** @test */
    public function guest_can_view_active_campaigns()
    {
        $institution = Institution::factory()->create();
        Campaign::factory()->active()->create([
            'institution_id' => $institution->id,
            'title' => 'Active Campaign'
        ]);
        Campaign::factory()->pendingReview()->create([
            'institution_id' => $institution->id,
            'title' => 'Pending Campaign'
        ]);

        $response = $this->getJson('/api/v1/campaigns');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'title', 'description', 'status']
                    ]
                ]
            ]);
    }

    /** @test */
    public function authenticated_user_can_create_campaign()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        $image = UploadedFile::fake()->image('campaign.jpg');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/campaigns', [
                'title' => 'Test Campaign',
                'description' => 'This is a test campaign',
                'goal_amount' => 100000,
                'campaign_type' => 'general',
                'institution_id' => $institution->id,
                'priority' => 'normal',
                'end_date' => now()->addMonth()->format('Y-m-d'),
                'image' => $image,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'title', 'description'],
                'message'
            ]);

        $this->assertDatabaseHas('campaigns', [
            'title' => 'Test Campaign',
            'goal_amount' => 100000,
            'status' => 'pending_review',
        ]);



        Storage::disk('public')->assertExists('campaigns/' . $image->hashName());
    }

    /** @test */
    public function campaign_creation_requires_valid_data()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/campaigns', [
                'title' => '',
                'description' => '',
                'goal_amount' => -100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'description', 'goal_amount', 'campaign_type', 'institution_id']);
    }

    /** @test */
    public function user_can_update_pending_campaign()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        $campaign = Campaign::factory()->pendingReview()->create([
            'institution_id' => $institution->id,
            'created_by' => $user->id,
            'title' => 'Original Title'
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/campaigns/{$campaign->id}", [
                'title' => 'Updated Title',
                'description' => 'Updated description',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'title' => 'Updated Title',
        ]);
    }

    /** @test */
    public function user_can_delete_pending_campaign()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('institution_admin');

        $campaign = Campaign::factory()->pendingReview()->create([
            'institution_id' => $institution->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/campaigns/{$campaign->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('campaigns', [
            'id' => $campaign->id,
        ]);
    }

    /** @test */
    public function can_search_campaigns()
    {
        $institution = Institution::factory()->create();
        Campaign::factory()->active()->create([
            'institution_id' => $institution->id,
            'title' => 'Scholarship Fund',
        ]);
        Campaign::factory()->active()->create([
            'institution_id' => $institution->id,
            'title' => 'Library Construction',
        ]);

        $response = $this->getJson('/api/v1/campaigns?search=scholarship');

        $response->assertStatus(200);
        $this->assertStringContainsString('Scholarship Fund', $response->content());
        $this->assertStringNotContainsString('Library Construction', $response->content());
    }

    /** @test */
    public function can_filter_campaigns_by_status()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('system_admin');

        Campaign::factory()->active()->create([
            'institution_id' => $institution->id,
        ]);
        Campaign::factory()->pendingReview()->create([
            'institution_id' => $institution->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/campaigns?status=pending_review');

        $response->assertStatus(200);

        $campaigns = $response->json('data.data');
        foreach ($campaigns as $campaign) {
            $this->assertEquals('pending_review', $campaign['status']);
        }
    }

    /** @test */
    public function can_get_campaign_statistics()
    {
        $institution = Institution::factory()->create();
        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('system_admin');

        Campaign::factory()->count(3)->active()->create([
            'institution_id' => $institution->id,
            'goal_amount' => 100000,
            'raised_amount' => 50000,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/campaignStats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_campaigns',
                    'pending_review',
                    'active_campaigns',
                    'completed_campaigns',
                    'total_raised',
                    'total_goal',
                ]
            ]);
    }

    /** @test */
    public function campaign_shows_correct_progress_percentage()
    {
        $institution = Institution::factory()->create();
        $campaign = Campaign::factory()->create([
            'institution_id' => $institution->id,
            'goal_amount' => 100000,
            'raised_amount' => 25000,
        ]);

        $this->assertEquals(25, $campaign->progress_percentage);
    }

    /** @test */
    public function campaign_shows_days_left()
    {
        $institution = Institution::factory()->create();
        $campaign = Campaign::factory()->create([
            'institution_id' => $institution->id,
            'end_date' => now()->addDays(10)->startOfDay(),
        ]);

        $this->assertEqualsWithDelta(10, $campaign->days_left, 1);
    }

    /** @test */
    public function donor_only_sees_active_campaigns()
    {
        $institution = Institution::factory()->create();

        $user = User::factory()->create(['institution_id' => $institution->id]);
        $user->assignRole('donor');

        Campaign::factory()->active()->create([
            'institution_id' => $institution->id,
            'title' => 'Active Campaign'
        ]);
        Campaign::factory()->pendingReview()->create([
            'institution_id' => $institution->id,
            'title' => 'Pending Campaign'
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/campaigns');

        $response->assertStatus(200);
        $campaigns = $response->json('data.data');

        $this->assertCount(1, $campaigns);
        $this->assertEquals('Active Campaign', $campaigns[0]['title']);
        $this->assertEquals('active', $campaigns[0]['status']);
    }

    /** @test */
    public function committee_member_sees_all_campaigns_from_institution()
    {
        $institution1 = Institution::factory()->create();
        $institution2 = Institution::factory()->create();

        $user = User::factory()->create(['institution_id' => $institution1->id]);
        $user->assignRole('committee_member');

        Campaign::factory()->active()->create([
            'institution_id' => $institution1->id,
            'title' => 'Active from Institution 1'
        ]);
        Campaign::factory()->pendingReview()->create([
            'institution_id' => $institution1->id,
            'title' => 'Pending from Institution 1'
        ]);
        Campaign::factory()->active()->create([
            'institution_id' => $institution2->id,
            'title' => 'Active from Institution 2'
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/campaigns');

        $response->assertStatus(200);
        $campaigns = $response->json('data.data');

        // Should see both active and pending from own institution
        $this->assertCount(2, $campaigns);
        $this->assertStringContainsString('Institution 1', $response->content());
        $this->assertStringNotContainsString('Institution 2', $response->content());
    }
}
