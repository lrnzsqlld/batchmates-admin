<?php

namespace App\Http\Controllers\Api;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Batchmates API",
    description: "Multi-tenant alumni donation and campaign management system API"
)]
#[OA\Server(
    url: "http://localhost:8000",
    description: "Local Development Server"
)]
// 1. Bearer Token Scheme (for Mobile/Stateless)
#[OA\SecurityScheme(
    securityScheme: "BearerToken",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Use this for MOBILE testing (Token-based)"
)]
#[OA\SecurityScheme(
    securityScheme: "CookieCsrfToken",
    type: "apiKey",
    in: "header",
    name: "X-XSRF-TOKEN",
    description: "Use this for WEB testing (Session-based). Value must be the XSRF-TOKEN cookie value."
)]
abstract class Controller
{
    //
}
