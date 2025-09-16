<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_tugas_submissions', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('instruktor_2_fee');
            $table->text('catatan_revisi')->nullable()->after('status');
            $table->foreignId('processed_by')->nullable()->after('catatan_revisi')->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable()->after('processed_by');
        });
    }

    public function down(): void
    {
        Schema::table('surat_tugas_submissions', function (Blueprint $table) {
            $table->dropColumn(['status', 'catatan_revisi', 'processed_by', 'processed_at']);
        });
    }
};

