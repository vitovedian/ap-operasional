<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvoiceSubmissionController;
use App\Http\Controllers\NomorSuratSubmissionController;
use App\Http\Controllers\SpjSubmissionController;
use App\Http\Controllers\InventoryLoanSubmissionController;
use App\Http\Controllers\SuratTugasSubmissionController;
use App\Http\Controllers\AtkRequestController;
use App\Http\Controllers\PdfTestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin: Users management
Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});

// Invoice: accessible according to new role matrix
Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|Karyawan|PIC'])->group(function () {
    Route::get('/invoices', [InvoiceSubmissionController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}/download', [InvoiceSubmissionController::class, 'download'])->name('invoices.download');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan|PIC'])->group(function () {
    Route::get('/invoices/create', [InvoiceSubmissionController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceSubmissionController::class, 'store'])->name('invoices.store');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan|PIC'])->group(function () {
    Route::get('/surat-tugas/create', [SuratTugasSubmissionController::class, 'create'])->name('surat-tugas.create');
    Route::post('/surat-tugas', [SuratTugasSubmissionController::class, 'store'])->name('surat-tugas.store');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|Karyawan|PIC'])->group(function () {
    Route::get('/nomor-surat', [NomorSuratSubmissionController::class, 'index'])->name('nomor-surat.index');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan|PIC'])->group(function () {
    Route::get('/nomor-surat/create', [NomorSuratSubmissionController::class, 'create'])->name('nomor-surat.create');
    Route::post('/nomor-surat', [NomorSuratSubmissionController::class, 'store'])->name('nomor-surat.store');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|Karyawan|PIC'])->group(function () {
    Route::get('/spj', [SpjSubmissionController::class, 'index'])->name('spj.index');
    Route::get('/spj/{spj}/form-serah-terima', [SpjSubmissionController::class, 'downloadFormSerahTerima'])->name('spj.form-serah-terima');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan|PIC'])->group(function () {
    Route::get('/spj/create', [SpjSubmissionController::class, 'create'])->name('spj.create');
    Route::post('/spj', [SpjSubmissionController::class, 'store'])->name('spj.store');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|Karyawan|PIC'])->group(function () {
    Route::get('/peminjaman-inventaris', [InventoryLoanSubmissionController::class, 'index'])->name('peminjaman-inventaris.index');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan|PIC'])->group(function () {
    Route::get('/peminjaman-inventaris/create', [InventoryLoanSubmissionController::class, 'create'])->name('peminjaman-inventaris.create');
    Route::post('/peminjaman-inventaris', [InventoryLoanSubmissionController::class, 'store'])->name('peminjaman-inventaris.store');
    Route::get('/peminjaman-inventaris/{loan}/edit', [InventoryLoanSubmissionController::class, 'edit'])->name('peminjaman-inventaris.edit');
    Route::put('/peminjaman-inventaris/{loan}', [InventoryLoanSubmissionController::class, 'update'])->name('peminjaman-inventaris.update');
    Route::post('/peminjaman-inventaris/{loan}/complete', [InventoryLoanSubmissionController::class, 'complete'])->name('peminjaman-inventaris.complete');
});

Route::middleware(['auth', 'verified', 'role:Manager|Admin'])->group(function () {
    Route::post('/peminjaman-inventaris/{loan}/approve', [InventoryLoanSubmissionController::class, 'approve'])->name('peminjaman-inventaris.approve');
    Route::post('/peminjaman-inventaris/{loan}/reject', [InventoryLoanSubmissionController::class, 'reject'])->name('peminjaman-inventaris.reject');
    Route::delete('/peminjaman-inventaris/{loan}', [InventoryLoanSubmissionController::class, 'destroy'])->name('peminjaman-inventaris.destroy');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|PIC'])->group(function () {
    Route::get('/atk-requests', [AtkRequestController::class, 'index'])->name('atk-requests.index');
});

Route::middleware(['auth', 'verified', 'role:Admin|Supervisor|PIC'])->group(function () {
    Route::get('/atk-requests/create', [AtkRequestController::class, 'create'])->name('atk-requests.create');
    Route::post('/atk-requests', [AtkRequestController::class, 'store'])->name('atk-requests.store');
    Route::get('/atk-requests/{atk}/edit', [AtkRequestController::class, 'edit'])->name('atk-requests.edit');
    Route::put('/atk-requests/{atk}', [AtkRequestController::class, 'update'])->name('atk-requests.update');
    Route::post('/atk-requests/{atk}/complete', [AtkRequestController::class, 'complete'])->name('atk-requests.complete');
});

