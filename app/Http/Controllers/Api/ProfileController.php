<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * @OA\Get(
     *   path="/profile",
     *   summary="Get authenticated user profile",
     *   tags={"Profile"},
     *   security={{"sanctum":{}}},
     *   @OA\Response(
     *     response=200,
     *     description="Profile data",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="data", ref="#/components/schemas/UserProfile")
     *     )
     *   ),
     *   @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function show(Request $request)
    {
        $user = $request->user()->load('roles', 'institution');

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * @OA\Post(
     *   path="/profile",
     *   summary="Update user profile",
     *   tags={"Profile"},
     *   security={{"sanctum":{}}},
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\MediaType(
     *       mediaType="multipart/form-data",
     *       @OA\Schema(
     *         @OA\Property(property="first_name", type="string"),
     *         @OA\Property(property="last_name", type="string"),
     *         @OA\Property(property="email", type="string", format="email"),
     *         @OA\Property(property="phone", type="string"),
     *         @OA\Property(property="bio", type="string"),
     *         @OA\Property(property="address", type="string"),
     *         @OA\Property(property="city", type="string"),
     *         @OA\Property(property="country", type="string"),
     *         @OA\Property(property="gender", type="string", enum={"male","female","other","prefer_not_to_say"}),
     *         @OA\Property(property="date_of_birth", type="string", format="date"),
     *         @OA\Property(property="institution_id", type="integer"),
     *         @OA\Property(property="avatar", type="string", format="binary"),
     *         @OA\Property(property="_method", type="string", example="PUT")
     *       )
     *     )
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Profile updated",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="data", ref="#/components/schemas/UserProfile"),
     *       @OA\Property(property="message", type="string", example="Profile updated successfully")
     *     )
     *   ),
     *   @OA\Response(response=422, description="Validation error")
     * )
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other,prefer_not_to_say',
            'institution_id' => 'nullable|exists:institutions,id',
        ]);

        // Only system admins can change institution
        if (!$user->hasRole('system_admin')) {
            unset($validated['institution_id']);
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user->load('roles', 'institution'),
            'message' => 'Profile updated successfully'
        ]);
    }

    /**
     * @OA\Put(
     *   path="/profile/password",
     *   summary="Update user password",
     *   tags={"Profile"},
     *   security={{"sanctum":{}}},
     *   @OA\RequestBody(
     *     required=true,
     *     @OA\JsonContent(
     *       required={"current_password","password","password_confirmation"},
     *       @OA\Property(property="current_password", type="string", example="oldpassword"),
     *       @OA\Property(property="password", type="string", minLength=8, example="newpassword123"),
     *       @OA\Property(property="password_confirmation", type="string", example="newpassword123")
     *     )
     *   ),
     *   @OA\Response(
     *     response=200,
     *     description="Password updated successfully",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="message", type="string", example="Password updated successfully")
     *     )
     *   ),
     *   @OA\Response(response=422, description="Validation error or incorrect password")
     * )
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password'])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * @OA\Delete(
     *   path="/profile/avatar",
     *   summary="Delete user avatar",
     *   tags={"Profile"},
     *   security={{"sanctum":{}}},
     *   @OA\Response(
     *     response=200,
     *     description="Avatar deleted successfully",
     *     @OA\JsonContent(
     *       @OA\Property(property="success", type="boolean", example=true),
     *       @OA\Property(property="message", type="string", example="Avatar deleted successfully")
     *     )
     *   )
     * )
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Avatar deleted successfully'
        ]);
    }
}
