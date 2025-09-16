<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_tugas_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->date('tanggal_pengajuan');
            $table->string('kegiatan');
            $table->date('tanggal_kegiatan');
            $table->foreignId('pic_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nama_pendampingan');
            $table->unsignedBigInteger('fee_pendampingan');
            $table->string('instruktor_1_nama');
            $table->unsignedBigInteger('instruktor_1_fee');
            $table->string('instruktor_2_nama')->nullable();
            $table->unsignedBigInteger('instruktor_2_fee')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_tugas_submissions');
    }
};

