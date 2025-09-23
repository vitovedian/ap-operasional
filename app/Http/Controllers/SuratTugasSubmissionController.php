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
        $user = $request->user();
        $query = SuratTugasSubmission::query()
            ->with(['user', 'pic', 'processor'])
            ->orderByDesc('id')
            ->when(
                $user
                && $user->hasAnyRole(['Karyawan', 'PIC'])
                && ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                }
            );

        $submissions = $query
            ->paginate(10)
            ->through(function (SuratTugasSubmission $submission) use ($user) {
                $status = $submission->status ?? 'pending';
                $totalInstruktur = ((int) $submission->instruktor_1_fee) + ((int) $submission->instruktor_2_fee);
                $feePendampingan = (int) $submission->fee_pendampingan;
                $totalKeseluruhan = $feePendampingan + $totalInstruktur;
                return [
                    'id' => $submission->id,
                    'tanggal_pengajuan' => $submission->tanggal_pengajuan,
                    'kegiatan' => $submission->kegiatan,
                    'tanggal_kegiatan' => $submission->tanggal_kegiatan,
                    'pic' => $submission->pic ? [
                        'id' => $submission->pic->id,
                        'name' => $submission->pic->name,
                        'email' => $submission->pic->email,
                    ] : null,
                    'nama_pendampingan' => $submission->nama_pendampingan,
                    'fee_pendampingan' => $feePendampingan,
                    'instruktor_1_nama' => $submission->instruktor_1_nama,
                    'instruktor_1_fee' => (int) $submission->instruktor_1_fee,
                    'instruktor_2_nama' => $submission->instruktor_2_nama,
                    'instruktor_2_fee' => (int) $submission->instruktor_2_fee,
                    'total_fee_instruktur' => $totalInstruktur,
                    'total_fee' => $totalKeseluruhan,
                    'instruktors' => collect([
                        ['nama' => $submission->instruktor_1_nama, 'fee' => (int) $submission->instruktor_1_fee],
                        ['nama' => $submission->instruktor_2_nama, 'fee' => (int) $submission->instruktor_2_fee],
                    ])->filter(fn ($instruktor) => filled($instruktor['nama']))->values(),
                    'pengaju' => $submission->user ? [
                        'id' => $submission->user->id,
                        'name' => $submission->user->name,
                        'email' => $submission->user->email,
                    ] : null,
                    'status' => $status,
                    'catatan_revisi' => $submission->catatan_revisi,
                    'processed_by' => $submission->processor ? [
                        'id' => $submission->processor->id,
                        'name' => $submission->processor->name,
                    ] : null,
                    'processed_at' => optional($submission->processed_at)->toDateTimeString(),
                    'can_self_edit' => $user
                        && $user->hasAnyRole(['Karyawan', 'PIC'])
                        && $submission->user_id === $user->id
                        && $status === 'rejected',
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
            'canManage' => $user?->hasRole('Admin') ?? false,
            'canModerate' => $user?->hasRole('Manager') ?? false,
            'canViewAll' => $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false,
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
            'fee_pendampingan' => ['nullable'],
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
            'status' => 'pending',
        ]);

        return back()->with('success', 'Pengajuan Surat Tugas tersimpan');
    }

    public function show(Request $request, SuratTugasSubmission $suratTugas): Response
    {
        $user = $request->user();

        $isAdmin = $user?->hasRole('Admin');
        $isManager = $user?->hasRole('Manager');
        $isSupervisor = $user?->hasRole('Supervisor');
        $isKaryawan = $user?->hasRole('Karyawan');
        $isPic = $user?->hasRole('PIC');

        if (! $isAdmin && ! $isManager && ! $isSupervisor) {
            if (! ($isKaryawan || $isPic) || $suratTugas->user_id !== $user?->id) {
                abort(403);
            }
        }

        $suratTugas->loadMissing(['user', 'pic', 'processor']);

        $data = [
            'id' => $suratTugas->id,
            'tanggal_pengajuan' => $suratTugas->tanggal_pengajuan,
            'kegiatan' => $suratTugas->kegiatan,
            'tanggal_kegiatan' => $suratTugas->tanggal_kegiatan,
            'nama_pendampingan' => $suratTugas->nama_pendampingan,
            'fee_pendampingan' => (int) $suratTugas->fee_pendampingan,
            'instruktor_1_nama' => $suratTugas->instruktor_1_nama,
            'instruktor_1_fee' => (int) $suratTugas->instruktor_1_fee,
            'instruktor_2_nama' => $suratTugas->instruktor_2_nama,
            'instruktor_2_fee' => (int) $suratTugas->instruktor_2_fee,
            'status' => $suratTugas->status ?? 'pending',
            'catatan_revisi' => $suratTugas->catatan_revisi,
            'processed_at' => optional($suratTugas->processed_at)->toDateTimeString(),
            'pic' => $suratTugas->pic ? [
                'id' => $suratTugas->pic->id,
                'name' => $suratTugas->pic->name,
                'email' => $suratTugas->pic->email,
            ] : null,
            'pengaju' => $suratTugas->user ? [
                'id' => $suratTugas->user->id,
                'name' => $suratTugas->user->name,
                'email' => $suratTugas->user->email,
            ] : null,
            'processor' => $suratTugas->processor ? [
                'id' => $suratTugas->processor->id,
                'name' => $suratTugas->processor->name,
            ] : null,
        ];

        return Inertia::render('SuratTugas/Show', [
            'submission' => $data,
            'canModerate' => $isManager,
            'canEdit' => $isAdmin
                || ((($isKaryawan || $isPic)
                    && $suratTugas->user_id === $user?->id
                    && ($suratTugas->status ?? 'pending') === 'rejected')),
        ]);
    }

    public function update(Request $request, SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tanggal_kegiatan' => ['required', 'date'],
            'pic_id' => ['required', 'exists:users,id'],
            'nama_pendampingan' => ['required', 'string', 'max:255'],
            'fee_pendampingan' => ['nullable'],
            'instruktor_1_nama' => ['required', 'string', 'max:255'],
            'instruktor_1_fee' => ['required'],
            'instruktor_2_nama' => ['nullable', 'string', 'max:255'],
            'instruktor_2_fee' => ['nullable'],
        ]);

        $user = $request->user();
        $isAdmin = $user?->hasRole('Admin');
        $isKaryawan = $user?->hasRole('Karyawan');
        $isPic = $user?->hasRole('PIC');

        if (! $isAdmin) {
            if (! ($isKaryawan || $isPic) || $suratTugas->user_id !== $user->id) {
                abort(403);
            }

            $currentStatus = $suratTugas->status ?? 'pending';
            if ($currentStatus !== 'rejected') {
                return back()->with('error', 'Hanya surat tugas yang ditolak yang dapat diperbarui.');
            }
        }

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

        if (($isKaryawan || $isPic) && ! $isAdmin) {
            $suratTugas->status = 'pending';
            $suratTugas->catatan_revisi = null;
            $suratTugas->processed_by = null;
            $suratTugas->processed_at = null;
        }

        $suratTugas->save();

        return back()->with('success', 'Surat tugas diperbarui');
    }

    public function destroy(SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $suratTugas->delete();

        return back()->with('success', 'Surat tugas dihapus');
    }

    public function approve(Request $request, SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $suratTugas->update([
            'status' => 'approved',
            'catatan_revisi' => null,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Surat tugas diterima');
    }

    public function reject(Request $request, SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $validated = $request->validate([
            'catatan_revisi' => ['required', 'string', 'max:1000'],
        ]);

        $suratTugas->update([
            'status' => 'rejected',
            'catatan_revisi' => $validated['catatan_revisi'],
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Surat tugas ditolak dengan catatan');
    }
}
