<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_tugas_submission_pic', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_tugas_submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pic_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();

            $table->unique(['surat_tugas_submission_id', 'pic_id'], 'sts_submission_pic_unique');
        });

        DB::table('surat_tugas_submissions')
            ->select(['id', 'pic_id'])
            ->whereNotNull('pic_id')
            ->orderBy('id')
            ->lazy()
            ->each(function ($record) {
                DB::table('surat_tugas_submission_pic')->updateOrInsert(
                    [
                        'surat_tugas_submission_id' => $record->id,
                        'pic_id' => $record->pic_id,
                    ],
                    [
                        'position' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_tugas_submission_pic');
    }
};
