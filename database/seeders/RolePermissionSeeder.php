<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'manage institutions',
            'manage system settings',
            'manage alumni committees',
            'assign committee members',
            'manage bank accounts',
            'view users',
            'create users',
            'edit users',
            'delete users',
            'suspend users',
            'view campaigns',
            'create campaigns',
            'edit campaigns',
            'delete campaigns',
            'approve campaigns',
            'reject campaigns',
            'view donations',
            'create donations',
            'approve donations',
            'refund donations',
            'view withdrawals',
            'create withdrawals',
            'approve withdrawals',
            'release withdrawals',
            'view audit logs',
            'view profile',
            'edit profile',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        $systemAdmin = Role::create(['name' => 'system_admin']);
        $systemAdmin->givePermissionTo(Permission::all());

        $institutionAdmin = Role::create(['name' => 'institution_admin']);
        $institutionAdmin->givePermissionTo([
            'manage alumni committees',
            'assign committee members',
            'manage bank accounts',
            'view users',
            'create users',
            'edit users',
            'suspend users',
            'view campaigns',
            'create campaigns',
            'edit campaigns',
            'delete campaigns',
            'approve campaigns',
            'reject campaigns',
            'view donations',
            'view withdrawals',
            'create withdrawals',
            'view audit logs',
            'view profile',
            'edit profile',
        ]);

        $committeeMember = Role::create(['name' => 'committee_member']);
        $committeeMember->givePermissionTo([
            'view campaigns',
            'approve campaigns',
            'reject campaigns',
            'view donations',
            'view withdrawals',
            'create withdrawals',
            'approve withdrawals',
            'view profile',
            'edit profile',
        ]);

        $donor = Role::create(['name' => 'donor']);
        $donor->givePermissionTo([
            'view campaigns',
            'create campaigns',
            'create donations',
            'view profile',
            'edit profile',
        ]);
    }
}
