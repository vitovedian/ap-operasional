<?php

namespace App\Http\Controllers;

use App\Models\NomorSuratSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NomorSuratSubmissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false;

        $submissions = NomorSuratSubmission::query()
            ->with('user')
            ->when(! $canViewAll, fn ($query) => $query->where('user_id', $user?->id))
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (NomorSuratSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'tanggal_pengajuan' => $submission->tanggal_pengajuan,
                    'tujuan_surat' => $submission->tujuan_surat,
                    'nama_klien' => $submission->nama_klien,
                    'catatan' => $submission->catatan,
                    'user' => $submission->user ? [
                        'id' => $submission->user->id,
                        'name' => $submission->user->name,
                        'email' => $submission->user->email,
                    ] : null,
                ];
            })
            ->withQueryString();

        return Inertia::render('NomorSurat/Index', [
            'submissions' => $submissions,
            'canManage' => $user?->hasRole('Admin') ?? false,
            'canViewAll' => $canViewAll,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('NomorSurat/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'tujuan_surat' => ['required', 'string', 'max:255'],
            'nama_klien' => ['required', 'string', 'max:255'],
            'catatan' => ['required', 'string', 'max:1000'],
        ]);

        NomorSuratSubmission::create([
            'user_id' => Auth::id(),
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'tujuan_surat' => $validated['tujuan_surat'],
            'nama_klien' => $validated['nama_klien'],
            'catatan' => $validated['catatan'],
        ]);

        return back()->with('success', 'Pengajuan nomor surat tersimpan');
    }

    public function update(Request $request, NomorSuratSubmission $nomorSurat): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'tujuan_surat' => ['required', 'string', 'max:255'],
            'nama_klien' => ['required', 'string', 'max:255'],
            'catatan' => ['required', 'string', 'max:1000'],
        ]);

        $nomorSurat->update($validated);

        return back()->with('success', 'Pengajuan nomor surat diperbarui');
    }

    public function destroy(NomorSuratSubmission $nomorSurat): RedirectResponse
    {
        $nomorSurat->delete();

        return back()->with('success', 'Pengajuan nomor surat dihapus');
    }
}
