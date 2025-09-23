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
        // Ensure required roles exist and drop legacy roles that are no longer used
        $roles = collect(['Karyawan', 'PIC', 'Supervisor', 'Manager', 'Admin']);
        $roles->each(fn (string $name) => Role::firstOrCreate(['name' => $name]));

        Role::query()
            ->whereNotIn('name', $roles->all())
            ->delete();

        $defaultUsers = [
            [
                'name' => 'Administrator',
                'email' => 'admin@example.com',
                'role' => 'Admin',
            ],
            [
                'name' => 'Supervisor Operasional',
                'email' => 'supervisor@example.com',
                'role' => 'Supervisor',
            ],
            [
                'name' => 'Manager Keuangan',
                'email' => 'manager@example.com',
                'role' => 'Manager',
            ],
            [
                'name' => 'PIC Utama',
                'email' => 'pic@example.com',
                'role' => 'PIC',
            ],
            [
                'name' => 'Karyawan Operasional',
                'email' => 'karyawan@example.com',
                'role' => 'Karyawan',
            ],
        ];

        foreach ($defaultUsers as $seedData) {
            $user = User::updateOrCreate(
                ['email' => $seedData['email']],
                [
                    'name' => $seedData['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            if (! $user->hasRole($seedData['role'])) {
                $user->syncRoles([$seedData['role']]);
            }
        }
    }
}
