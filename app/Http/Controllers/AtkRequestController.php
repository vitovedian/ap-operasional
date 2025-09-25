<?php

namespace App\Http\Controllers;

use App\Models\AtkRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AtkRequestController extends Controller
{
    private const BUDGETING_OPTIONS = ['sudah_funding' => 'Sudah ada Funding', 'belum_funding' => 'Belum ada Funding'];

    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false;
        $canCreate = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC']) ?? false;
        $canManage = $user?->hasAnyRole(['Manager', 'Admin']) ?? false;

        $query = AtkRequest::query()
            ->with(['user', 'processor'])
            ->orderByDesc('id');

        if (! $canViewAll) {
            $query->where('user_id', $user?->id);
        }

        $requests = $query
            ->paginate(10)
            ->through(function (AtkRequest $request) use ($user) {
                return [
                    'id' => $request->id,
                    'nama_pemesan' => $request->nama_pemesan,
                    'nama_barang' => $request->nama_barang,
                    'referensi' => $request->referensi,
                    'merek' => $request->merek,
                    'quantity' => $request->quantity,
                    'tanggal_pesan' => $request->tanggal_pesan?->toDateString(),
                    'deadline' => $request->deadline?->toDateString(),
                    'kegiatan' => $request->kegiatan,
                    'bank' => $request->bank,
                    'budgeting' => $request->budgeting,
                    'budgeting_label' => self::BUDGETING_OPTIONS[$request->budgeting] ?? $request->budgeting,
                    'catatan' => $request->catatan,
                    'status' => $request->status,
                    'manager_note' => $request->manager_note,
                    'processed_at' => $request->processed_at?->toDateTimeString(),
                    'completed_at' => $request->completed_at?->toDateTimeString(),
                    'processor' => $request->processor ? [
                        'id' => $request->processor->id,
                        'name' => $request->processor->name,
                    ] : null,
                    'pengaju' => $request->user ? [
                        'id' => $request->user->id,
                        'name' => $request->user->name,
                        'email' => $request->user->email,
                    ] : null,
                    'can_mark_done' => ($request->user_id === ($user?->id)) && $request->status === 'approved' && $request->completed_at === null,
                    'can_edit' => ($request->user_id === ($user?->id)) && $request->status === 'rejected',
                    'can_admin_edit' => $user?->hasRole('Admin') ?? false,
                    'can_delete' => $user?->hasRole('Admin') ?? false,
                ];
            })
            ->withQueryString();

        return Inertia::render('AtkRequest/Index', [
            'requests' => $requests,
            'canManage' => $canManage,
            'canCreate' => $canCreate,
            'budgetingOptions' => $this->budgetingOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('AtkRequest/Create', [
            'budgetingOptions' => $this->budgetingOptions(),
        ]);
    }

    public function edit(Request $request, AtkRequest $atk): Response
    {
        $user = $request->user();
        if ($atk->user_id !== $user->id && ! $user->hasRole('Admin')) {
            abort(403);
        }

        return Inertia::render('AtkRequest/Create', [
            'budgetingOptions' => $this->budgetingOptions(),
            'requestData' => [
                'id' => $atk->id,
                'nama_pemesan' => $atk->nama_pemesan,
                'nama_barang' => $atk->nama_barang,
                'referensi' => $atk->referensi,
                'merek' => $atk->merek,
                'quantity' => $atk->quantity,
                'tanggal_pesan' => $atk->tanggal_pesan?->toDateString(),
                'deadline' => $atk->deadline?->toDateString(),
                'kegiatan' => $atk->kegiatan,
                'bank' => $atk->bank,
                'budgeting' => $atk->budgeting,
                'catatan' => $atk->catatan,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);

        AtkRequest::create($validated + [
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return redirect()->route('atk-requests.index')->with('success', 'Pengajuan ATK tersimpan.');
    }

    public function update(Request $request, AtkRequest $atk): RedirectResponse
    {
        $user = $request->user();
        if ($atk->user_id !== $user->id && ! $user->hasRole('Admin')) {
            abort(403);
        }

        if ($atk->status !== 'rejected' && ! $user->hasRole('Admin')) {
            return back()->with('error', 'Pengajuan ini tidak dapat direvisi.');
        }

        $validated = $this->validateData($request);
        
        $atk->update($validated + [
            'status' => 'pending',
            'manager_note' => null,
            'processed_by' => null,
            'processed_at' => null,
            'completed_at' => null,
        ]);

        return redirect()->route('atk-requests.index')->with('success', 'Pengajuan ATK berhasil direvisi.');
    }

    public function approve(Request $request, AtkRequest $atk): RedirectResponse
    {
        if ($atk->status !== 'pending') {
            return back()->with('error', 'Pengajuan ini tidak dapat diproses.');
        }

        $atk->update([
            'status' => 'approved',
            'manager_note' => null,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Pengajuan ATK disetujui.');
    }

    public function reject(Request $request, AtkRequest $atk): RedirectResponse
    {
        if ($atk->status !== 'pending') {
            return back()->with('error', 'Pengajuan ini tidak dapat diproses.');
        }

        $validated = $request->validate([
            'manager_note' => ['required', 'string', 'max:1000'],
        ]);

        $atk->update([
            'status' => 'rejected',
            'manager_note' => $validated['manager_note'],
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Pengajuan ATK ditolak.');
    }

    public function complete(Request $request, AtkRequest $atk): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $atk->user_id === $user->id;
        $isAdmin = $user->hasRole('Admin');

        if (! $isOwner && ! $isAdmin) {
            abort(403);
        }

        if ($atk->status !== 'approved') {
            return back()->with('error', 'Pengajuan belum dapat diselesaikan.');
        }

        $atk->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Pengajuan ATK ditandai selesai.');
    }

    public function destroy(Request $request, AtkRequest $atk): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasRole('Admin')) {
            abort(403);
        }

        $atk->delete();

        return back()->with('success', 'Pengajuan ATK dihapus.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nama_pemesan' => ['required', 'string', 'max:255'],
            'nama_barang' => ['required', 'string', 'max:255'],
            'referensi' => ['nullable', 'string', 'max:255'],
            'merek' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'tanggal_pesan' => ['required', 'date'],
            'deadline' => ['required', 'date', 'after_or_equal:tanggal_pesan'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'bank' => ['required', 'string', 'max:255'],
            'budgeting' => ['required', Rule::in(array_keys(self::BUDGETING_OPTIONS))],
            'catatan' => ['nullable', 'string'],
        ]);
    }

    private function budgetingOptions(): array
    {
        return array_map(
            fn (string $value) => [
                'value' => $value,
                'label' => self::BUDGETING_OPTIONS[$value] ?? $value,
            ],
            array_keys(self::BUDGETING_OPTIONS)
        );
    }
}
