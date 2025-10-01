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
            $table->string('instruktor_3_nama')->nullable()->after('instruktor_2_fee');
            $table->unsignedBigInteger('instruktor_3_fee')->default(0)->after('instruktor_3_nama');
            $table->string('instruktor_4_nama')->nullable()->after('instruktor_3_fee');
            $table->unsignedBigInteger('instruktor_4_fee')->default(0)->after('instruktor_4_nama');
            $table->string('instruktor_5_nama')->nullable()->after('instruktor_4_fee');
            $table->unsignedBigInteger('instruktor_5_fee')->default(0)->after('instruktor_5_nama');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_tugas_submissions', function (Blueprint $table) {
            $table->dropColumn([
                'instruktor_3_nama',
                'instruktor_3_fee',
                'instruktor_4_nama',
                'instruktor_4_fee',
                'instruktor_5_nama',
                'instruktor_5_fee',
            ]);
        });
    }
};
