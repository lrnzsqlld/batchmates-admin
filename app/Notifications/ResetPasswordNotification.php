<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $token;
    public $email;

    public function __construct(string $token, string $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $url = $this->resetUrl();

        return (new MailMessage)
            ->subject('Reset Password - Batchmates')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $url)
            ->line('This password reset link will expire in ' . config('auth.passwords.users.expire') . ' minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }

    protected function resetUrl(): string
    {
        // For mobile app deep linking
        if (config('app.mobile_deep_link_enabled')) {
            return config('app.mobile_app_scheme') . '://reset-password?' . http_build_query([
                'token' => $this->token,
                'email' => $this->email,
            ]);
        }

        // For web frontend
        return config('app.frontend_url') . '/reset-password?' . http_build_query([
            'token' => $this->token,
            'email' => $this->email,
        ]);
    }
}
