<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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

    protected $casts = [
        'tanggal_pengajuan' => 'date',
    ];

    protected $appends = ['formatted_nomor_surat'];

    public function getFormattedNomorSuratAttribute(): ?string
    {
        if (! $this->id || ! $this->tanggal_pengajuan) {
            return null;
        }

        $initials = $this->buildTujuanInitials($this->tujuan_surat);
        $monthRoman = $this->romanMonth((int) $this->tanggal_pengajuan->format('n'));
        $year = $this->tanggal_pengajuan->format('Y');

        return sprintf('%d/SPP-%s/%s/%s', $this->id, $initials, $monthRoman, $year);
    }

    private function buildTujuanInitials(?string $tujuan): string
    {
        if (! $tujuan) {
            return 'XX';
        }

        $tujuan = Str::upper($tujuan);
        $words = preg_split('/\s+/', $tujuan) ?: [];

        $initials = '';
        foreach ($words as $word) {
            $letter = preg_replace('/[^A-Z]/', '', (string) Str::of($word)->substr(0, 1));
            if ($letter) {
                $initials .= $letter;
            }

            if (strlen($initials) >= 2) {
                break;
            }
        }

        if (strlen($initials) < 2) {
            $fallback = preg_replace('/[^A-Z]/', '', $tujuan);
            $initials = (string) Str::of($initials . $fallback)->substr(0, 2);
        }

        return Str::padRight($initials, 2, 'X');
    }

    private function romanMonth(int $month): string
    {
        $mapping = [
            1 => 'I',
            2 => 'II',
            3 => 'III',
            4 => 'IV',
            5 => 'V',
            6 => 'VI',
            7 => 'VII',
            8 => 'VIII',
            9 => 'IX',
            10 => 'X',
            11 => 'XI',
            12 => 'XII',
        ];

        return $mapping[$month] ?? 'I';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function suratTugas()
    {
        return $this->hasOne(SuratTugasSubmission::class, 'nomor_surat_submission_id');
    }
}
