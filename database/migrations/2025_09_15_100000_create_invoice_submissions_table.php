<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->date('tanggal_pengajuan');
            $table->date('tanggal_invoice');
            $table->string('kegiatan');
            $table->unsignedBigInteger('tagihan_invoice'); // stored in Rupiah
            $table->string('ppn', 20); // include | exclude | tanpa
            $table->unsignedBigInteger('total_invoice_ope'); // stored in Rupiah
            $table->string('bukti_surat_konfirmasi'); // path to uploaded PDF
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_submissions');
    }
};