Route::middleware(['auth', 'verified', 'role:Manager|Admin'])->group(function () {
    Route::post('/atk-requests/{atk}/approve', [AtkRequestController::class, 'approve'])->name('atk-requests.approve');
    Route::post('/atk-requests/{atk}/reject', [AtkRequestController::class, 'reject'])->name('atk-requests.reject');
    Route::delete('/atk-requests/{atk}', [AtkRequestController::class, 'destroy'])->name('atk-requests.destroy');
});

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::put('/invoices/{invoice}', [InvoiceSubmissionController::class, 'update'])->name('invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceSubmissionController::class, 'destroy'])->name('invoices.destroy');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|Karyawan|PIC'])->group(function () {
    Route::get('/surat-tugas', [SuratTugasSubmissionController::class, 'index'])->name('surat-tugas.index');
    Route::get('/surat-tugas/{suratTugas}', [SuratTugasSubmissionController::class, 'show'])->name('surat-tugas.show');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan|PIC'])->group(function () {
    Route::put('/surat-tugas/{suratTugas}', [SuratTugasSubmissionController::class, 'update'])->name('surat-tugas.update');
});

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::delete('/surat-tugas/{suratTugas}', [SuratTugasSubmissionController::class, 'destroy'])->name('surat-tugas.destroy');
});

Route::middleware(['auth', 'verified', 'role:Admin|Supervisor'])->group(function () {
    Route::post('/surat-tugas/{suratTugas}/assign-nomor-surat', [SuratTugasSubmissionController::class, 'assignNomorSurat'])->name('surat-tugas.assign-nomor');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager|Supervisor|PIC'])->group(function () {
    Route::get('/surat-tugas/{suratTugas}/download', [SuratTugasSubmissionController::class, 'download'])->name('surat-tugas.download');
    Route::get('/surat-tugas/{suratTugas}/download-pic', [SuratTugasSubmissionController::class, 'downloadPicTemplate'])->name('surat-tugas.download-pic');
    Route::get('/surat-tugas/{suratTugas}/download-trainer', [SuratTugasSubmissionController::class, 'downloadTrainerTemplate'])->name('surat-tugas.download-trainer');
    Route::get('/surat-tugas/{suratTugas}/download-pendamping', [SuratTugasSubmissionController::class, 'downloadPendampingTemplate'])->name('surat-tugas.download-pendamping');
    Route::get('/surat-tugas/{suratTugas}/download-instruktur', [SuratTugasSubmissionController::class, 'downloadInstrukturTemplate'])->name('surat-tugas.download-instruktur');
});

Route::middleware(['auth', 'verified', 'role:Manager'])->group(function () {
    Route::post('/surat-tugas/{suratTugas}/approve', [SuratTugasSubmissionController::class, 'approve'])->name('surat-tugas.approve');
    Route::post('/surat-tugas/{suratTugas}/reject', [SuratTugasSubmissionController::class, 'reject'])->name('surat-tugas.reject');
});

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::put('/nomor-surat/{nomorSurat}', [NomorSuratSubmissionController::class, 'update'])->name('nomor-surat.update');
    Route::delete('/nomor-surat/{nomorSurat}', [NomorSuratSubmissionController::class, 'destroy'])->name('nomor-surat.destroy');
});

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::put('/spj/{spj}', [SpjSubmissionController::class, 'update'])->name('spj.update');
    Route::delete('/spj/{spj}', [SpjSubmissionController::class, 'destroy'])->name('spj.destroy');
});

Route::middleware(['auth', 'verified', 'role:Manager'])->group(function () {
    Route::post('/spj/{spj}/approve', [SpjSubmissionController::class, 'approve'])->name('spj.approve');
    Route::post('/spj/{spj}/reject', [SpjSubmissionController::class, 'reject'])->name('spj.reject');
});

// Test route for PDF generation
Route::get('/test-pdf', [PdfTestController::class, 'test'])->name('test.pdf');

require __DIR__.'/auth.php';
