# Batchmates Admin

Laravel + React + TypeScript admin panel for managing student donations and educational institutions.

## Tech Stack

- Laravel 12
- React 18 + TypeScript
- Vite
- Tailwind CSS 4
- PostgreSQL
- Laravel Sanctum (Auth)
- Spatie Laravel Permission (Roles)

## Features

- Separate Mobile (Token) and Web (Session) Authentication
- Role-based Access Control (Admin, Donor, Institution, Student)
- User Management
- Institution Verification
- Student Approval Workflow
- Donation Tracking & Refunds
- Multi-device Login Management

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+
- PostgreSQL 14+

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd batchmates-admin
```

### 2. Install Dependencies

```bash
composer install
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=batchmates_admin
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,127.0.0.1:5173,127.0.0.1:8000
```

### 4. Database Setup

```bash
php artisan migrate
php artisan db:seed --class=RolePermissionSeeder
```

### 5. Create Admin User

```bash
php artisan tinker
```

```php
$admin = \App\Models\User::create([
    'name' => 'Admin User',
    'email' => 'admin@example.com',
    'password' => bcrypt('password'),
    'status' => 'active',
]);
$admin->assignRole('admin');
exit
```

### 6. Run Application

Terminal 1:
```bash
php artisan serve
```

Terminal 2:
```bash
npm run dev
```

Visit: `http://localhost:8000`

## API Endpoints

### Mobile API (Token-based)

```
POST   /api/v1/mobile/auth/register
POST   /api/v1/mobile/auth/login
GET    /api/v1/mobile/auth/me
POST   /api/v1/mobile/auth/logout
POST   /api/v1/mobile/auth/logout-all
GET    /api/v1/mobile/auth/devices
DELETE /api/v1/mobile/auth/devices/{id}
```

### Web API (Session-based)

```
POST   /api/v1/web/auth/register
POST   /api/v1/web/auth/login
GET    /api/v1/web/auth/me
POST   /api/v1/web/auth/logout
```

## Testing

```bash
php artisan test
```

Run specific test suite:
```bash
php artisan test --filter MobileAuthTest
php artisan test --filter WebAuthTest
```

## Roles & Permissions

### Admin
Full access to all features

### Donor
- View institutions
- View students
- Create donations

### Institution
- View/Create/Edit students
- View donations

### Student
- View donations

## Project Structure

```
batchmates-admin/
├── app/
│   ├── Http/Controllers/
│   │   ├── MobileAuthController.php
│   │   └── WebAuthController.php
│   └── Models/
│       └── User.php
├── database/
│   ├── migrations/
│   └── seeders/
│       └── RoleAndPermissionSeeder.php
├── resources/
│   ├── js/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   └── admin/
│   │   ├── layouts/
│   │   ├── contexts/
│   │   └── app.tsx
│   └── css/
│       └── app.css
├── routes/
│   ├── api.php
│   └── web.php
└── tests/
    └── Feature/
        ├── MobileAuthTest.php
        └── WebAuthTest.php
```

## Development

### Build Assets

```bash
npm run build
```

### Run Tests with Coverage

```bash
php artisan test --coverage
```

### Clear Cache

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## License

MIT