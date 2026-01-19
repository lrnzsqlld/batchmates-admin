<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Services\MayaTransactionService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * @OA\Tag(
 *     name="Maya Payments",
 *     description="Donation payments via Maya"
 * )
 */
class MayaController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/v1/maya/donate",
     *     summary="Initiate a Maya donation payment",
     *     tags={"Maya Payments"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"campaign_id","amount"},
     *             @OA\Property(property="campaign_id", type="integer", example=1),
     *             @OA\Property(property="amount", type="number", example=1000),
     *             @OA\Property(property="is_anonymous", type="boolean", example=false),
     *             @OA\Property(property="donor_name", type="string", example="Juan Dela Cruz"),
     *             @OA\Property(property="donor_email", type="string", example="juan@email.com")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Payment initiated",
     *         @OA\JsonContent(
     *             @OA\Property(property="redirectUrl", type="string"),
     *             @OA\Property(property="payment_reference", type="string")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Validation error"),
     *     @OA\Response(response=500, description="Maya service failure")
     * )
     */
    public function donate(Request $request, MayaTransactionService $service)
    {
        $validated = $request->validate([
            'campaign_id' => ['required', 'integer', 'exists:campaigns,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'is_anonymous' => ['sometimes', 'boolean'],
            'donor_name' => ['nullable', 'string'],
            'donor_email' => ['nullable', 'email'],
        ]);

        if (($validated['is_anonymous'] ?? false) === false) {
            if (empty($validated['donor_name']) || empty($validated['donor_email'])) {
                throw ValidationException::withMessages([
                    'donor' => ['Name and email are required when not anonymous'],
                ]);
            }
        }

        try {
            return response()->json(
                $service->initiate($validated, $request->user()?->id),
                201
            );
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages([
                'payment' => [$e->getMessage()],
            ]);
        }
    }
}
