<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MobileAuthController;
use App\Http\Controllers\WebAuthController;

Route::prefix('v1')->group(function () {

    Route::prefix('mobile')->group(function () {
        Route::post('auth/register', [MobileAuthController::class, 'register']);
        Route::post('auth/login', [MobileAuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('auth/me', [MobileAuthController::class, 'me']);
            Route::post('auth/logout', [MobileAuthController::class, 'logout']);
            Route::post('auth/logout-all', [MobileAuthController::class, 'logoutAll']);
            Route::get('auth/devices', [MobileAuthController::class, 'devices']);
            Route::delete('auth/devices/{tokenId}', [MobileAuthController::class, 'revokeDevice']);
        });
    });

    Route::prefix('web')->group(function () {
        Route::post('auth/register', [WebAuthController::class, 'register']);
        Route::post('auth/login', [WebAuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('auth/me', [WebAuthController::class, 'me']);
            Route::post('auth/logout', [WebAuthController::class, 'logout']);
        });
    });
});
