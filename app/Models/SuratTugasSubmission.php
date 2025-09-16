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
        'tanggal_kegiatan',
        'pic_id',
        'nama_pendampingan',
        'fee_pendampingan',
        'instruktor_1_nama',
        'instruktor_1_fee',
        'instruktor_2_nama',
        'instruktor_2_fee',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pic()
    {
        return $this->belongsTo(User::class, 'pic_id');
    }
}

