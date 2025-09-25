<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atk_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nama_pemesan');
            $table->string('nama_barang');
            $table->string('referensi')->nullable();
            $table->string('merek')->nullable();
            $table->unsignedInteger('quantity');
            $table->date('tanggal_pesan');
            $table->date('deadline');
            $table->string('kegiatan');
            $table->string('bank');
            $table->enum('budgeting', ['sudah_funding', 'belum_funding']);
            $table->longText('catatan')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('manager_note')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atk_requests');
    }
};
