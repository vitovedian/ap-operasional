<?php

namespace App\Http\Controllers;

use App\Models\SuratTugasSubmission;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PdfTestController extends \App\Http\Controllers\Controller
{
    public function test()
    {
        $suratTugas = new SuratTugasSubmission();
        $suratTugas->id = 999;
        $suratTugas->kegiatan = "Test Kegiatan";
        $suratTugas->tanggal_pengajuan = now();
        $suratTugas->tanggal_kegiatan = now()->addDays(7);
        $suratTugas->nama_pendampingan = "Test Pendamping";
        $suratTugas->fee_pendampingan = 1000000;
        $suratTugas->instruktor_1_nama = "Instruktur 1";
        $suratTugas->instruktor_1_fee = 500000;
        $suratTugas->instruktor_2_nama = "Instruktur 2";
        $suratTugas->instruktor_2_fee = 400000;
        $suratTugas->status = "approved";
        $suratTugas->created_at = now();
        
        $pdf = Pdf::loadView('pdf.surat-tugas', ['suratTugas' => $suratTugas]);
        return $pdf->download('test-surat-tugas.pdf');
    }
}