<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpjSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pic_id',
        'nama_kegiatan',
        'tanggal_kegiatan',
        'durasi_nilai',
        'durasi_satuan',
        'nama_pendampingan',
        'jenis_kegiatan',
        'status',
        'catatan_revisi',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'tanggal_kegiatan' => 'date',
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

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}

