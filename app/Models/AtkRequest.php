<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AtkRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nama_pemesan',
        'nama_barang',
        'referensi',
        'merek',
        'quantity',
        'tanggal_pesan',
        'deadline',
        'kegiatan',
        'bank',
        'budgeting',
        'catatan',
        'status',
        'manager_note',
        'processed_by',
        'processed_at',
        'completed_at',
    ];

    protected $casts = [
        'tanggal_pesan' => 'date',
        'deadline' => 'date',
        'processed_at' => 'datetime',
        'completed_at' => 'datetime',
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
