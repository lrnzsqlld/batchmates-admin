<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */
    'maya' => [
        'public_key' => env('MAYA_PUBLIC_KEY', ''),
        'secret_key' => env('MAYA_SECRET_KEY', ''),
        'environment' => env('MAYA_ENVIRONMENT', 'sandbox'),
    ],

    'maya_sandbox' => [
        'public_key' => 'pk-Z0OSzLvIcOI2UIvDhdTGVVfRSSeiGStnceqwUE7n0Ah',
        'secret_key' => 'sk-X8qolYjy62kIzEbr0QRK1h4b4KDVHaNrVPWYy0YpPW4',
    ],

    'app' => [
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    ],


    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
