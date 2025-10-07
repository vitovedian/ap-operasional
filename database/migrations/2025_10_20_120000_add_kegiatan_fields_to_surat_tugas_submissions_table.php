<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('surat_tugas_submissions', function (Blueprint $table) {
            $table->string('jenis_kegiatan', 20)->default('offline')->after('kegiatan');
            $table->date('tanggal_kegiatan_berakhir')->nullable()->after('tanggal_kegiatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_tugas_submissions', function (Blueprint $table) {
            $table->dropColumn(['jenis_kegiatan', 'tanggal_kegiatan_berakhir']);
        });
    }
};

