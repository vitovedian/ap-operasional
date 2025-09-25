<?php

namespace App\Http\Controllers;

use App\Models\SpjSubmission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SpjSubmissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false;

        $query = SpjSubmission::query()
            ->with(['user', 'pic', 'processor'])
            ->orderByDesc('id');

        if (! $canViewAll) {
            $query->where('user_id', $user?->id);
        }

        $submissions = $query
            ->paginate(10)
            ->through(function (SpjSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'nama_kegiatan' => $submission->nama_kegiatan,
                    'tanggal_kegiatan' => $submission->tanggal_kegiatan?->toDateString(),
                    'durasi_nilai' => $submission->durasi_nilai,
                    'durasi_satuan' => $submission->durasi_satuan,
                    'nama_pendampingan' => $submission->nama_pendampingan,
                    'jenis_kegiatan' => $submission->jenis_kegiatan,
                    'status' => $submission->status,
                    'catatan_revisi' => $submission->catatan_revisi,
                    'form_serah_terima_url' => $submission->form_serah_terima_path
                        ? route('spj.form-serah-terima', $submission)
                        : null,
                    'form_serah_terima_name' => $submission->form_serah_terima_path
                        ? basename($submission->form_serah_terima_path)
                        : null,
                    'pic' => $submission->pic ? [
                        'id' => $submission->pic->id,
                        'name' => $submission->pic->name,
                        'email' => $submission->pic->email,
                    ] : null,
                    'pengaju' => $submission->user ? [
                        'id' => $submission->user->id,
                        'name' => $submission->user->name,
                        'email' => $submission->user->email,
                    ] : null,
                    'processed_by' => $submission->processor ? [
                        'id' => $submission->processor->id,
                        'name' => $submission->processor->name,
                    ] : null,
                    'processed_at' => $submission->processed_at?->toDateTimeString(),
                ];
            })
            ->withQueryString();

        $picOptions = [];
        if ($user?->hasRole('Admin')) {
            $picOptions = User::role('PIC')
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn (User $pic) => [
                    'id' => $pic->id,
                    'name' => $pic->name,
                    'email' => $pic->email,
                ])
                ->values();
        }

        return Inertia::render('SPJ/Index', [
            'submissions' => $submissions,
            'canManage' => $user?->hasRole('Admin') ?? false,
            'canApprove' => $user?->hasRole('Manager') ?? false,
            'canViewAll' => $canViewAll,
            'picOptions' => $picOptions,
        ]);
    }

    public function create(): Response
    {
        $picOptions = User::role('PIC')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        return Inertia::render('SPJ/Create', [
            'picOptions' => $picOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'tanggal_kegiatan' => ['required', 'date'],
            'durasi_nilai' => ['required', 'integer', 'min:1'],
            'durasi_satuan' => ['required', 'in:hari,minggu,bulan'],
            'pic_id' => ['required', 'exists:users,id'],
            'nama_pendampingan' => ['required', 'string', 'max:255'],
            'jenis_kegiatan' => ['required', 'in:offline,online'],
            'form_serah_terima' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $pic = User::find($validated['pic_id']);
        if (! $pic || ! $pic->hasRole('PIC')) {
            return back()->with('error', 'PIC yang dipilih tidak valid.');
        }

        $durasiSatuan = strtolower($validated['durasi_satuan']);
        $jenisKegiatan = strtolower($validated['jenis_kegiatan']);

        $path = $request->file('form_serah_terima')->store('spj/serah-terima');

        SpjSubmission::create([
            'user_id' => Auth::id(),
            'pic_id' => $validated['pic_id'],
            'nama_kegiatan' => $validated['nama_kegiatan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'durasi_nilai' => (int) $validated['durasi_nilai'],
            'durasi_satuan' => $durasiSatuan,
            'nama_pendampingan' => $validated['nama_pendampingan'],
            'jenis_kegiatan' => $jenisKegiatan,
            'form_serah_terima_path' => $path,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Pengajuan SPJ tersimpan');
    }

    public function update(Request $request, SpjSubmission $spj): RedirectResponse
    {
        $validated = $request->validate([
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'tanggal_kegiatan' => ['required', 'date'],
            'durasi_nilai' => ['required', 'integer', 'min:1'],
            'durasi_satuan' => ['required', 'in:hari,minggu,bulan'],
            'pic_id' => ['required', 'exists:users,id'],
            'nama_pendampingan' => ['required', 'string', 'max:255'],
            'jenis_kegiatan' => ['required', 'in:offline,online'],
            'form_serah_terima' => ['sometimes', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $pic = User::find($validated['pic_id']);
        if (! $pic || ! $pic->hasRole('PIC')) {
            return back()->with('error', 'PIC yang dipilih tidak valid.');
        }

        $durasiSatuan = strtolower($validated['durasi_satuan']);
        $jenisKegiatan = strtolower($validated['jenis_kegiatan']);

        $spj->fill([
            'pic_id' => $validated['pic_id'],
            'nama_kegiatan' => $validated['nama_kegiatan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'durasi_nilai' => (int) $validated['durasi_nilai'],
            'durasi_satuan' => $durasiSatuan,
            'nama_pendampingan' => $validated['nama_pendampingan'],
            'jenis_kegiatan' => $jenisKegiatan,
        ]);

        if ($request->hasFile('form_serah_terima')) {
            if ($spj->form_serah_terima_path && Storage::exists($spj->form_serah_terima_path)) {
                Storage::delete($spj->form_serah_terima_path);
            }

            $spj->form_serah_terima_path = $request->file('form_serah_terima')->store('spj/serah-terima');
        }

        $spj->save();

        return back()->with('success', 'Pengajuan SPJ diperbarui');
    }

    public function destroy(SpjSubmission $spj): RedirectResponse
    {
        $spj->delete();

        return back()->with('success', 'Pengajuan SPJ dihapus');
    }

    public function approve(Request $request, SpjSubmission $spj): RedirectResponse
    {
        $spj->update([
            'status' => 'approved',
            'catatan_revisi' => null,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'SPJ disetujui');
    }

    public function reject(Request $request, SpjSubmission $spj): RedirectResponse
    {
        $validated = $request->validate([
            'catatan_revisi' => ['required', 'string', 'max:1000'],
        ]);

        $spj->update([
            'status' => 'rejected',
            'catatan_revisi' => $validated['catatan_revisi'],
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'SPJ ditolak dengan catatan');
    }

    public function downloadFormSerahTerima(Request $request, SpjSubmission $spj)
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false;
        $isOwner = $spj->user_id === ($user?->id);
        $isPic = $spj->pic_id === ($user?->id);

        if (! ($canViewAll || $isOwner || $isPic)) {
            abort(403);
        }

        if (! $spj->form_serah_terima_path || ! Storage::exists($spj->form_serah_terima_path)) {
            abort(404);
        }

        return Storage::download(
            $spj->form_serah_terima_path,
            basename($spj->form_serah_terima_path)
        );
    }

}

