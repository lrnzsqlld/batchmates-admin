<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class WebAuthController extends Controller
{
    #[OA\Post(
        path: "/api/v1/web/auth/register",
        summary: "Register a new user (Web)",
        tags: ["Web Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["first_name", "last_name", "email", "password", "password_confirmation"],
                properties: [
                    new OA\Property(property: "first_name", type: "string", example: "Juan"),
                    new OA\Property(property: "last_name", type: "string", example: "Dela Cruz"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "test@batchmates.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "role", type: "string", enum: ["donor", "institution_admin"], example: "donor")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "User registered successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "first_name", type: "string", example: "Juan"),
                                new OA\Property(property: "last_name", type: "string", example: "Dela Cruz"),
                                new OA\Property(property: "email", type: "string", example: "juan@example.com")
                            ]
                        ),
                        new OA\Property(property: "message", type: "string", example: "User registered successfully")
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error"
            )
        ]
    )]
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'active',
        ]);

        $user->assignRole('donor');


        Auth::login($user);

        return response()->json([
            'success' => true,
            'data' => $user->load('roles'),
            'message' => 'User registered successfully'
        ], 201);
    }

    #[OA\Post(
        path: "/api/v1/web/auth/login",
        summary: "Login user (Web)",
        tags: ["Web Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "admin@batchmates.com"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "password")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Login successful",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "email", type: "string", example: "admin@batchmates.com")
                            ]
                        ),
                        new OA\Property(property: "message", type: "string", example: "Logged in successfully")
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Invalid credentials"
            ),
            new OA\Response(
                response: 403,
                description: "Account suspended"
            )
        ]
    )]
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
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

        $user->update(['last_login_at' => now()]);

        Auth::login($user);

        return response()->json([
            'success' => true,
            'data' => $user->load('roles', 'permissions'),
            'message' => 'Logged in successfully'
        ]);
    }

    #[OA\Get(
        path: "/api/v1/web/auth/me",
        summary: "Get authenticated user",
        security: [["sanctum" => []]],
        tags: ["Web Authentication"],
        responses: [
            new OA\Response(
                response: 200,
                description: "User profile retrieved",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "object")
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: "Unauthenticated"
            )
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
        path: "/api/v1/web/auth/logout",
        summary: "Logout user",
        security: [["sanctum" => []]],
        tags: ["Web Authentication"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Logout successful"
            )
        ]
    )]
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
