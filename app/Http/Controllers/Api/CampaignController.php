<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\Campaign;
use App\Models\CampaignApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Campaigns",
    description: "Campaign management endpoints"
)]
class CampaignController extends Controller
{
    #[OA\Get(
        path: "/api/v1/campaigns",
        summary: "List campaigns",
        description: "Lists campaigns. Donors see only 'active' campaigns. Committee members see campaigns from their institution. Admins see all.",
        tags: ["Campaigns"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "search", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "status", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "institution_id", in: "query", required: false, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Campaign list")
        ]
    )]
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Campaign::with(['creator', 'institution', 'beneficiary', 'bankAccount'])->latest();

        // Role-based filtering
        if ($user) {
            if ($user->hasRole('donor')) {
                // Donors only see active campaigns
                $query->where('status', 'active');
            } elseif ($user->hasRole('committee_member')) {
                // Committee members see campaigns from their institution(s)
                if ($user->institution_id) {
                    $query->where('institution_id', $user->institution_id);
                }
            }
        } else {
            $query->where('status', 'active');
        }
        // Admins see everything (no filter)

        // Search
        if ($request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(description) LIKE ?', ["%{$search}%"]);
            });
        }

        // Filters
        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->institution_id) {
            $query->where('institution_id', $request->institution_id);
        }

        $campaigns = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $campaigns
        ]);
    }

    #[OA\Post(
        path: "/api/v1/campaigns",
        summary: "Create a campaign request",
        description: "Creates a new campaign. Status starts as 'pending_review' and requires committee approval to become 'active'.",
        tags: ["Campaigns"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["title", "description", "goal_amount", "campaign_type", "institution_id"],
                    properties: [
                        new OA\Property(property: "title", type: "string", example: "Medical Assistance for Juan"),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "goal_amount", type: "number", example: 100000),
                        new OA\Property(property: "campaign_type", type: "string", enum: ["general", "individual"]),
                        new OA\Property(property: "institution_id", type: "integer", description: "Required. Institution this campaign belongs to."),
                        new OA\Property(property: "bank_account_id", type: "integer", nullable: true, description: "Bank account for this campaign"),
                        new OA\Property(property: "beneficiary_id", type: "integer", nullable: true, description: "For individual campaigns"),
                        new OA\Property(property: "priority", type: "string", enum: ["normal", "urgent"]),
                        new OA\Property(property: "end_date", type: "string", format: "date"),
                        new OA\Property(property: "image", type: "string", format: "binary")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Campaign created successfully and pending review"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'goal_amount' => 'required|numeric|min:1',
            'campaign_type' => 'required|in:general,individual',
            'institution_id' => 'required|exists:institutions,id',
            'bank_account_id' => 'nullable|exists:committee_bank_accounts,id',
            'beneficiary_id' => 'nullable|exists:users,id',
            'priority' => 'sometimes|in:normal,urgent',
            'end_date' => 'nullable|date|after:today',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Validate bank account belongs to institution if provided
        if (!empty($validated['bank_account_id'])) {
            $bankAccount = \App\Models\CommitteeBankAccount::find($validated['bank_account_id']);
            if ($bankAccount && $bankAccount->institution_id != $validated['institution_id']) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'bank_account_id' => ['Bank account must belong to the selected institution']
                    ]
                ], 422);
            }
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('campaigns', 'public');
        }

        $validated['created_by'] = $request->user()->id;
        $validated['status'] = 'pending_review';
        $validated['raised_amount'] = 0;
        $validated['priority'] = $validated['priority'] ?? 'normal';

        $campaign = Campaign::create($validated);


        return response()->json([
            'success' => true,
            'data' => $campaign->load('creator', 'institution', 'bankAccount'),
            'message' => 'Campaign submitted for review'
        ], 201);
    }

    #[OA\Get(
        path: "/api/v1/campaigns/{id}",
        summary: "Get campaign details",
        tags: ["Campaigns"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Campaign details"),
            new OA\Response(response: 404, description: "Campaign not found")
        ]
    )]
    public function show(Campaign $campaign)
    {
        return response()->json([
            'success' => true,
            'data' => $campaign->load(['creator', 'institution', 'beneficiary', 'donations', 'approvals', 'bankAccount'])
        ]);
    }

    #[OA\Put(
        path: "/api/v1/campaigns/{id}",
        summary: "Update campaign",
        description: "Creator can update pending campaigns. Committee/admin can update approved campaigns.",
        tags: ["Campaigns"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "title", type: "string"),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "goal_amount", type: "number"),
                        new OA\Property(property: "image", type: "string", format: "binary")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Campaign updated"),
            new OA\Response(response: 403, description: "Cannot edit approved campaign")
        ]
    )]
    public function update(Request $request, Campaign $campaign)
    {
        // Only creator can edit pending campaigns
        if ($campaign->status === 'pending_review' && $campaign->created_by !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own pending campaigns'
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'goal_amount' => 'sometimes|numeric|min:1',
            'campaign_type' => 'sometimes|in:general,individual',
            'beneficiary_id' => 'nullable|exists:users,id',
            'priority' => 'sometimes|in:normal,urgent',
            'end_date' => 'nullable|date|after:today',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($campaign->image) {
                Storage::disk('public')->delete($campaign->image);
            }
            $validated['image'] = $request->file('image')->store('campaigns', 'public');
        }

        $campaign->update($validated);

        return response()->json([
            'success' => true,
            'data' => $campaign->load('creator', 'institution'),
            'message' => 'Campaign updated successfully'
        ]);
    }

    #[OA\Delete(
        path: "/api/v1/campaigns/{id}",
        summary: "Delete campaign",
        description: "Creator can delete pending campaigns. Admin can delete any campaign.",
        tags: ["Campaigns"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Campaign deleted"),
            new OA\Response(response: 403, description: "Cannot delete approved campaign")
        ]
    )]
    public function destroy(Request $request, Campaign $campaign)
    {
        // Only creator can delete pending, or admin can delete any
        $isCreator = $campaign->created_by === $request->user()->id;
        $isAdmin = $request->user()->hasRole('system_admin');

        if (!$isAdmin && (!$isCreator || $campaign->status !== 'pending_review')) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own pending campaigns'
            ], 403);
        }

        if ($campaign->image) {
            Storage::disk('public')->delete($campaign->image);
        }

        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campaign deleted successfully'
        ]);
    }

    #[OA\Get(
        path: "/api/v1/campaignStats",
        summary: "Campaign statistics",
        description: "Get campaign statistics scoped to user's institution",
        tags: ["Campaigns"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Campaign stats")
        ]
    )]
    public function stats(Request $request)
    {
        $user = $request->user();
        $query = Campaign::query();

        // Scope to institution if user has one
        if ($user->institution_id) {
            $query->where('institution_id', $user->institution_id);
        }

        $stats = [
            'total_campaigns' => $query->count(),
            'pending_review' => (clone $query)->where('status', 'pending_review')->count(),
            'active_campaigns' => (clone $query)->where('status', 'active')->count(),
            'completed_campaigns' => (clone $query)->where('status', 'completed')->count(),
            'total_raised' => (clone $query)->sum('raised_amount'),
            'total_goal' => (clone $query)->sum('goal_amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
