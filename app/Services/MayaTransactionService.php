<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Donation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class MayaTransactionService
{
    public function initiate(array $data, ?int $userId = null): array
    {
        $campaign = Campaign::where('id', $data['campaign_id'])
            ->where('status', 'active')
            ->first();

        if (! $campaign) {
            throw new RuntimeException('Campaign is not active');
        }

        $donation = Donation::create([
            'campaign_id' => $campaign->id,
            'user_id' => $userId,
            'amount' => $data['amount'],
            'payment_method' => 'maya',
            'status' => 'pending',
            'is_anonymous' => $data['is_anonymous'] ?? false,
            'donor_name' => $data['donor_name'] ?? null,
            'donor_email' => $data['donor_email'] ?? null,
            'reference' => Str::uuid()->toString(),
        ]);

        $response = Http::post(config('services.maya.checkout_url'), [
            'amount' => [
                'value' => $donation->amount,
                'currency' => 'PHP',
            ],
            'requestReferenceNumber' => $donation->reference,
            'redirectUrl' => [
                'success' => config('app.frontend_url') . '/payment/success',
                'failure' => config('app.frontend_url') . '/payment/failure',
                'cancel' => config('app.frontend_url') . '/payment/cancel',
            ],
        ]);

        if (! $response->successful() || empty($response['redirectUrl'])) {
            $donation->delete();
            throw new RuntimeException('Failed to create Maya checkout');
        }

        return [
            'redirectUrl' => $response['redirectUrl'],
            'payment_reference' => $donation->reference,
        ];
    }
}
