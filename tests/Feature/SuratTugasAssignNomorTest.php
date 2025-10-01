<?php

namespace Tests\Feature;

use App\Models\NomorSuratSubmission;
use App\Models\SuratTugasSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SuratTugasAssignNomorTest extends TestCase
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
            Role::create(['name' => $role]);
        }
    }

    public function test_supervisor_can_assign_nomor_surat_to_surat_tugas(): void
    {
        $supervisor = User::factory()->create();
        $supervisor->assignRole('Supervisor');

        $creator = User::factory()->create();
        $creator->assignRole('Karyawan');

        $pic = User::factory()->create();
        $pic->assignRole('PIC');

        $suratTugas = SuratTugasSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-09-01',
            'kegiatan' => 'Pelatihan Internal',
            'tanggal_kegiatan' => '2024-09-10',
            'pic_id' => $pic->id,
            'nama_pendampingan' => 'Rahmatullah',
            'fee_pendampingan' => 250000,
            'instruktor_1_nama' => 'Instruktur A',
            'instruktor_1_fee' => 500000,
            'instruktor_2_nama' => null,
            'instruktor_2_fee' => 0,
            'status' => 'pending',
        ]);
        $suratTugas->pics()->sync([
            $pic->id => ['position' => 1],
        ]);

        $nomorSurat = NomorSuratSubmission::create([
            'user_id' => $creator->id,
            'tanggal_pengajuan' => '2024-08-25',
            'tujuan_surat' => 'Surat Penawaran',
            'nama_klien' => 'PT Contoh Sejahtera',
            'catatan' => 'Nomor untuk penawaran kerja sama.',
        ]);

        $response = $this->actingAs($supervisor)->post(route('surat-tugas.assign-nomor', $suratTugas), [
            'nomor_surat_submission_id' => $nomorSurat->id,
        ]);

        $response->assertRedirect();

        $this->assertEquals(
            $nomorSurat->id,
            $suratTugas->fresh()->nomor_surat_submission_id,
            'Nomor surat seharusnya tersimpan pada surat tugas.'
        );

        $this->actingAs($supervisor)
            ->get(route('surat-tugas.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('SuratTugas/Index')
                ->has('submissions.data', 1, fn (Assert $submission) => $submission
                    ->where('id', $suratTugas->id)
                    ->where('nomor_surat_submission_id', $nomorSurat->id)
                    ->where('nomor_surat', $nomorSurat->fresh()->formatted_nomor_surat)
                    ->etc()
                )
                ->has('nomorSuratOptions', fn (Assert $options) => $options
                    ->where('0.id', $nomorSurat->id)
                )
            );
    }
}
