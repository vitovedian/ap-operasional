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
        'total_tagihan',
        'bukti_surat_konfirmasi',
        'nomor_surat_submission_id',
        'status',
        'manager_notes',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'tanggal_pengajuan' => 'date',
        'tanggal_invoice' => 'date',
        'tagihan_invoice' => 'decimal:2',
        'total_invoice_ope' => 'decimal:2',
        'total_tagihan' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function nomorSurat()
    {
        return $this->belongsTo(NomorSuratSubmission::class, 'nomor_surat_submission_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
