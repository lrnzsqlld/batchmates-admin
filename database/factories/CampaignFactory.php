<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        $goalAmount = fake()->numberBetween(50000, 2000000);
        $raisedAmount = fake()->numberBetween(0, $goalAmount);

        return [
            'institution_id' => Institution::factory(),
            'created_by' => User::factory(),
            'beneficiary_id' => null,
            'title' => fake()->sentence(6),
            'description' => fake()->paragraph(3),
            'goal_amount' => $goalAmount,
            'raised_amount' => $raisedAmount,
            'campaign_type' => fake()->randomElement(['general', 'individual']),
            'status' => 'pending_review',
            'priority' => 'normal',
            'end_date' => fake()->dateTimeBetween('now', '+6 months'),
        ];
    }

    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'active',
            'approved_by' => User::factory(),
            'approved_at' => now()->subDays(rand(1, 30)),
        ]);
    }

    public function pendingReview(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'pending_review',
            'raised_amount' => 0,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'rejected',
            'raised_amount' => 0,
            'rejection_reason' => fake()->sentence(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'completed',
            'raised_amount' => $attributes['goal_amount'],
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'closed',
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn(array $attributes) => [
            'priority' => 'urgent',
        ]);
    }

    public function general(): static
    {
        return $this->state(fn(array $attributes) => [
            'campaign_type' => 'general',
            'beneficiary_id' => null,
        ]);
    }

    public function individual(): static
    {
        return $this->state(fn(array $attributes) => [
            'campaign_type' => 'individual',
            'beneficiary_id' => User::factory(),
        ]);
    }
}
