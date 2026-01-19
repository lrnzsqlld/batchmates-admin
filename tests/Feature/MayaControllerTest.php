<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Institution;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class MayaControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            '*' => Http::response([
                'checkoutId' => 'test-checkout-id',
                'redirectUrl' => 'https://pg-sandbox.paymaya.com/checkout/test'
            ], 200)
        ]);
    }

    /** @test */
    public function guest_can_donate_anonymously_or_with_identity()
    {
        $campaign = $this->activeCampaign();

        $this->postJson('/api/v1/maya/donate', [
            'campaign_id' => $campaign->id,
            'amount' => 1000,
            'is_anonymous' => true
        ])->assertStatus(201);

        $this->postJson('/api/v1/maya/donate', [
            'campaign_id' => $campaign->id,
            'amount' => 2000,
            'donor_name' => 'Juan',
            'donor_email' => 'juan@test.com',
            'is_anonymous' => false
        ])->assertStatus(201);

        $this->assertDatabaseCount('donations', 2);
    }

    /** @test */
    public function donation_validation_and_campaign_rules_are_enforced()
    {
        $campaign = $this->activeCampaign([
            'goal_amount' => 5000,
            'raised_amount' => 4800
        ]);

        $this->postJson('/api/v1/maya/donate', [
            'campaign_id' => $campaign->id,
            'amount' => 1000
        ])->assertStatus(422);

        $this->postJson('/api/v1/maya/donate', [
            'campaign_id' => 999,
            'amount' => 1000
        ])->assertStatus(422);

        $this->postJson('/api/v1/maya/donate', [
            'campaign_id' => $campaign->id,
            'amount' => -5
        ])->assertStatus(422);
    }

    /** @test */
    public function inactive_campaign_rejects_donation()
    {
        $campaign = $this->campaign(['status' => 'pending_review']);

        $this->postJson('/api/v1/maya/donate', [
            'campaign_id' => $campaign->id,
            'amount' => 1000
        ])->assertStatus(422);
    }

    /** @test */
    public function webhook_updates_donation_and_campaign_correctly()
    {
        $donation = $this->pendingDonation([
            'amount' => 1000
        ]);

        $campaign = $donation->campaign;

        $this->postJson('/api/v1/payments/maya/webhook', [
            'status' => 'PAYMENT_SUCCESS',
            'requestReferenceNumber' => $donation->payment_reference
        ])->assertOk();

        $donation->refresh();
        $campaign->refresh();

        $this->assertEquals('completed', $donation->status);
        $this->assertEquals(1000, $campaign->raised_amount);
    }

    /** @test */
    public function webhook_handles_all_terminal_states()
    {
        foreach (
            [
                'PAYMENT_FAILED' => 'failed',
                'PAYMENT_CANCELLED' => 'cancelled',
                'PAYMENT_EXPIRED' => 'expired',
            ] as $mayaStatus => $dbStatus
        ) {
            $donation = $this->pendingDonation();

            $this->postJson('/api/v1/payments/maya/webhook', [
                'status' => $mayaStatus,
                'requestReferenceNumber' => $donation->payment_reference
            ]);

            $donation->refresh();
            $this->assertEquals($dbStatus, $donation->status);
        }
    }

    /** @test */
    public function campaign_is_completed_when_goal_is_reached()
    {
        $campaign = $this->activeCampaign([
            'goal_amount' => 5000,
            'raised_amount' => 4000
        ]);

        $donation = $this->pendingDonation([
            'campaign_id' => $campaign->id,
            'amount' => 1000
        ]);

        $this->postJson('/api/v1/payments/maya/webhook', [
            'status' => 'PAYMENT_SUCCESS',
            'requestReferenceNumber' => $donation->payment_reference
        ]);

        $campaign->refresh();

        $this->assertEquals('completed', $campaign->status);
        $this->assertEquals(5000, $campaign->raised_amount);
    }

    /** @test */
    public function authenticated_user_can_initiate_payment()
    {
        $user = User::factory()->create();
        $campaign = $this->activeCampaign();

        $donation = Donation::factory()->create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
            'status' => 'pending',
            'amount' => 1500
        ]);

        $this->actingAs($user)
            ->postJson("/api/v1/donations/{$donation->id}/pay")
            ->assertOk()
            ->assertJsonStructure(['redirectUrl', 'payment_reference']);
    }

    /** @test */
    public function completed_donation_cannot_be_paid_again()
    {
        $user = User::factory()->create();

        $donation = Donation::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed'
        ]);

        $this->actingAs($user)
            ->postJson("/api/v1/donations/{$donation->id}/pay")
            ->assertStatus(422);
    }

    /** @test */
    public function maya_callbacks_redirect_to_frontend()
    {
        $donation = $this->pendingDonation();

        $this->get('/api/v1/payments/maya/success?id=' . $donation->payment_reference)
            ->assertRedirectContains('/donations/success');

        $this->get('/api/v1/payments/maya/failure?id=' . $donation->payment_reference)
            ->assertRedirectContains('/donations/failed');

        $this->get('/api/v1/payments/maya/cancel?id=' . $donation->payment_reference)
            ->assertRedirectContains('/donations/cancelled');
    }

    private function activeCampaign(array $overrides = []): Campaign
    {
        return $this->campaign(array_merge(['status' => 'active'], $overrides));
    }

    private function campaign(array $overrides = []): Campaign
    {
        $institution = Institution::factory()->create();

        return Campaign::factory()->create(array_merge([
            'institution_id' => $institution->id,
            'goal_amount' => 10000,
            'raised_amount' => 0
        ], $overrides));
    }

    private function pendingDonation(array $overrides = []): Donation
    {
        $campaign = $this->activeCampaign();

        return Donation::factory()->create(array_merge([
            'campaign_id' => $campaign->id,
            'status' => 'pending',
            'amount' => 1000,
            'payment_reference' => 'MAYA-test-' . uniqid()
        ], $overrides));
    }
}
