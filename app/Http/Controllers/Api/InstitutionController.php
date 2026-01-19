<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\Institution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InstitutionController extends Controller
{
    public function index(Request $request)
    {
        $query = Institution::query();

        if ($request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(city) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'active');
        }

        $institutions = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $institutions
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:institutions,email',
            'phone' => 'nullable|string|max:20',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'status' => 'sometimes|in:active,suspended,pending',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $originalSlug = $validated['slug'];
        $counter = 1;

        while (Institution::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $counter;
            $counter++;
        }

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('institutions', 'public');
        }

        $institution = Institution::create($validated);

        return response()->json([
            'success' => true,
            'data' => $institution,
            'message' => 'Institution created successfully'
        ], 201);
    }

    public function show(Institution $institution)
    {
        $institution->load(['users', 'campaigns', 'alumniCommittees']);

        return response()->json([
            'success' => true,
            'data' => $institution
        ]);
    }

    public function update(Request $request, Institution $institution)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:institutions,email,' . $institution->id,
            'phone' => 'nullable|string|max:20',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'status' => 'sometimes|in:active,suspended,pending',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $institution->name) {
            $validated['slug'] = Str::slug($validated['name']);
            $originalSlug = $validated['slug'];
            $counter = 1;

            while (Institution::where('slug', $validated['slug'])->where('id', '!=', $institution->id)->exists()) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        if ($request->hasFile('logo')) {
            if ($institution->logo) {
                Storage::disk('public')->delete($institution->logo);
            }
            $validated['logo'] = $request->file('logo')->store('institutions', 'public');
        }

        $institution->update($validated);

        return response()->json([
            'success' => true,
            'data' => $institution,
            'message' => 'Institution updated successfully'
        ]);
    }

    public function destroy(Institution $institution)
    {
        if ($institution->logo) {
            Storage::disk('public')->delete($institution->logo);
        }

        $institution->delete();

        return response()->json([
            'success' => true,
            'message' => 'Institution deleted successfully'
        ]);
    }

    public function stats(Institution $institution)
    {
        $stats = [
            'total_users' => $institution->users()->count(),
            'total_campaigns' => $institution->campaigns()->count(),
            'active_campaigns' => $institution->campaigns()->where('status', 'active')->count(),
            'total_raised' => $institution->donations()->where('status', 'completed')->sum('amount'),
            'total_committees' => $institution->alumniCommittees()->count(),
            'active_committees' => $institution->alumniCommittees()->where('status', 'active')->count(),
            'total_donations' => $institution->donations()->where('status', 'completed')->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
