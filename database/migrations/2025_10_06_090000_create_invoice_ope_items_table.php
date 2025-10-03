<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_ope_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_submission_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('deskripsi');
            $table->unsignedBigInteger('nominal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_ope_items');
    }
};
