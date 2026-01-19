<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Password Reset",
    description: "Password recovery endpoints"
)]
class PasswordResetController extends Controller
{
    #[OA\Post(
        path: "/api/v1/auth/forgot-password",
        summary: "Request password reset",
        description: "Sends password reset link to user's email",
        tags: ["Password Reset"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "user@example.com")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Reset link sent",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Password reset link sent to your email")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error")
        ]
    )]
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Check if user exists
        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        // But only send email if user exists
        if ($user) {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Password reset link sent to your email'
                ]);
            }
        }

        // Return success even if email doesn't exist (security)
        return response()->json([
            'message' => 'If that email exists, a password reset link has been sent'
        ]);
    }

    #[OA\Post(
        path: "/api/v1/auth/reset-password",
        summary: "Reset password",
        description: "Resets password using token from email",
        tags: ["Password Reset"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "token", "password", "password_confirmation"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "user@example.com"),
                    new OA\Property(property: "token", type: "string", example: "abc123..."),
                    new OA\Property(property: "password", type: "string", format: "password", example: "newpassword123"),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password", example: "newpassword123")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Password reset successful",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Password has been reset successfully")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Invalid token or validation error")
        ]
    )]
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password has been reset successfully'
            ]);
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }

    #[OA\Post(
        path: "/api/v1/auth/verify-reset-token",
        summary: "Verify reset token",
        description: "Checks if password reset token is valid (optional endpoint for better UX)",
        tags: ["Password Reset"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "token"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email"),
                    new OA\Property(property: "token", type: "string")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Token is valid"),
            new OA\Response(response: 422, description: "Token is invalid or expired")
        ]
    )]
    public function verifyToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid token'
            ], 422);
        }

        // Check if token exists and is not expired
        $tokenExists = Password::tokenExists($user, $request->token);

        if ($tokenExists) {
            return response()->json([
                'valid' => true,
                'message' => 'Token is valid'
            ]);
        }

        return response()->json([
            'valid' => false,
            'message' => 'Token is invalid or expired'
        ], 422);
    }
}
