<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLoanSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nama_pemesan',
        'metode_kegiatan',
        'nama_kegiatan',
        'bank',
        'items',
        'quantity',
        'tanggal_pinjam',
        'status',
        'manager_note',
        'processed_by',
        'processed_at',
        'returned_at',
    ];

    protected $casts = [
        'items' => 'array',
        'tanggal_pinjam' => 'datetime',
        'processed_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
