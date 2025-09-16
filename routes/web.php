<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvoiceSubmissionController;
use App\Http\Controllers\SuratTugasSubmissionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
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

// Invoice: List for Finance Manager/Admin; Create for non-Finance roles
Route::middleware(['auth', 'verified', 'role:Manager Keuangan|Admin'])->group(function () {
    Route::get('/invoices', [InvoiceSubmissionController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}/download', [InvoiceSubmissionController::class, 'download'])->name('invoices.download');
});

Route::middleware(['auth', 'verified', 'role:Karyawan'])->group(function () {
    Route::get('/invoices/create', [InvoiceSubmissionController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceSubmissionController::class, 'store'])->name('invoices.store');
});

Route::middleware(['auth', 'verified', 'role:Karyawan'])->group(function () {
    Route::get('/surat-tugas/create', [SuratTugasSubmissionController::class, 'create'])->name('surat-tugas.create');
    Route::post('/surat-tugas', [SuratTugasSubmissionController::class, 'store'])->name('surat-tugas.store');
});

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::put('/invoices/{invoice}', [InvoiceSubmissionController::class, 'update'])->name('invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceSubmissionController::class, 'destroy'])->name('invoices.destroy');
});

Route::middleware(['auth', 'verified', 'role:Admin|Manager Operasional|Karyawan'])->group(function () {
    Route::get('/surat-tugas', [SuratTugasSubmissionController::class, 'index'])->name('surat-tugas.index');
    Route::get('/surat-tugas/{suratTugas}', [SuratTugasSubmissionController::class, 'show'])->name('surat-tugas.show');
});

Route::middleware(['auth', 'verified', 'role:Admin|Karyawan'])->group(function () {
    Route::put('/surat-tugas/{suratTugas}', [SuratTugasSubmissionController::class, 'update'])->name('surat-tugas.update');
});

Route::middleware(['auth', 'verified', 'role:Admin'])->group(function () {
    Route::delete('/surat-tugas/{suratTugas}', [SuratTugasSubmissionController::class, 'destroy'])->name('surat-tugas.destroy');
});

Route::middleware(['auth', 'verified', 'role:Manager Operasional'])->group(function () {
    Route::post('/surat-tugas/{suratTugas}/approve', [SuratTugasSubmissionController::class, 'approve'])->name('surat-tugas.approve');
    Route::post('/surat-tugas/{suratTugas}/reject', [SuratTugasSubmissionController::class, 'reject'])->name('surat-tugas.reject');
});

require __DIR__.'/auth.php';
