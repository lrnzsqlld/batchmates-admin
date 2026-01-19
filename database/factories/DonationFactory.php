<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Donation;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DonationFactory extends Factory
{
    protected $model = Donation::class;

    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'institution_id' => Institution::factory(),
            'campaign_id' => Campaign::factory(),
            'user_id' => $user->id,
            'donor_name' => $user->name,
            'donor_email' => $user->email,
            'amount' => fake()->randomElement([1000, 2500, 5000, 10000, 25000, 50000]),
            'status' => 'completed',
            'payment_method' => fake()->randomElement(['gcash', 'paymaya', 'credit_card', 'bank_transfer']),
            'transaction_id' => 'TXN' . strtoupper(uniqid()),
            'is_anonymous' => fake()->boolean(30), // 30% chance anonymous
            'message' => fake()->boolean(50) ? fake()->sentence() : null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'completed',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'failed',
        ]);
    }

    public function anonymous(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_anonymous' => true,
            'user_id' => null,
        ]);
    }

    public function withMessage(): static
    {
        return $this->state(fn(array $attributes) => [
            'message' => fake()->sentence(),
        ]);
    }
}
