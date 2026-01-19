<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\Campaign;
use App\Models\CampaignApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Campaign Approval",
    description: "Campaign approval workflow for committee members"
)]
class CampaignApprovalController extends Controller
{
    #[OA\Post(
        path: "/api/v1/campaigns/{campaign}/approve",
        summary: "Approve campaign",
        description: "Committee member approves campaign",
        tags: ["Campaign Approval"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "campaign", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "notes", type: "string", example: "Campaign looks good, approved.")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Campaign approved"),
            new OA\Response(response: 403, description: "Not authorized")
        ]
    )]
    public function approve(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        if ($campaign->status !== 'pending_review') {
            return response()->json([
                'message' => 'Campaign must be in pending_review status to approve'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update campaign status to active
            $campaign->status = 'active';
            $campaign->save();

            // Create approval record - matching YOUR schema
            CampaignApproval::create([
                'campaign_id' => $campaign->id,
                'user_id' => auth()->id(),
                'status' => 'approved',
                'comments' => $validated['notes'] ?? null,
                'approved_at' => now()
            ]);

            DB::commit();

            Log::info('Campaign approved', [
                'campaign_id' => $campaign->id,
                'approved_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Campaign approved successfully',
                'campaign' => $campaign->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Campaign approval failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to approve campaign'
            ], 500);
        }
    }

    #[OA\Post(
        path: "/api/v1/campaigns/{campaign}/reject",
        summary: "Reject campaign",
        description: "Committee member rejects campaign with reason",
        tags: ["Campaign Approval"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "campaign", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["reason"],
                properties: [
                    new OA\Property(property: "reason", type: "string", example: "Missing required documentation"),
                    new OA\Property(property: "notes", type: "string", example: "Please provide budget breakdown")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Campaign rejected"),
            new OA\Response(response: 403, description: "Not authorized")
        ]
    )]
    public function reject(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'notes' => 'nullable|string|max:1000'
        ]);

        if ($campaign->status !== 'pending_review') {
            return response()->json([
                'message' => 'Campaign must be in pending_review status to reject'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update campaign status to rejected
            $campaign->status = 'rejected';
            $campaign->save();

            // Create rejection record - matching YOUR schema
            $comments = $validated['reason'];
            if (!empty($validated['notes'])) {
                $comments .= "\n\nNotes: " . $validated['notes'];
            }

            CampaignApproval::create([
                'campaign_id' => $campaign->id,
                'user_id' => auth()->id(),
                'status' => 'rejected',
                'comments' => $comments,
                'approved_at' => now()
            ]);

            DB::commit();

            Log::info('Campaign rejected', [
                'campaign_id' => $campaign->id,
                'rejected_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Campaign rejected',
                'campaign' => $campaign->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Campaign rejection failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to reject campaign'
            ], 500);
        }
    }

    #[OA\Post(
        path: "/api/v1/campaigns/{campaign}/complete",
        summary: "Mark campaign as completed",
        description: "Mark campaign as completed when goal is reached",
        tags: ["Campaign Approval"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "campaign", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Campaign marked as completed")
        ]
    )]
    public function complete(Campaign $campaign)
    {
        if ($campaign->status !== 'active') {
            return response()->json([
                'message' => 'Only active campaigns can be marked as completed'
            ], 422);
        }

        if ($campaign->raised_amount < $campaign->goal_amount) {
            return response()->json([
                'message' => 'Campaign has not reached its goal yet'
            ], 422);
        }

        $campaign->status = 'completed';
        $campaign->save();

        Log::info('Campaign completed', [
            'campaign_id' => $campaign->id,
            'raised_amount' => $campaign->raised_amount,
            'goal_amount' => $campaign->goal_amount
        ]);

        return response()->json([
            'message' => 'Campaign marked as completed',
            'campaign' => $campaign
        ]);
    }

    #[OA\Post(
        path: "/api/v1/campaigns/{campaign}/close",
        summary: "Close campaign early",
        description: "Manually close campaign before reaching goal",
        tags: ["Campaign Approval"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "campaign", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["reason"],
                properties: [
                    new OA\Property(property: "reason", type: "string", example: "Project requirements changed")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Campaign closed")
        ]
    )]
    public function close(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        if ($campaign->status === 'closed') {
            return response()->json([
                'message' => 'Campaign is already closed'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $campaign->status = 'closed';
            $campaign->save();

            CampaignApproval::create([
                'campaign_id' => $campaign->id,
                'user_id' => auth()->id(),
                'status' => 'rejected',
                'comments' => 'Closed: ' . $validated['reason'],
                'approved_at' => now()
            ]);

            DB::commit();

            Log::info('Campaign closed', [
                'campaign_id' => $campaign->id,
                'closed_by' => auth()->id(),
                'reason' => $validated['reason']
            ]);

            return response()->json([
                'message' => 'Campaign closed successfully',
                'campaign' => $campaign
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to close campaign'
            ], 500);
        }
    }

    #[OA\Get(
        path: "/api/v1/campaignStats/pending-review",
        summary: "Get campaigns pending review",
        description: "List all campaigns waiting for committee approval",
        tags: ["Campaign Approval"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of pending campaigns",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(type: "object")
                        )
                    ]
                )
            )
        ]
    )]
    public function pending()
    {
        $campaigns = Campaign::where('status', 'pending_review')
            ->with(['institution', 'bankAccount'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($campaigns);
    }

    #[OA\Get(
        path: "/api/v1/campaigns/{campaign}/history",
        summary: "Get campaign approval history",
        description: "View all approval actions for a campaign",
        tags: ["Campaign Approval"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "campaign", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Approval history")
        ]
    )]
    public function history(Campaign $campaign)
    {
        $history = CampaignApproval::where('campaign_id', $campaign->id)
            ->with('approvedBy:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'campaign' => $campaign,
            'history' => $history
        ]);
    }
}
