# Batchmates Admin

> Admin panel for managing student donations and educational institutions

## Tech Stack

- **Backend:** Laravel 12 + Laravel Sanctum
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** MySQL/PostgreSQL

## Features

✅ Admin dashboard with analytics
✅ User management (CRUD, suspend, activate)
✅ Institution verification system
✅ Student approval workflow
✅ Donation management and refunds
✅ Mobile-ready REST API
✅ Token-based authentication
✅ Role-based access control

## Quick Start

```bash
# Install dependencies
composer install
npm install

# Configure environment
cp .env.example .env
php artisan key:generate

# Setup database (edit .env first)
php artisan migrate

# Create admin user
php artisan tinker
# Then: \App\Models\User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password'), 'role' => 'admin', 'status' => 'active']);

# Start servers
php artisan serve      # Terminal 1
npm run dev            # Terminal 2
```

Visit: **http://localhost:8000**

## Documentation

See [SETUP.md](SETUP.md) for detailed installation instructions.

## License

MIT
