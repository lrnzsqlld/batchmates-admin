<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MobileAuthController;
use App\Http\Controllers\Api\WebAuthController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\CampaignApprovalController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\InstitutionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CommitteeBankAccountController;
use App\Http\Controllers\Api\MayaController;
use App\Http\Controllers\Api\PasswordResetController;

// Password reset (no auth required)
Route::prefix('v1/auth')->group(function () {
    Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);
    Route::post('verify-reset-token', [PasswordResetController::class, 'verifyToken']);
});

Route::prefix('v1')->group(function () {

    // Maya guest donation (no auth required)
    Route::post('maya/donate', [MayaController::class, 'guestDonate'])->name('maya.donate');

    // Maya callbacks (no auth required - called by Maya servers)
    Route::get('payments/maya/success', [MayaController::class, 'success'])->name('maya.success');
    Route::get('payments/maya/failure', [MayaController::class, 'failure'])->name('maya.failure');
    Route::get('payments/maya/cancel', [MayaController::class, 'cancel'])->name('maya.cancel');
    Route::post('payments/maya/webhook', [MayaController::class, 'webhook'])->name('maya.webhook');

    // PUBLIC: View campaigns (no auth required for browsing)
    Route::get('campaigns', [CampaignController::class, 'index']);
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show']);

    // PUBLIC: View institutions (no auth required)
    Route::get('institutions', [InstitutionController::class, 'index']);
    Route::get('institutions/{institution}', [InstitutionController::class, 'show']);

    // Mobile auth registration (no auth required)
    Route::prefix('mobile/auth')->group(function () {
        Route::post('register', [MobileAuthController::class, 'register']);
        Route::post('login', [MobileAuthController::class, 'login']);
    });

    // Web auth registration (no auth required)
    Route::prefix('web/auth')->group(function () {
        Route::post('register', [WebAuthController::class, 'register']);
        Route::post('login', [WebAuthController::class, 'login']);
    });

    // All authenticated routes
    Route::middleware('auth:sanctum')->group(function () {

        // Auth endpoints
        Route::get('auth/me', [WebAuthController::class, 'me']);
        Route::post('auth/logout', [WebAuthController::class, 'logout']);

        // Profile endpoints
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'updatePassword']);
        Route::delete('profile/avatar', [ProfileController::class, 'deleteAvatar']);

        // Donation endpoints
        Route::get('donations/stats', [DonationController::class, 'stats']);
        Route::get('donations/my', [DonationController::class, 'myDonations']);
        Route::get('donations/my/stats', [DonationController::class, 'myStats']);
        Route::apiResource('donations', DonationController::class)->only(['index', 'store', 'show']);

        // Maya payment for authenticated users
        Route::post('donations/{donation}/pay', [MayaController::class, 'initiateMayaPayment'])->name('donations.pay');

        // Campaign endpoints for authenticated users
        // IMPORTANT: Specific routes MUST come before dynamic {campaign} route
        Route::get('campaignStats', [CampaignController::class, 'stats']);
        Route::get('campaignStats/pending-review', [CampaignApprovalController::class, 'pending']);

        // Campaign CRUD (any authenticated user can create/edit their own)
        Route::post('campaigns', [CampaignController::class, 'store']);
        Route::put('campaigns/{campaign}', [CampaignController::class, 'update']);
        Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy']);

        // Mobile device management
        Route::prefix('mobile')->group(function () {
            Route::post('auth/logout-all', [MobileAuthController::class, 'logoutAll']);
            Route::get('auth/devices', [MobileAuthController::class, 'devices']);
            Route::delete('auth/devices/{tokenId}', [MobileAuthController::class, 'revokeDevice']);
        });

        Route::prefix('approval')->middleware('role:committee_member|system_admin')->group(function () {
            Route::post('campaigns/{campaign}/approve', [CampaignApprovalController::class, 'approve']);
            Route::post('campaigns/{campaign}/reject', [CampaignApprovalController::class, 'reject']);
            Route::post('campaigns/{campaign}/complete', [CampaignApprovalController::class, 'complete']);
            Route::post('campaigns/{campaign}/close', [CampaignApprovalController::class, 'close']);
            Route::get('campaigns/{campaign}/history', [CampaignApprovalController::class, 'history']);
        });




        // Admin-only routes
        Route::middleware('role:system_admin')->group(function () {

            // Institution management
            Route::get('institutions/{institution}/stats', [InstitutionController::class, 'stats']);
            Route::post('institutions', [InstitutionController::class, 'store']);
            Route::put('institutions/{institution}', [InstitutionController::class, 'update']);
            Route::delete('institutions/{institution}', [InstitutionController::class, 'destroy']);


            // User management
            Route::get('roles', [UserController::class, 'roles']);
            Route::apiResource('users', UserController::class);

            // Committee bank accounts
            Route::prefix('committee-bank-accounts')->group(function () {
                Route::get('/', [CommitteeBankAccountController::class, 'index']);
                Route::post('/', [CommitteeBankAccountController::class, 'store']);
                Route::get('/{id}', [CommitteeBankAccountController::class, 'show']);
                Route::put('/{id}', [CommitteeBankAccountController::class, 'update']);
                Route::delete('/{id}', [CommitteeBankAccountController::class, 'destroy']);
                Route::post('/{id}/set-primary', [CommitteeBankAccountController::class, 'setPrimary']);
                Route::get('/primary/get', [CommitteeBankAccountController::class, 'getPrimary']);
                Route::get('/active/list', [CommitteeBankAccountController::class, 'getActive']);
            });
        });
    });
});
