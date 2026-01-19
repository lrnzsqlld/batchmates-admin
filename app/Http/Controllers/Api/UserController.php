<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::with(['roles', 'institution'])->latest();

        if ($user->hasRole('system_admin')) {
            // System admin sees all users
        } elseif ($user->hasRole(['institution_admin', 'committee_member'])) {
            // Institution admin/committee sees only their institution
            if ($user->institution_id) {
                $query->where('institution_id', $user->institution_id);
            }
        } else {
            // Donors see only themselves
            $query->where('id', $user->id);
        }

        if ($request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->role) {
            $query->role($request->role);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->institution_id) {
            $query->where('institution_id', $request->institution_id);
        }

        $perPage = $request->per_page ?? 15;
        $users = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'institution_id' => 'nullable|exists:institutions,id',
            'status' => 'sometimes|in:active,pending,suspended',
            'roles' => 'required|array|min:1',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $currentUser = $request->user();

        if ($currentUser->hasRole('system_admin')) {
            // System admin can create users for any institution
        } elseif ($currentUser->hasRole('institution_admin')) {
            // Institution admin can only create users for their institution
            $validated['institution_id'] = $currentUser->institution_id;
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to create users'
            ], 403);
        }

        $validated['password'] = Hash::make($validated['password']);
        $validated['status'] = $validated['status'] ?? 'active';

        $roles = $validated['roles'];
        unset($validated['roles']);

        $user = User::create($validated);
        $user->assignRole($roles);

        return response()->json([
            'success' => true,
            'data' => $user->load('roles', 'institution'),
            'message' => 'User created successfully'
        ], 201);
    }

    public function show(User $user)
    {
        $user->load('roles', 'permissions', 'institution');

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'institution_id' => 'nullable|exists:institutions,id',
            'status' => 'sometimes|in:active,pending,suspended',
            'roles' => 'sometimes|array|min:1',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $currentUser = $request->user();

        if (!$currentUser->hasRole(['system_admin', 'institution_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update users'
            ], 403);
        }

        if ($currentUser->hasRole('institution_admin') && !$currentUser->hasRole('system_admin')) {
            if ($user->institution_id !== $currentUser->institution_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update users from other institutions'
                ], 403);
            }
            unset($validated['institution_id']);
        }

        if (isset($validated['roles'])) {
            $roles = $validated['roles'];
            unset($validated['roles']);
        }

        $user->update($validated);

        if (isset($roles)) {
            $user->syncRoles($roles);
        }

        return response()->json([
            'success' => true,
            'data' => $user->load('roles', 'institution'),
            'message' => 'User updated successfully'
        ]);
    }

    public function destroy(User $user)
    {
        $currentUser = request()->user();

        if (!$currentUser->hasRole('system_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete users'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    public function roles()
    {
        $roles = Role::all();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }
}
