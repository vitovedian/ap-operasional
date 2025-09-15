<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tanggal_pengajuan',
        'tanggal_invoice',
        'kegiatan',
        'tagihan_invoice',
        'ppn',
        'total_invoice_ope',
        'bukti_surat_konfirmasi',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
