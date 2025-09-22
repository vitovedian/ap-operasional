<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NomorSuratSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tanggal_pengajuan',
        'tujuan_surat',
        'nama_klien',
        'catatan',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

