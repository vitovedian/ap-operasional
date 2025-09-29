<?php

namespace Tests\Feature;

use App\Models\NomorSuratSubmission;
use App\Models\SuratTugasSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SuratTugasPdfDownloadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'Admin',
            'Manager',
            'Supervisor',
            'Karyawan',
            'PIC',
        ] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }

    public function test_supervisor_can_download_pdf_document(): void
    {
        $supervisor = User::factory()->create();
        $supervisor->assignRole('Supervisor');

        $creator = User::factory()->create();
        $creator->assignRole('Karyawan');

        $pic = User::factory()->create();
        $pic->assignRole('PIC');

        $nomorSurat = NomorSuratSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-20',
            'tujuan_surat' => 'Surat Penawaran',
            'nama_klien' => 'PT Harmoni Abadi',
            'catatan' => 'Nomor untuk keperluan penawaran.',
        ]);

        $suratTugas = SuratTugasSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-21',
            'kegiatan' => 'Workshop Pengembangan SDM',
            'tanggal_kegiatan' => '2024-10-02',
            'pic_id' => $pic->id,
            'nama_pendampingan' => 'Pendampingan SDM',
            'fee_pendampingan' => 350000,
            'instruktor_1_nama' => 'Instruktur Utama',
            'instruktor_1_fee' => 750000,
            'instruktor_2_nama' => 'Instruktur Pendamping',
            'instruktor_2_fee' => 300000,
            'status' => 'approved',
            'nomor_surat_submission_id' => $nomorSurat->id,
        ]);

        $response = $this->actingAs($supervisor)->get(route('surat-tugas.download', $suratTugas));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $contents = $response->streamedContent();

        $formattedNomor = $nomorSurat->fresh()->formatted_nomor_surat;

        $this->assertStringContainsString('SURAT TUGAS', $contents);
        $this->assertStringContainsString($formattedNomor, $contents);
        $this->assertStringContainsString('Workshop Pengembangan SDM', $contents);
        $this->assertStringContainsString('Pendampingan SDM', $contents);
    }

    public function test_pic_can_download_when_submission_is_approved_and_assigned(): void
    {
        $pic = User::factory()->create();
        $pic->assignRole('PIC');

        $creator = User::factory()->create();
        $creator->assignRole('Karyawan');

        $nomorSurat = NomorSuratSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-10',
            'tujuan_surat' => 'Surat Penawaran',
            'nama_klien' => 'PT Sukses Selalu',
            'catatan' => 'Nomor untuk penawaran proyek.',
        ]);

        $suratTugas = SuratTugasSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-12',
            'kegiatan' => 'Coaching Team Building',
            'tanggal_kegiatan' => '2024-09-25',
            'pic_id' => $pic->id,
            'nama_pendampingan' => 'Pendampingan Team Building',
            'fee_pendampingan' => 400000,
            'instruktor_1_nama' => 'Instruktur Senior',
            'instruktor_1_fee' => 600000,
            'instruktor_2_nama' => null,
            'instruktor_2_fee' => 0,
            'status' => 'approved',
            'nomor_surat_submission_id' => $nomorSurat->id,
        ]);

        $response = $this->actingAs($pic)->get(route('surat-tugas.download', $suratTugas));

        $response->assertOk();
    }

    public function test_pic_cannot_download_when_submission_not_approved(): void
    {
        $pic = User::factory()->create();
        $pic->assignRole('PIC');

        $creator = User::factory()->create();
        $creator->assignRole('Karyawan');

        $suratTugas = SuratTugasSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-12',
            'kegiatan' => 'Workshop Leadership',
            'tanggal_kegiatan' => '2024-09-30',
            'pic_id' => $pic->id,
            'nama_pendampingan' => 'Pendampingan Leadership',
            'fee_pendampingan' => 500000,
            'instruktor_1_nama' => 'Instruktur 1',
            'instruktor_1_fee' => 700000,
            'instruktor_2_nama' => null,
            'instruktor_2_fee' => 0,
            'status' => 'pending',
        ]);

        $this->actingAs($pic)
            ->get(route('surat-tugas.download', $suratTugas))
            ->assertForbidden();
    }

    public function test_pic_cannot_download_submission_of_other_pic(): void
    {
        $pic = User::factory()->create();
        $pic->assignRole('PIC');

        $otherPic = User::factory()->create();
        $otherPic->assignRole('PIC');

        $creator = User::factory()->create();
        $creator->assignRole('Karyawan');

        $suratTugas = SuratTugasSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-12',
            'kegiatan' => 'Pelatihan Softskill',
            'tanggal_kegiatan' => '2024-09-28',
            'pic_id' => $otherPic->id,
            'nama_pendampingan' => 'Pendampingan Softskill',
            'fee_pendampingan' => 450000,
            'instruktor_1_nama' => 'Instruktur A',
            'instruktor_1_fee' => 500000,
            'instruktor_2_nama' => null,
            'instruktor_2_fee' => 0,
            'status' => 'approved',
        ]);

        $this->actingAs($pic)
            ->get(route('surat-tugas.download', $suratTugas))
            ->assertForbidden();
    }
}
