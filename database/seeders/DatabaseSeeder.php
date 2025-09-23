<?php

namespace Database\Seeders;

use App\Models\InvoiceSubmission;
use App\Models\SuratTugasSubmission;
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
                'name' => 'Supervisor',
                'email' => 'supervisor@example.com',
                'role' => 'Supervisor',
            ],
            [
                'name' => 'Manager',
                'email' => 'manager@example.com',
                'role' => 'Manager',
            ],
            [
                'name' => 'PIC Utama',
                'email' => 'pic@example.com',
                'role' => 'PIC',
            ],
            [
                'name' => 'Karyawan',
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

        $invoiceSeeds = [
            [
                'user_email' => 'karyawan@example.com',
                'tanggal_pengajuan' => now()->subDays(5)->toDateString(),
                'tanggal_invoice' => now()->subDays(4)->toDateString(),
                'kegiatan' => 'Pelatihan Digital Marketing',
                'tagihan_invoice' => 3_500_000,
                'total_invoice_ope' => 450_000,
                'ppn' => 'include',
            ],
            [
                'user_email' => 'pic@example.com',
                'tanggal_pengajuan' => now()->subDays(3)->toDateString(),
                'tanggal_invoice' => now()->subDays(2)->toDateString(),
                'kegiatan' => 'Workshop Pengembangan Produk',
                'tagihan_invoice' => 4_250_000,
                'total_invoice_ope' => 520_000,
                'ppn' => 'include',
            ],
        ];

        foreach ($invoiceSeeds as $seed) {
            $user = User::where('email', $seed['user_email'])->first();
            if (! $user) {
                continue;
            }

            InvoiceSubmission::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'kegiatan' => $seed['kegiatan'],
                    'tanggal_invoice' => $seed['tanggal_invoice'],
                ],
                [
                    'tanggal_pengajuan' => $seed['tanggal_pengajuan'],
                    'tagihan_invoice' => $seed['tagihan_invoice'],
                    'ppn' => $seed['ppn'],
                    'total_invoice_ope' => $seed['total_invoice_ope'],
                    'total_tagihan' => $seed['tagihan_invoice']
                        + ($seed['ppn'] === 'include' ? (int) round($seed['tagihan_invoice'] * 0.11) : 0)
                        + $seed['total_invoice_ope'],
                    'bukti_surat_konfirmasi' => 'invoices/konfirmasi/dummy.pdf',
                ]
            );
        }

        $suratTugasSeeds = [
            [
                'user_email' => 'karyawan@example.com',
                'tanggal_pengajuan' => now()->subDays(7)->toDateString(),
                'tanggal_kegiatan' => now()->addDays(3)->toDateString(),
                'kegiatan' => 'Pendampingan Implementasi Sistem',
                'pic_email' => 'pic@example.com',
                'nama_pendampingan' => 'Implementasi ERP',
                'fee_pendampingan' => 0,
                'instruktors' => [
                    ['nama' => 'Andi Saputra', 'fee' => 1_500_000],
                    ['nama' => 'Dewi Lestari', 'fee' => 1_250_000],
                ],
            ],
            [
                'user_email' => 'pic@example.com',
                'tanggal_pengajuan' => now()->subDays(4)->toDateString(),
                'tanggal_kegiatan' => now()->addDays(7)->toDateString(),
                'kegiatan' => 'Pelatihan Softskill Tim',
                'pic_email' => 'pic@example.com',
                'nama_pendampingan' => 'Coaching Teamwork',
                'fee_pendampingan' => 500_000,
                'instruktors' => [
                    ['nama' => 'Rudi Hartono', 'fee' => 900_000],
                ],
            ],
        ];

        foreach ($suratTugasSeeds as $seed) {
            $pengaju = User::where('email', $seed['user_email'])->first();
            $pic = User::where('email', $seed['pic_email'])->first();

            if (! $pengaju || ! $pic) {
                continue;
            }

            $instruktor1 = $seed['instruktors'][0] ?? ['nama' => null, 'fee' => 0];
            $instruktor2 = $seed['instruktors'][1] ?? ['nama' => null, 'fee' => 0];

            SuratTugasSubmission::updateOrCreate(
                [
                    'user_id' => $pengaju->id,
                    'kegiatan' => $seed['kegiatan'],
                    'tanggal_kegiatan' => $seed['tanggal_kegiatan'],
                ],
                [
                    'tanggal_pengajuan' => $seed['tanggal_pengajuan'],
                    'pic_id' => $pic->id,
                    'nama_pendampingan' => $seed['nama_pendampingan'],
                    'fee_pendampingan' => $seed['fee_pendampingan'],
                    'instruktor_1_nama' => $instruktor1['nama'],
                    'instruktor_1_fee' => $instruktor1['fee'],
                    'instruktor_2_nama' => $instruktor2['nama'],
                    'instruktor_2_fee' => $instruktor2['fee'],
                    'status' => 'pending',
                ]
            );
        }
    }
}
