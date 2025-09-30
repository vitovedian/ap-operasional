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
        Schema::table('invoice_submissions', function (Blueprint $table) {
            $table->foreignId('nomor_surat_submission_id')
                ->nullable()
                ->unique()
                ->constrained('nomor_surat_submissions')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nomor_surat_submission_id');
        });
    }
};
