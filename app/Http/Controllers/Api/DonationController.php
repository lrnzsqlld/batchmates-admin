<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\Donation;
use App\Models\Campaign;
use Illuminate\Http\Request;

class DonationController extends Controller
{
    /**
     * @OA\Get(
     *   path="/donations",
     *   summary="Get all donations",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Parameter(
     *     name="status",
     *     in="query",
     *     description="Filter by status",
     *     @OA\Schema(type="string", enum={"pending","completed","failed"})
     *   ),
     *   @OA\Parameter(
     *     name="campaign_id",
     *     in="query",
     *     description="Filter by campaign ID",
     *     @OA\Schema(type="integer")
     *   ),
     *   @OA\Parameter(
     *     name="search",
     *     in="query",
     *     description="Search by donor name, email, or transaction ID",
     *     @OA\Schema(type="string")
     *   ),
     *   @OA\Parameter(
     *     name="page",
     *     in="query",
     *     description="Page number",
     *     @OA\Schema(type="integer", default=1)
     *   ),
     *   @OA\Parameter(
     *     name="per_page",
     *     in="query",
     *     description="Items per page",
     *     @OA\Schema(type="integer", default=15)
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="List of donations",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(
     *         property="data",
     *         type="object",
     *         @OA\Property(property="current_page", type="integer"),
     *         @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Donation")),
     *         @OA\Property(property="total", type="integer")
     *       )
     *     )
     *   )
     * )
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Donation::with(['campaign', 'user'])->latest();

        // Scope by user role and institution
        if ($user->hasRole('system_admin')) {
            // System admin sees all
        } elseif ($user->hasRole(['institution_admin', 'committee_member'])) {
            // Institution admin sees only their institution's donations
            if ($user->institution_id) {
                $query->where('institution_id', $user->institution_id);
            }
        } else {
            // Donors see only their own donations
            $query->where('user_id', $user->id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->campaign_id) {
            $query->where('campaign_id', $request->campaign_id);
        }

        if ($request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(donor_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(donor_email) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(transaction_id) LIKE ?', ["%{$search}%"])
                    ->orWhereHas('campaign', function ($q) use ($search) {
                        $q->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"]);
                    });
            });
        }

        $perPage = $request->per_page ?? 15;
        $donations = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $donations
        ]);
    }

    /**
     * @OA\Post(
     *   path="/donations",
     *   summary="Create a new donation",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\JsonContent(
     *       required={"campaign_id","amount","payment_method"},
     *       @OA\Property(property="campaign_id", type="integer", example=1),
     *       @OA\Property(property="amount", type="number", format="float", example=5000),
     *       @OA\Property(property="payment_method", type="string", enum={"gcash","paymaya","credit_card","bank_transfer"}, example="gcash"),
     *       @OA\Property(property="is_anonymous", type="boolean", example=false),
     *       @OA\Property(property="message", type="string", example="Keep up the good work!")
     *     )
     *   ),
     *   @OA\Response(
     *     response=201,
     *     description="Donation created successfully",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="data", ref="#/components/schemas/Donation"),
     *       @OA\Property(property="message", type="string", example="Donation created successfully")
     *     )
     *   ),
     *   @OA\Response(response=422, description="Validation error"),
     *   @OA\Response(response=400, description="Campaign not accepting donations")
     * )
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'campaign_id' => 'required|exists:campaigns,id',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|in:gcash,paymaya,credit_card,bank_transfer',
            'is_anonymous' => 'boolean',
            'message' => 'nullable|string|max:500',
        ]);

        $campaign = Campaign::findOrFail($validated['campaign_id']);

        // Check if campaign is active
        if ($campaign->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This campaign is not accepting donations'
            ], 400);
        }

        // Set donor information
        if ($request->user()) {
            $validated['user_id'] = $request->user()->id;
            $validated['donor_name'] = $request->user()->name;
            $validated['donor_email'] = $request->user()->email;
        }

        $validated['institution_id'] = $campaign->institution_id;
        $validated['status'] = 'pending';
        $validated['transaction_id'] = 'TXN' . strtoupper(uniqid());

        // Handle anonymous donations
        if ($validated['is_anonymous'] ?? false) {
            $validated['donor_display_name'] = 'Anonymous Donor';
            $validated['donor_name'] = null;
            $validated['donor_email'] = null;
        } else {
            $validated['donor_display_name'] = $validated['donor_name'] ?? 'Unknown';
        }

        $donation = Donation::create($validated);

        return response()->json([
            'success' => true,
            'data' => $donation->load(['campaign', 'user']),
            'message' => 'Donation created successfully'
        ], 201);
    }

    /**
     * @OA\Get(
     *   path="/donations/{id}",
     *   summary="Get donation by ID",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Parameter(
     *     name="id",
     *     in="path",
     *     required=true,
     *     description="Donation ID",
     *     @OA\Schema(type="integer")
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Donation details",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="data", ref="#/components/schemas/Donation")
     *     )
     *   ),
     *   @OA\Response(response=403, description="Unauthorized"),
     *   @OA\Response(response=404, description="Donation not found")
     * )
     */
    public function show(Donation $donation)
    {
        $user = request()->user();

        if ($user->hasRole('system_admin')) {
            // Can view any donation
        } elseif ($user->hasRole(['institution_admin', 'committee_member'])) {
            // Can view donations from their institution
            if ($donation->institution_id !== $user->institution_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
        } else {
            // Can only view own donations
            if ($donation->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
        }

        $donation->load(['campaign', 'user']);

        return response()->json([
            'success' => true,
            'data' => $donation
        ]);
    }

    /**
     * @OA\Put(
     *   path="/donations/{id}",
     *   summary="Update donation status",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Parameter(
     *     name="id",
     *     in="path",
     *     required=true,
     *     description="Donation ID",
     *     @OA\Schema(type="integer")
     *   ),
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\JsonContent(
     *       required={"status"},
     *       @OA\Property(property="status", type="string", enum={"pending","completed","failed"}, example="completed")
     *     )
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Donation updated successfully",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="data", ref="#/components/schemas/Donation"),
     *       @OA\Property(property="message", type="string")
     *     )
     *   ),
     *   @OA\Response(response=403, description="Unauthorized")
     * )
     */
    public function update(Request $request, Donation $donation)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,completed,failed',
        ]);

