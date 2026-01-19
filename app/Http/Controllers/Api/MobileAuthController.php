<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Mobile Auth", description: "Mobile-specific authentication using Bearer Tokens")]
class MobileAuthController extends Controller
{
    #[OA\Post(
        path: "/api/v1/mobile/auth/register",
        summary: "Register a new mobile user",
        tags: ["Mobile Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["first_name", "last_name", "email", "password", "password_confirmation", "device_name"],
                properties: [
                    new OA\Property(property: "first_name", type: "string", example: "John"),
                    new OA\Property(property: "last_name", type: "string", example: "Doe"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "john@example.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "device_name", type: "string", example: "iPhone 15"),
                    new OA\Property(property: "device_token", type: "string", nullable: true, example: "fcm_token_xyz"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "User registered successfully"),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'device_name' => 'required|string',
            'device_token' => 'nullable|string',
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'active',
            'device_token' => $validated['device_token'] ?? null,
        ]);

        $user->assignRole('donor');

        $token = $user->createToken($validated['device_name'])->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('roles'),
                'token' => $token
            ],
            'message' => 'User registered successfully'
        ], 201);
    }

    #[OA\Post(
        path: "/api/v1/mobile/auth/login",
        summary: "Login via mobile and get a Bearer token",
        tags: ["Mobile Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password", "device_name"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "john@example.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "device_name", type: "string", example: "Google Pixel 8"),
                    new OA\Property(property: "device_token", type: "string", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Login successful"),
            new OA\Response(response: 401, description: "Invalid credentials"),
            new OA\Response(response: 403, description: "Account suspended")
        ]
    )]
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required|string',
            'device_token' => 'nullable|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is suspended or pending approval'
            ], 403);
        }

        if (isset($validated['device_token'])) {
            $user->update(['device_token' => $validated['device_token']]);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken($validated['device_name'])->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('roles', 'permissions'),
                'token' => $token
            ],
            'message' => 'Logged in successfully'
        ]);
    }

    #[OA\Get(
        path: "/api/v1/mobile/auth/me",
        summary: "Get authenticated user profile",
        tags: ["Mobile Auth"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "User details returned")
        ]
    )]
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()->load('roles', 'permissions')
        ]);
    }

    #[OA\Post(
        path: "/api/v1/mobile/auth/logout",
        summary: "Logout current device",
        tags: ["Mobile Auth"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Logged out")
        ]
    )]
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    #[OA\Get(
        path: "/api/v1/mobile/auth/devices",
        summary: "List all active device tokens",
        tags: ["Mobile Auth"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "List of devices")
        ]
    )]
    public function devices(Request $request)
    {
        $devices = $request->user()->tokens()->get()->map(function ($token) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $devices
        ]);
    }

    #[OA\Delete(
        path: "/api/v1/mobile/auth/devices/{tokenId}",
        summary: "Revoke a specific device token",
        tags: ["Mobile Auth"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "tokenId", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Device revoked")
        ]
    )]
    public function revokeDevice(Request $request, $tokenId)
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device revoked successfully'
        ]);
    }
}
