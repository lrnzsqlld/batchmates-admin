<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Notification;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;


    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    /** @test */
    public function user_can_request_password_reset()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'test@example.com'
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password reset link sent to your email']);
    }

    /** @test */
    public function forgot_password_returns_success_even_for_nonexistent_email()
    {
        // Prevents email enumeration
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nonexistent@example.com'
        ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function forgot_password_requires_valid_email()
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'invalid-email'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function user_can_reset_password_with_valid_token()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('oldpassword123')
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password has been reset successfully']);

        // Verify password was actually changed
        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    /** @test */
    public function reset_password_fails_with_invalid_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => 'invalid-token',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function reset_password_requires_password_confirmation()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'differentpassword'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function reset_password_requires_minimum_8_characters()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'short',
            'password_confirmation' => 'short'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function can_verify_valid_reset_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/verify-reset-token', [
            'email' => 'test@example.com',
            'token' => $token
        ]);

        $response->assertStatus(200)
            ->assertJson(['valid' => true]);
    }

    /** @test */
    public function verify_returns_false_for_invalid_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/v1/auth/verify-reset-token', [
            'email' => 'test@example.com',
            'token' => 'invalid-token'
        ]);

        $response->assertStatus(422)
            ->assertJson(['valid' => false]);
    }

    /** @test */
    public function token_can_only_be_used_once()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = Password::createToken($user);

        // First reset succeeds
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ])->assertStatus(200);

        // Second reset with same token fails
        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'anotherpassword123',
            'password_confirmation' => 'anotherpassword123'
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function user_can_login_with_new_password_after_reset()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('oldpassword')
        ]);

        $token = Password::createToken($user);

        // Reset password
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ]);

        // Try logging in with new password
        $response = $this->postJson('/api/v1/mobile/auth/login', [
            'email' => 'test@example.com',
            'password' => 'newpassword123',
            'device_name' => 'Test Device'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'message']);
    }
}
