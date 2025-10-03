<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceOpeItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_submission_id',
        'deskripsi',
        'nominal',
    ];

    protected $casts = [
        'nominal' => 'int',
    ];

    public function invoice()
    {
        return $this->belongsTo(InvoiceSubmission::class, 'invoice_submission_id');
    }
}
