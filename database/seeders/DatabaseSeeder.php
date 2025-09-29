<?php

namespace Database\Seeders;

use App\Models\InvoiceSubmission;
use App\Models\SuratTugasSubmission;
use App\Models\InventoryLoanSubmission;
use App\Models\AtkRequest;
use App\Models\SpjSubmission;
use App\Models\NomorSuratSubmission;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

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
                'name' => 'PIC Finance',
                'email' => 'pic.finance@example.com',
                'role' => 'PIC',
            ],
            [
                'name' => 'PIC Operasional',
                'email' => 'pic.operasional@example.com',
                'role' => 'PIC',
            ],
            [
                'name' => 'PIC Kegiatan',
                'email' => 'pic.kegiatan@example.com',
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

        $atkSeeds = [
            [
                'user_email' => 'pic@example.com',
                'nama_pemesan' => 'Dewi Lestari',
                'nama_barang' => 'Pulpen Gel 0.5mm',
                'referensi' => 'https://contoh.toko/pulpen-gel',
                'merek' => 'Snowman',
                'quantity' => 24,
                'tanggal_pesan' => now()->subDays(3)->toDateString(),
                'deadline' => now()->addDays(1)->toDateString(),
                'kegiatan' => 'Workshop Pengelolaan Dokumen',
                'bank' => 'BCA',
                'budgeting' => 'belum_funding',
                'catatan' => 'Perlengkapan peserta workshop.',
                'status' => 'pending',
            ],
            [
                'user_email' => 'karyawan@example.com',
                'nama_pemesan' => 'Rudi Hartono',
                'nama_barang' => 'Notebook A5',
                'referensi' => null,
                'merek' => 'Campus',
                'quantity' => 40,
                'tanggal_pesan' => now()->subDays(7)->toDateString(),
                'deadline' => now()->subDays(2)->toDateString(),
                'kegiatan' => 'Pelatihan Softskill Tim',
                'bank' => 'Mandiri',
                'budgeting' => 'sudah_funding',
                'catatan' => 'Disiapkan untuk peserta pelatihan.',
                'status' => 'approved',
                'processed_by_email' => 'manager@example.com',
                'processed_at' => now()->subDays(2),
            ],
            [
                'user_email' => 'pic@example.com',
                'nama_pemesan' => 'Andi Saputra',
                'nama_barang' => 'Tinta Printer',
                'referensi' => 'https://contoh.toko/tinta-printer',
                'merek' => 'Epson',
                'quantity' => 4,
                'tanggal_pesan' => now()->subDays(10)->toDateString(),
                'deadline' => now()->subDays(5)->toDateString(),
                'kegiatan' => 'Cetak Modul Pelatihan',
                'bank' => 'BNI',
                'budgeting' => 'belum_funding',
                'catatan' => 'Printer kantor kehabisan tinta.',
                'status' => 'rejected',
                'processed_by_email' => 'manager@example.com',
                'processed_at' => now()->subDays(5),
                'manager_note' => 'Gunakan stok cadangan di gudang terlebih dahulu.',
            ],
            [
                'user_email' => 'karyawan@example.com',
                'nama_pemesan' => 'Sari Putri',
                'nama_barang' => 'Map Arsip Warna',
                'referensi' => null,
                'merek' => 'Sinar Dunia',
                'quantity' => 50,
                'tanggal_pesan' => now()->subDays(15)->toDateString(),
                'deadline' => now()->subDays(10)->toDateString(),
                'kegiatan' => 'Audit Internal',
                'bank' => 'BRI',
                'budgeting' => 'sudah_funding',
                'catatan' => 'Dibutuhkan untuk pengarsipan dokumen audit.',
                'status' => 'completed',
                'processed_by_email' => 'admin@example.com',
                'processed_at' => now()->subDays(11),
                'completed_at' => now()->subDays(1),
            ],
        ];

        foreach ($atkSeeds as $seed) {
            $user = User::where('email', $seed['user_email'])->first();
            if (! $user) {
                continue;
            }

            $processorId = null;
            if (! empty($seed['processed_by_email'])) {
                $processor = User::where('email', $seed['processed_by_email'])->first();
                $processorId = $processor?->id;
            }

            AtkRequest::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'nama_barang' => $seed['nama_barang'],
                    'tanggal_pesan' => $seed['tanggal_pesan'],
                ],
                [
                    'nama_pemesan' => $seed['nama_pemesan'],
                    'referensi' => $seed['referensi'] ?? null,
                    'merek' => $seed['merek'] ?? null,
                    'quantity' => $seed['quantity'],
                    'deadline' => $seed['deadline'],
                    'kegiatan' => $seed['kegiatan'],
                    'bank' => $seed['bank'],
                    'budgeting' => $seed['budgeting'],
                    'catatan' => $seed['catatan'] ?? null,
                    'status' => $seed['status'],
                    'manager_note' => $seed['manager_note'] ?? null,
                    'processed_by' => $processorId,
                    'processed_at' => $seed['processed_at'] ?? null,
                    'completed_at' => $seed['completed_at'] ?? null,
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

        $inventoryLoanSeeds = [
            [
                'user_email' => 'karyawan@example.com',
                'nama_pemesan' => 'Karyawan',
                'metode_kegiatan' => 'offline',
                'nama_kegiatan' => 'Maintenance Ruang Meeting',
                'bank' => 'BCA',
                'items' => [
                    ['type' => 'alat', 'label' => 'Proyektor Full HD'],
                    ['type' => 'ruangan', 'label' => 'Ruang Rapat Lantai 2'],
                ],
                'quantity' => 2,
                'catatan' => 'Butuh perangkat siap sebelum pukul 08.30.',
                'tanggal_pinjam' => now()->addDays(3)->toDateString(),
                'status' => 'pending',
            ],
            [
                'user_email' => 'pic@example.com',
                'nama_pemesan' => 'PIC Utama',
                'metode_kegiatan' => 'online',
                'nama_kegiatan' => 'Webinar Onboarding Klien',
                'bank' => 'Mandiri',
                'items' => [
                    ['type' => 'akun_zoom', 'label' => 'Akun Zoom Pro'],
                    ['type' => 'alat', 'label' => 'Headset Noise Cancelling'],
                ],
                'quantity' => 1,
                'catatan' => 'Durasi kegiatan 3 jam, mohon aktivasi akun 30 menit sebelum mulai.',
                'tanggal_pinjam' => now()->subDays(5)->toDateString(),
                'status' => 'approved',
                'processed_by_email' => 'manager@example.com',
                'processed_at' => now()->subDays(4),
            ],
            [
                'user_email' => 'karyawan@example.com',
                'nama_pemesan' => 'Karyawan',
                'metode_kegiatan' => 'offline',
                'nama_kegiatan' => 'Sesi Pelatihan Internal',
                'bank' => 'BRI',
                'items' => [
                    ['type' => 'alat', 'label' => 'Laptop Cadangan'],
                    ['type' => 'barang', 'label' => 'Papan Tulis Besar'],
                ],
                'quantity' => 3,
                'catatan' => 'Inventaris dikembalikan pada hari yang sama.',
                'tanggal_pinjam' => now()->subDays(10)->toDateString(),
                'status' => 'completed',
                'processed_by_email' => 'manager@example.com',
                'processed_at' => now()->subDays(9),
                'returned_at' => now()->subDays(9)->addHours(6),
            ],
        ];

        foreach ($inventoryLoanSeeds as $seed) {
            $pengaju = User::where('email', $seed['user_email'])->first();
            $processor = isset($seed['processed_by_email'])
                ? User::where('email', $seed['processed_by_email'])->first()
                : null;

            if (! $pengaju) {
                continue;
            }

            $tanggalPinjam = Carbon::parse($seed['tanggal_pinjam'], config('app.timezone'))->setTime(9, 0);

            InventoryLoanSubmission::updateOrCreate(
                [
                    'user_id' => $pengaju->id,
                    'nama_kegiatan' => $seed['nama_kegiatan'],
                    'tanggal_pinjam' => $tanggalPinjam,
                ],
                [
                    'nama_pemesan' => $seed['nama_pemesan'],
                    'metode_kegiatan' => $seed['metode_kegiatan'],
                    'bank' => $seed['bank'],
                    'items' => $seed['items'],
                    'quantity' => $seed['quantity'],
                    'catatan' => $seed['catatan'] ?? null,
                    'status' => $seed['status'],
                    'processed_by' => $processor?->id,
                    'processed_at' => $seed['processed_at'] ?? null,
                    'returned_at' => $seed['returned_at'] ?? null,
                ]
            );
        }
    }
}
