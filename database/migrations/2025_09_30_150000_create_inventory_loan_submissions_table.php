<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_loan_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nama_pemesan');
            $table->enum('metode_kegiatan', ['online', 'offline']);
            $table->string('nama_kegiatan');
            $table->string('bank');
            $table->json('items');
            $table->unsignedInteger('quantity');
            $table->timestamp('tanggal_pinjam');
            $table->string('status', 20)->default('pending');
            $table->text('manager_note')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamps();

            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_loan_submissions');
    }
};