        // Only admins can update donation status
        if (!$request->user()->hasRole(['system_admin', 'institution_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Update campaign raised_amount when status changes to completed
        if ($validated['status'] === 'completed' && $donation->status !== 'completed') {
            $campaign = $donation->campaign;
            $campaign->increment('raised_amount', (float) $donation->amount);
        }

        $donation->update($validated);

        return response()->json([
            'success' => true,
            'data' => $donation->load(['campaign', 'user']),
            'message' => 'Donation updated successfully'
        ]);
    }

    /**
     * @OA\Delete(
     *   path="/donations/{id}",
     *   summary="Delete a donation",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Parameter(
     *     name="id",
     *     in="path",
     *     required=true,
     *     description="Donation ID",
     *     @OA\Schema(type="integer")
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Donation deleted successfully",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="message", type="string")
     *     )
     *   ),
     *   @OA\Response(response=403, description="Unauthorized")
     * )
     */
    public function destroy(Donation $donation)
    {
        // Only system admin can delete
        if (!request()->user()->hasRole('system_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $donation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Donation deleted successfully'
        ]);
    }

    /**
     * @OA\Get(
     *   path="/donations/stats",
     *   summary="Get donation statistics",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Response(
     *     response=200,
     *     description="Donation statistics",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(
     *         property="data",
     *         type="object",
     *         @OA\Property(property="total_donations", type="number", example=150000),
     *         @OA\Property(property="total_count", type="integer", example=25),
     *         @OA\Property(property="pending_count", type="integer", example=3),
     *         @OA\Property(property="this_month", type="number", example=45000),
     *         @OA\Property(property="total_donors", type="integer", example=18)
     *       )
     *     )
     *   )
     * )
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        $query = Donation::query();

        // Scope stats by user role
        if ($user->hasRole('system_admin')) {
            // System admin sees all stats
        } elseif ($user->hasRole(['institution_admin', 'committee_member'])) {
            // Institution stats only
            if ($user->institution_id) {
                $query->where('institution_id', $user->institution_id);
            }
        } else {
            // Donor sees only their stats
            $query->where('user_id', $user->id);
        }

        $stats = [
            'total_donations' => $query->where('status', 'completed')->sum('amount'),
            'total_count' => $query->where('status', 'completed')->count(),
            'pending_count' => (clone $query)->where('status', 'pending')->count(),
            'this_month' => (clone $query)->where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount'),
            'total_donors' => $query->where('status', 'completed')
                ->distinct('user_id')
                ->whereNotNull('user_id')
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * @OA\Get(
     *   path="/donations/my",
     *   summary="Get current user's donations (Mobile)",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Parameter(
     *     name="page",
     *     in="query",
     *     description="Page number",
     *     @OA\Schema(type="integer", default=1)
     *   ),
     *   @OA\Parameter(
     *     name="per_page",
     *     in="query",
     *     description="Items per page",
     *     @OA\Schema(type="integer", default=20)
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="User's donation history",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(
     *         property="data",
     *         type="object",
     *         @OA\Property(property="current_page", type="integer"),
     *         @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Donation")),
     *         @OA\Property(property="total", type="integer")
     *       )
     *     )
     *   )
     * )
     */
    public function myDonations(Request $request)
    {
        $user = $request->user();
        $perPage = $request->per_page ?? 20;

        $donations = Donation::with(['campaign'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $donations
        ]);
    }

    /**
     * @OA\Get(
     *   path="/donations/my/stats",
     *   summary="Get current user's donation statistics (Mobile)",
     *   tags={"Donations"},
     *   security={{"sanctum":{}}},
     *   @OA\Response(
     *     response=200,
     *     description="User's donation statistics",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(
     *         property="data",
     *         type="object",
     *         @OA\Property(property="total_donated", type="number", example=15000),
     *         @OA\Property(property="total_count", type="integer", example=5),
     *         @OA\Property(property="campaigns_supported", type="integer", example=3),
     *         @OA\Property(property="this_month", type="number", example=5000)
     *       )
     *     )
     *   )
     * )
     */
    public function myStats(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total_donated' => Donation::where('user_id', $user->id)
                ->where('status', 'completed')
                ->sum('amount'),
            'total_count' => Donation::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'campaigns_supported' => Donation::where('user_id', $user->id)
                ->where('status', 'completed')
                ->distinct('campaign_id')
                ->count(),
            'this_month' => Donation::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
