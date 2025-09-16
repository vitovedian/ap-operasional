<?php

namespace App\Http\Controllers;

use App\Models\SuratTugasSubmission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SuratTugasSubmissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(Request $request): Response
    {
        $submissions = SuratTugasSubmission::query()
            ->with(['user', 'pic'])
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (SuratTugasSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'tanggal_pengajuan' => $submission->tanggal_pengajuan,
                    'kegiatan' => $submission->kegiatan,
                    'tanggal_kegiatan' => $submission->tanggal_kegiatan,
                    'pic' => $submission->pic ? [
                        'id' => $submission->pic->id,
                        'name' => $submission->pic->name,
                    ] : null,
                    'nama_pendampingan' => $submission->nama_pendampingan,
                    'fee_pendampingan' => (int) $submission->fee_pendampingan,
                    'instruktor_1_nama' => $submission->instruktor_1_nama,
                    'instruktor_1_fee' => (int) $submission->instruktor_1_fee,
                    'instruktor_2_nama' => $submission->instruktor_2_nama,
                    'instruktor_2_fee' => (int) $submission->instruktor_2_fee,
                    'pengaju' => $submission->user ? [
                        'id' => $submission->user->id,
                        'name' => $submission->user->name,
                    ] : null,
                ];
            })
            ->withQueryString();

        $picOptions = User::role('PIC')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
            ->values();

        return Inertia::render('SuratTugas/Index', [
            'submissions' => $submissions,
            'picOptions' => $picOptions,
            'canManage' => Auth::user()?->hasRole('Admin') ?? false,
        ]);
    }

    public function create(): Response
    {
        $picOptions = User::role('PIC')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
            ->values();

        return Inertia::render('SuratTugas/Create', [
            'picOptions' => $picOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tanggal_kegiatan' => ['required', 'date'],
            'pic_id' => ['required', 'exists:users,id'],
            'nama_pendampingan' => ['required', 'string', 'max:255'],
            'fee_pendampingan' => ['required'],
            'instruktor_1_nama' => ['required', 'string', 'max:255'],
            'instruktor_1_fee' => ['required'],
            'instruktor_2_nama' => ['nullable', 'string', 'max:255'],
            'instruktor_2_fee' => ['nullable'],
        ]);

        $pic = User::find($validated['pic_id']);
        if (! $pic || ! $pic->hasRole('PIC')) {
            return back()->with('error', 'PIC yang dipilih tidak valid.');
        }

        $feePendampingan = (int) preg_replace('/\D/', '', (string) $request->input('fee_pendampingan'));
        $instruktor1Fee = (int) preg_replace('/\D/', '', (string) $request->input('instruktor_1_fee'));
        $instruktor2Fee = (int) preg_replace('/\D/', '', (string) $request->input('instruktor_2_fee'));

        SuratTugasSubmission::create([
            'user_id' => Auth::id(),
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'kegiatan' => $validated['kegiatan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'pic_id' => $validated['pic_id'],
            'nama_pendampingan' => $validated['nama_pendampingan'],
            'fee_pendampingan' => $feePendampingan,
            'instruktor_1_nama' => $validated['instruktor_1_nama'],
            'instruktor_1_fee' => $instruktor1Fee,
            'instruktor_2_nama' => $validated['instruktor_2_nama'] ?? null,
            'instruktor_2_fee' => $instruktor2Fee,
        ]);

        return back()->with('success', 'Pengajuan Surat Tugas tersimpan');
    }

    public function update(Request $request, SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tanggal_kegiatan' => ['required', 'date'],
            'pic_id' => ['required', 'exists:users,id'],
            'nama_pendampingan' => ['required', 'string', 'max:255'],
            'fee_pendampingan' => ['required'],
            'instruktor_1_nama' => ['required', 'string', 'max:255'],
            'instruktor_1_fee' => ['required'],
            'instruktor_2_nama' => ['nullable', 'string', 'max:255'],
            'instruktor_2_fee' => ['nullable'],
        ]);

        $pic = User::find($validated['pic_id']);
        if (! $pic || ! $pic->hasRole('PIC')) {
            return back()->with('error', 'PIC yang dipilih tidak valid.');
        }

        $suratTugas->fill([
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'kegiatan' => $validated['kegiatan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'pic_id' => $validated['pic_id'],
            'nama_pendampingan' => $validated['nama_pendampingan'],
            'fee_pendampingan' => (int) preg_replace('/\D/', '', (string) $request->input('fee_pendampingan')),
            'instruktor_1_nama' => $validated['instruktor_1_nama'],
            'instruktor_1_fee' => (int) preg_replace('/\D/', '', (string) $request->input('instruktor_1_fee')),
            'instruktor_2_nama' => $validated['instruktor_2_nama'] ?? null,
            'instruktor_2_fee' => (int) preg_replace('/\D/', '', (string) $request->input('instruktor_2_fee')),
        ]);

        $suratTugas->save();

        return back()->with('success', 'Surat tugas diperbarui');
    }

    public function destroy(SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $suratTugas->delete();

        return back()->with('success', 'Surat tugas dihapus');
    }
}
