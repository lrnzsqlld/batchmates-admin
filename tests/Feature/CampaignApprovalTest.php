<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Campaign;
use App\Models\Institution;
use App\Models\CampaignApproval;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class CampaignApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $campaign;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'system_admin']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('system_admin');

        $institution = Institution::factory()->create();
        $this->campaign = Campaign::factory()->create([
            'institution_id' => $institution->id,
            'status' => 'pending_review'
        ]);
    }

    /** @test */
    public function admin_can_approve_pending_campaign()
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/approve", [
                'notes' => 'Looks good!'
            ]);

        $response->assertStatus(200);

        $this->campaign->refresh();
        $this->assertEquals('active', $this->campaign->status);

        $this->assertDatabaseHas('campaign_approvals', [
            'campaign_id' => $this->campaign->id,
            'user_id' => $this->admin->id,
            'status' => 'approved'
        ]);
    }

    /** @test */
    public function admin_can_reject_campaign_with_reason()
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/reject", [
                'reason' => 'Missing documentation',
                'notes' => 'Please provide budget breakdown'
            ]);

        $response->assertStatus(200);

        $this->campaign->refresh();
        $this->assertEquals('rejected', $this->campaign->status);

        $approval = CampaignApproval::where('campaign_id', $this->campaign->id)->first();
        $this->assertStringContainsString('Missing documentation', $approval->comments);
    }

    /** @test */
    public function reject_requires_reason()
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/reject", [
                'notes' => 'Some notes'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    /** @test */
    public function cannot_approve_already_active_campaign()
    {
        $this->campaign->update(['status' => 'active']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/approve");

        $response->assertStatus(422);
    }

    /** @test */
    public function can_list_pending_campaigns()
    {
        Campaign::factory()->count(3)->create(['status' => 'pending_review']);
        Campaign::factory()->count(2)->create(['status' => 'active']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/campaignStats/pending-review');

        $response->assertStatus(200);
        $this->assertCount(4, $response->json('data'));
    }

    /** @test */
    public function can_mark_campaign_as_completed_when_goal_reached()
    {
        $this->campaign->update([
            'status' => 'active',
            'goal_amount' => 10000,
            'raised_amount' => 10000
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/complete");

        $response->assertStatus(200);

        $this->campaign->refresh();
        $this->assertEquals('completed', $this->campaign->status);
    }

    /** @test */
    public function cannot_complete_campaign_before_goal_reached()
    {
        $this->campaign->update([
            'status' => 'active',
            'goal_amount' => 10000,
            'raised_amount' => 5000
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/complete");

        $response->assertStatus(422);
    }

    /** @test */
    public function can_close_campaign_early_with_reason()
    {
        $this->campaign->update(['status' => 'active']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/close", [
                'reason' => 'Project cancelled'
            ]);

        $response->assertStatus(200);

        $this->campaign->refresh();
        $this->assertEquals('closed', $this->campaign->status);
    }

    /** @test */
    public function close_requires_reason()
    {
        $this->campaign->update(['status' => 'active']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/close");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    /** @test */
    public function can_view_campaign_approval_history()
    {
        CampaignApproval::create([
            'campaign_id' => $this->campaign->id,
            'user_id' => $this->admin->id,
            'status' => 'approved',
            'approved_at' => now()
        ]);

        $anotherUser = User::factory()->create();
        $anotherUser->assignRole('system_admin');

        CampaignApproval::create([
            'campaign_id' => $this->campaign->id,
            'user_id' => $anotherUser->id,
            'status' => 'rejected',
            'comments' => 'Test closure',
            'approved_at' => now()
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/approval/campaigns/{$this->campaign->id}/history");

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('history'));
    }

    /** @test */
    public function non_admin_cannot_approve_campaigns()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/approve");

        $response->assertStatus(403);
    }

    /** @test */
    public function guest_cannot_access_approval_endpoints()
    {
        $response = $this->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/approve");
        $response->assertStatus(401);

        $response = $this->getJson('/api/v1/campaignStats/pending-review');
        $response->assertStatus(401);
    }

    /** @test */
    public function approval_records_correct_data()
    {
        $this->actingAs($this->admin)
            ->postJson("/api/v1/approval/campaigns/{$this->campaign->id}/approve", [
                'notes' => 'Approved'
            ]);

        $approval = CampaignApproval::where('campaign_id', $this->campaign->id)->first();

        $this->assertEquals($this->admin->id, $approval->user_id);
        $this->assertEquals('approved', $approval->status);
        $this->assertNotNull($approval->approved_at);
    }
}
