<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\CommitteeBankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommitteeBankAccountController extends Controller
{
    /**
     * Display a listing of bank accounts.
     */
    public function index(Request $request)
    {
        $query = CommitteeBankAccount::query()->with(['committee', 'institution']);

        // Filter by institution
        if ($request->has('institution_id')) {
            $query->forInstitution($request->institution_id);
        }

        // Filter by committee
        if ($request->has('committee_id')) {
            $query->forCommittee($request->committee_id);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->active();
            } else {
                $query->where('status', $request->status);
            }
        }

        $bankAccounts = $query->latest()->get()->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'data' => $bankAccounts,
        ]);
    }

    /**
     * Store a newly created bank account.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'committee_id' => 'nullable|exists:alumni_committees,id',
            'institution_id' => 'required|exists:institutions,id',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_holder' => 'required|string|max:255',
            'swift_code' => 'nullable|string|max:20',
            'branch' => 'nullable|string|max:255',
            'is_primary' => 'boolean',
            'status' => 'required|in:active,inactive',
            'effective_from' => 'required|date',
            'effective_until' => 'nullable|date|after:effective_from',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $bankAccount = CommitteeBankAccount::create($validator->validated());
        $bankAccount->load(['committee', 'institution']);
        $bankAccount->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'message' => 'Bank account created successfully',
            'data' => $bankAccount,
        ], 201);
    }

    /**
     * Display the specified bank account.
     */
    public function show($id)
    {
        $bankAccount = CommitteeBankAccount::with(['committee', 'institution'])->findOrFail($id);
        $bankAccount->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'data' => $bankAccount,
        ]);
    }

    /**
     * Update the specified bank account.
     */
    public function update(Request $request, $id)
    {
        $bankAccount = CommitteeBankAccount::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'committee_id' => 'nullable|exists:alumni_committees,id',
            'institution_id' => 'sometimes|required|exists:institutions,id',
            'bank_name' => 'sometimes|required|string|max:255',
            'account_number' => 'sometimes|required|string|max:255',
            'account_holder' => 'sometimes|required|string|max:255',
            'swift_code' => 'nullable|string|max:20',
            'branch' => 'nullable|string|max:255',
            'is_primary' => 'boolean',
            'status' => 'sometimes|required|in:active,inactive',
            'effective_from' => 'sometimes|required|date',
            'effective_until' => 'nullable|date|after:effective_from',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $bankAccount->update($validator->validated());
        $bankAccount->load(['committee', 'institution']);
        $bankAccount->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'message' => 'Bank account updated successfully',
            'data' => $bankAccount,
        ]);
    }

    /**
     * Remove the specified bank account.
     */
    public function destroy($id)
    {
        $bankAccount = CommitteeBankAccount::findOrFail($id);

        // Check if this is the primary account
        if ($bankAccount->is_primary) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete primary bank account. Set another account as primary first.',
            ], 422);
        }

        $bankAccount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bank account deleted successfully',
        ]);
    }

    /**
     * Set a bank account as primary.
     */
    public function setPrimary($id)
    {
        $bankAccount = CommitteeBankAccount::findOrFail($id);

        // Check if account is active
        if ($bankAccount->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Only active accounts can be set as primary',
            ], 422);
        }

        // Check if account is effective
        if (!$bankAccount->isEffective()) {
            return response()->json([
                'success' => false,
                'message' => 'Account is not within effective date range',
            ], 422);
        }

        // Update this account to primary (model will handle unsetting others)
        $bankAccount->update(['is_primary' => true]);

        // Return all accounts for the institution
        $accounts = CommitteeBankAccount::forInstitution($bankAccount->institution_id)
            ->with(['committee', 'institution'])
            ->latest()
            ->get()
            ->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'message' => 'Primary account updated successfully',
            'data' => $accounts,
        ]);
    }

    /**
     * Get primary bank account for an institution.
     */
    public function getPrimary(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|exists:institutions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $primaryAccount = CommitteeBankAccount::forInstitution($request->institution_id)
            ->primary()
            ->active()
            ->first();

        if (!$primaryAccount) {
            return response()->json([
                'success' => false,
                'message' => 'No primary bank account found',
            ], 404);
        }

        $primaryAccount->load(['committee', 'institution']);
        $primaryAccount->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'data' => $primaryAccount,
        ]);
    }

    /**
     * Get active bank accounts for an institution.
     */
    public function getActive(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|exists:institutions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $accounts = CommitteeBankAccount::forInstitution($request->institution_id)
            ->active()
            ->with(['committee', 'institution'])
            ->latest()
            ->get()
            ->makeVisible('account_number');

        return response()->json([
            'success' => true,
            'data' => $accounts,
        ]);
    }
}
