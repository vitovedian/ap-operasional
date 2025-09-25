<?php

namespace App\Http\Controllers;

use App\Models\InventoryLoanSubmission;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryLoanSubmissionController extends Controller
{
    private const ITEM_TYPES = ['alat', 'barang', 'ruangan', 'akun_zoom'];

    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager']) ?? false;

        $query = InventoryLoanSubmission::query()
            ->with(['user', 'processor'])
            ->orderByDesc('id');

        if (! $canViewAll) {
            $query->where('user_id', $user?->id);
        }

        $loans = $query
            ->paginate(10)
            ->through(function (InventoryLoanSubmission $loan) use ($user) {
                return [
                    'id' => $loan->id,
                    'nama_pemesan' => $loan->nama_pemesan,
                    'metode_kegiatan' => $loan->metode_kegiatan,
                    'nama_kegiatan' => $loan->nama_kegiatan,
                    'bank' => $loan->bank,
                    'items' => $loan->items ?? [],
                    'quantity' => $loan->quantity,
                    'tanggal_pinjam' => $loan->tanggal_pinjam?->toDateTimeString(),
                    'status' => $loan->status,
                    'manager_note' => $loan->manager_note,
                    'returned_at' => $loan->returned_at?->toDateTimeString(),
                    'created_at' => $loan->created_at?->toDateTimeString(),
                    'processed_at' => $loan->processed_at?->toDateTimeString(),
                    'processor' => $loan->processor ? [
                        'id' => $loan->processor->id,
                        'name' => $loan->processor->name,
                    ] : null,
                    'pengaju' => $loan->user ? [
                        'id' => $loan->user->id,
                        'name' => $loan->user->name,
                        'email' => $loan->user->email,
                    ] : null,
                    'can_mark_done' => ($loan->user_id === ($user?->id)) && $loan->status === 'approved' && $loan->returned_at === null,
                    'can_edit' => ($loan->user_id === ($user?->id)) && $loan->status === 'rejected',
                    'can_admin_edit' => $user?->hasRole('Admin') ?? false,
                    'can_delete' => $user?->hasRole('Admin') ?? false,
                ];
            })
            ->withQueryString();

        return Inertia::render('PeminjamanInventaris/Index', [
            'loans' => $loans,
            'canManage' => $user?->hasAnyRole(['Manager', 'Admin']) ?? false,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('PeminjamanInventaris/Create', [
            'itemOptions' => $this->itemOptions(),
        ]);
    }

    public function edit(Request $request, InventoryLoanSubmission $loan): Response
    {
        $user = $request->user();
        if ($loan->user_id !== $user->id && ! $user->hasRole('Admin')) {
            abort(403);
        }

        return Inertia::render('PeminjamanInventaris/Create', [
            'itemOptions' => $this->itemOptions(),
            'loan' => [
                'id' => $loan->id,
                'nama_pemesan' => $loan->nama_pemesan,
                'metode_kegiatan' => $loan->metode_kegiatan,
                'nama_kegiatan' => $loan->nama_kegiatan,
                'bank' => $loan->bank,
                'items' => $loan->items ?? [],
                'quantity' => $loan->quantity,
                'tanggal_pinjam' => $loan->tanggal_pinjam?->toDateString(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_pemesan' => ['required', 'string', 'max:255'],
            'metode_kegiatan' => ['required', Rule::in(['online', 'offline'])],
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'bank' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['required', Rule::in(self::ITEM_TYPES)],
            'items.*.label' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'tanggal_pinjam' => ['required', 'date'],
        ]);

        $items = collect($validated['items'])
            ->map(fn ($item) => [
                'type' => $item['type'],
                'label' => $item['label'],
            ])
            ->values()
            ->all();

        $tanggalPinjam = Carbon::parse($validated['tanggal_pinjam'], config('app.timezone'))->setTimeFrom(now());

        InventoryLoanSubmission::create([
            'user_id' => $request->user()->id,
            'nama_pemesan' => $validated['nama_pemesan'],
            'metode_kegiatan' => $validated['metode_kegiatan'],
            'nama_kegiatan' => $validated['nama_kegiatan'],
            'bank' => $validated['bank'],
            'items' => $items,
            'quantity' => (int) $validated['quantity'],
            'tanggal_pinjam' => $tanggalPinjam,
            'status' => 'pending',
        ]);

        return redirect()->route('peminjaman-inventaris.index')->with('success', 'Pengajuan peminjaman inventaris tersimpan.');
    }

    public function approve(Request $request, InventoryLoanSubmission $loan): RedirectResponse
    {
        if ($loan->status !== 'pending') {
            return back()->with('error', 'Pengajuan ini tidak dapat diproses.');
        }

        $loan->update([
            'status' => 'approved',
            'manager_note' => null,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Pengajuan peminjaman inventaris disetujui.');
    }

    public function reject(Request $request, InventoryLoanSubmission $loan): RedirectResponse
    {
        if ($loan->status !== 'pending') {
            return back()->with('error', 'Pengajuan ini tidak dapat diproses.');
        }

        $validated = $request->validate([
            'manager_note' => ['required', 'string', 'max:1000'],
        ]);

        $loan->update([
            'status' => 'rejected',
            'manager_note' => $validated['manager_note'],
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Pengajuan peminjaman inventaris ditolak.');
    }

    public function complete(Request $request, InventoryLoanSubmission $loan): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $loan->user_id === $user->id;
        $isAdmin = $user->hasRole('Admin');

        if (! $isOwner && ! $isAdmin) {
            abort(403);
        }

        if ($loan->status !== 'approved') {
            return back()->with('error', 'Pengajuan belum dapat diselesaikan.');
        }

        $loan->update([
            'status' => 'completed',
            'returned_at' => now(),
        ]);

        return back()->with('success', 'Pengajuan peminjaman inventaris ditandai selesai.');
    }

    public function update(Request $request, InventoryLoanSubmission $loan): RedirectResponse
    {
        $user = $request->user();
        if ($loan->user_id !== $user->id && ! $user->hasRole('Admin')) {
            abort(403);
        }

        if ($loan->status !== 'rejected' && ! $user->hasRole('Admin')) {
            return back()->with('error', 'Pengajuan ini tidak dapat direvisi.');
        }

        $validated = $request->validate([
            'nama_pemesan' => ['required', 'string', 'max:255'],
            'metode_kegiatan' => ['required', Rule::in(['online', 'offline'])],
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'bank' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['required', Rule::in(self::ITEM_TYPES)],
            'items.*.label' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'tanggal_pinjam' => ['required', 'date'],
        ]);

        $items = collect($validated['items'])
            ->map(fn ($item) => [
                'type' => $item['type'],
                'label' => $item['label'],
            ])
            ->values()
            ->all();

        $tanggalPinjam = Carbon::parse($validated['tanggal_pinjam'], config('app.timezone'))->setTimeFrom(now());

        $loan->update([
            'nama_pemesan' => $validated['nama_pemesan'],
            'metode_kegiatan' => $validated['metode_kegiatan'],
            'nama_kegiatan' => $validated['nama_kegiatan'],
            'bank' => $validated['bank'],
            'items' => $items,
            'quantity' => (int) $validated['quantity'],
            'tanggal_pinjam' => $tanggalPinjam,
            'status' => 'pending',
            'manager_note' => null,
            'processed_by' => null,
            'processed_at' => null,
            'returned_at' => null,
        ]);

        return redirect()->route('peminjaman-inventaris.index')->with('success', 'Pengajuan peminjaman inventaris berhasil direvisi.');
    }

    public function destroy(Request $request, InventoryLoanSubmission $loan): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('Admin')) {
            abort(403);
        }

        $loan->delete();

        return back()->with('success', 'Pengajuan peminjaman inventaris dihapus.');
    }

    private function itemOptions(): array
    {
        return array_map(static function (string $value) {
            return [
                'value' => $value,
                'label' => match ($value) {
                    'barang' => 'Barang',
                    'ruangan' => 'Ruangan',
                    'akun_zoom' => 'Akun Zoom',
                    default => 'Alat',
                },
            ];
        }, self::ITEM_TYPES);
    }

}
