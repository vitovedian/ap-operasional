<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratTugasSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tanggal_pengajuan',
        'kegiatan',
        'jenis_kegiatan',
        'tanggal_kegiatan',
        'tanggal_kegiatan_berakhir',
        'pic_id',
        'nama_pendampingan',
        'fee_pendampingan',
        'instruktor_1_nama',
        'instruktor_1_fee',
        'instruktor_2_nama',
        'instruktor_2_fee',
        'instruktor_3_nama',
        'instruktor_3_fee',
        'instruktor_4_nama',
        'instruktor_4_fee',
        'instruktor_5_nama',
        'instruktor_5_fee',
        'status',
        'catatan_revisi',
        'processed_by',
        'processed_at',
        'nomor_surat_submission_id',
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
        'tanggal_kegiatan' => 'date',
        'tanggal_kegiatan_berakhir' => 'date',
        'processed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_id');
    }

    public function pics()
    {
        return $this
            ->belongsToMany(User::class, 'surat_tugas_submission_pic', 'surat_tugas_submission_id', 'pic_id')
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('surat_tugas_submission_pic.position');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function nomorSurat()
    {
        return $this->belongsTo(NomorSuratSubmission::class, 'nomor_surat_submission_id');
    }
}
