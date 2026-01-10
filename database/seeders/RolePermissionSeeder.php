<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User management
            'view users',
            'create users',
            'edit users',
            'delete users',
            'suspend users',

            // Institution management
            'view institutions',
            'create institutions',
            'edit institutions',
            'delete institutions',
            'verify institutions',

            // Student management
            'view students',
            'create students',
            'edit students',
            'delete students',
            'approve students',

            // Donation management
            'view donations',
            'create donations',
            'refund donations',
            'view all donations',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Admin - has all permissions
        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        // Donor - can only donate and view
        $donor = Role::create(['name' => 'donor']);
        $donor->givePermissionTo([
            'view institutions',
            'view students',
            'create donations',
        ]);

        // Institution - can manage their students
        $institution = Role::create(['name' => 'institution']);
        $institution->givePermissionTo([
            'view students',
            'create students',
            'edit students',
            'view donations',
        ]);

        // Student - can view their profile
        $student = Role::create(['name' => 'student']);
        $student->givePermissionTo([
            'view donations',
        ]);
    }
}
