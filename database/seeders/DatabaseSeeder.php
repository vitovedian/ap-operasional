<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ensure base roles
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);

        // Rename legacy role 'User' to 'Karyawan' if exists
        $legacyUser = Role::where('name', 'User')->first();
        if ($legacyUser) {
            $legacyUser->name = 'Karyawan';
            $legacyUser->save();
        }

        $karyawanRole = Role::firstOrCreate(['name' => 'Karyawan']);
        Role::firstOrCreate(['name' => 'Manager Operasional']);
        Role::firstOrCreate(['name' => 'Manager Keuangan']);
        Role::firstOrCreate(['name' => 'PIC']);

        // Create a demo admin if not exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Ensure verified for existing admin
        if (is_null($admin->email_verified_at)) {
            $admin->forceFill(['email_verified_at' => now()])->save();
        }

        if (! $admin->hasRole('Admin')) {
            $admin->assignRole($adminRole);
        }
    }
}
