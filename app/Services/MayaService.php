<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response;

/**
 * Maya Payment Gateway Service
 * 
 * Handles integration with Maya (formerly PayMaya) payment gateway
 * for processing donations and managing checkout sessions.
 */
class MayaService
{
    private string $publicKey;
    private string $secretKey;
    private string $baseUrl;
    private string $paymentsUrl;
    private bool $isProduction;

    public function __construct()
    {
        $this->publicKey = config('services.maya.public_key');
        $this->secretKey = config('services.maya.secret_key');
        $this->isProduction = config('services.maya.environment') === 'production';

        $this->baseUrl = $this->isProduction
            ? 'https://pg.paymaya.com/checkout/v1'
            : 'https://pg-sandbox.paymaya.com/checkout/v1';

        $this->paymentsUrl = $this->isProduction
            ? 'https://pg.paymaya.com/payments/v1'
            : 'https://pg-sandbox.paymaya.com/payments/v1';
    }

    /**
     * Create a new checkout session
     * 
     * @param array $payload Checkout data
     * @return array{checkoutId: string, redirectUrl: string}
     * @throws \Exception
     */
    public function createCheckout(array $payload): array
    {
        try {
            /** @var Response $response */
            $response = Http::withBasicAuth($this->publicKey, $this->secretKey)
                ->timeout(30)
                ->post("{$this->baseUrl}/checkouts", $payload);

            if ($response->successful()) {
                return [
                    'checkoutId' => $response->json('checkoutId'),
                    'redirectUrl' => $response->json('redirectUrl'),
                ];
            }

            $this->logError('Checkout creation failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            throw new \Exception(
                'Failed to create Maya checkout: ' . ($response->json('message') ?? 'Unknown error')
            );
        } catch (\Exception $e) {
            $this->logError('Checkout exception', [
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get checkout details by ID
     * 
     * @param string $checkoutId
     * @return array
     * @throws \Exception
     */
    public function getCheckoutDetails(string $checkoutId): array
    {
        try {
            /** @var Response $response */
            $response = Http::withBasicAuth($this->publicKey, $this->secretKey)
                ->timeout(30)
                ->get("{$this->baseUrl}/checkouts/{$checkoutId}");

            if ($response->successful()) {
                return $response->json();
            }

            $this->logError('Failed to get checkout details', [
                'checkoutId' => $checkoutId,
                'status' => $response->status(),
            ]);

            throw new \Exception('Failed to retrieve checkout details');
        } catch (\Exception $e) {
            $this->logError('Get checkout exception', [
                'checkoutId' => $checkoutId,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get payment status by payment ID
     * 
     * @param string $paymentId
     * @return array
     * @throws \Exception
     */
    public function getPaymentStatus(string $paymentId): array
    {
        try {
            /** @var Response $response */
            $response = Http::withBasicAuth($this->publicKey, $this->secretKey)
                ->timeout(30)
                ->get("{$this->paymentsUrl}/payments/{$paymentId}");

            if ($response->successful()) {
                return $response->json();
            }

            $this->logError('Failed to get payment status', [
                'paymentId' => $paymentId,
                'status' => $response->status(),
            ]);

            throw new \Exception('Failed to retrieve payment status');
        } catch (\Exception $e) {
            $this->logError('Get payment status exception', [
                'paymentId' => $paymentId,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Verify webhook signature
     * 
     * @param array $payload
     * @param string|null $signature
     * @return bool
     */
    public function verifyWebhookSignature(array $payload, ?string $signature = null): bool
    {
        // Maya doesn't currently provide webhook signature verification
        // This is a placeholder for future implementation
        return true;
    }

    /**
     * Get current environment
     * 
     * @return string
     */
    public function getEnvironment(): string
    {
        return $this->isProduction ? 'production' : 'sandbox';
    }

    /**
     * Check if in production mode
     * 
     * @return bool
     */
    public function isProduction(): bool
    {
        return $this->isProduction;
    }

    /**
     * Log error with context
     * 
     * @param string $message
     * @param array $context
     */
    private function logError(string $message, array $context = []): void
    {
        Log::error("[Maya Payment] {$message}", array_merge([
            'environment' => $this->getEnvironment(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log info with context
     * 
     * @param string $message
     * @param array $context
     */
    private function logInfo(string $message, array $context = []): void
    {
        Log::info("[Maya Payment] {$message}", array_merge([
            'environment' => $this->getEnvironment(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }
}
