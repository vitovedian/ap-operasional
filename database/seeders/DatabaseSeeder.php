<?php

namespace Database\Seeders;

use App\Models\InvoiceSubmission;
use App\Models\SuratTugasSubmission;
use App\Models\SpjSubmission;
use App\Models\NomorSuratSubmission;
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

        $spjSeeds = [
            [
                'user_email' => 'karyawan@example.com',
                'pic_email' => 'pic@example.com',
                'nama_kegiatan' => 'Monitoring Implementasi Sistem',
                'tanggal_kegiatan' => now()->addDays(10)->toDateString(),
                'durasi_nilai' => 3,
                'durasi_satuan' => 'hari',
                'nama_pendampingan' => 'Implementasi ERP',
                'jenis_kegiatan' => 'offline',
                'status' => 'pending',
                'form_serah_terima_path' => 'spj/form-serah-terima/dummy.pdf',
            ],
            [
                'user_email' => 'pic@example.com',
                'pic_email' => 'manager@example.com',
                'nama_kegiatan' => 'Evaluasi Pasca Pelatihan',
                'tanggal_kegiatan' => now()->subDays(6)->toDateString(),
                'durasi_nilai' => 2,
                'durasi_satuan' => 'hari',
                'nama_pendampingan' => 'Coaching Teamwork',
                'jenis_kegiatan' => 'online',
                'status' => 'approved',
                'processed_by' => 'manager@example.com',
                'processed_at' => now()->subDays(4),
                'form_serah_terima_path' => 'spj/form-serah-terima/dummy.pdf',
            ],
        ];

        foreach ($spjSeeds as $seed) {
            $pengaju = User::where('email', $seed['user_email'])->first();
            $pic = User::where('email', $seed['pic_email'])->first();
            $processor = isset($seed['processed_by']) ? User::where('email', $seed['processed_by'])->first() : null;

            if (! $pengaju || ! $pic) {
                continue;
            }

            SpjSubmission::updateOrCreate(
                [
                    'user_id' => $pengaju->id,
                    'nama_kegiatan' => $seed['nama_kegiatan'],
                    'tanggal_kegiatan' => $seed['tanggal_kegiatan'],
                ],
                [
                    'pic_id' => $pic->id,
                    'durasi_nilai' => $seed['durasi_nilai'],
                    'durasi_satuan' => $seed['durasi_satuan'],
                    'nama_pendampingan' => $seed['nama_pendampingan'],
                    'jenis_kegiatan' => $seed['jenis_kegiatan'],
                    'form_serah_terima_path' => $seed['form_serah_terima_path'],
                    'status' => $seed['status'],
                    'processed_by' => $processor?->id,
                    'processed_at' => $seed['processed_at'] ?? null,
                ]
            );
        }

        $nomorSuratSeeds = [
            [
                'user_email' => 'karyawan@example.com',
                'tanggal_pengajuan' => now()->subDays(8)->toDateString(),
                'tujuan_surat' => 'Permohonan Kerja Sama',
                'nama_klien' => 'PT Sumber Sejati',
                'catatan' => 'Pengajuan nomor surat untuk proposal kerja sama jangka panjang.',
            ],
            [
                'user_email' => 'pic@example.com',
                'tanggal_pengajuan' => now()->subDays(2)->toDateString(),
                'tujuan_surat' => 'Undangan Pelatihan',
                'nama_klien' => 'CV Maju Bersama',
                'catatan' => 'Mengundang klien untuk mengikuti sesi pelatihan tindak lanjut.',
            ],
        ];

        foreach ($nomorSuratSeeds as $seed) {
            $pengaju = User::where('email', $seed['user_email'])->first();

            if (! $pengaju) {
                continue;
            }

            NomorSuratSubmission::updateOrCreate(
                [
                    'user_id' => $pengaju->id,
                    'tujuan_surat' => $seed['tujuan_surat'],
                    'nama_klien' => $seed['nama_klien'],
                ],
                [
                    'tanggal_pengajuan' => $seed['tanggal_pengajuan'],
                    'catatan' => $seed['catatan'],
                ]
            );
        }
    }
}
