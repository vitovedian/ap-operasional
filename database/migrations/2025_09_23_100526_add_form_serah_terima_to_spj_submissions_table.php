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
        Schema::table('spj_submissions', function (Blueprint $table) {
            $table->string('form_serah_terima_path')->nullable()->after('jenis_kegiatan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spj_submissions', function (Blueprint $table) {
            $table->dropColumn('form_serah_terima_path');
        });
    }
};
