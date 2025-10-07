<?php

namespace App\Http\Controllers;

use App\Models\InvoiceSubmission;
use App\Models\NomorSuratSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceSubmissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false;

        $invoices = InvoiceSubmission::query()
            ->with(['user', 'nomorSurat', 'approvedBy', 'opeItems'])
            ->when(! $canViewAll, fn ($query) => $query->where('user_id', $user?->id))
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (InvoiceSubmission $inv) {
                $tanggalPengajuan = $inv->tanggal_pengajuan ? $inv->tanggal_pengajuan->format('Y-m-d') : null;
                $createdAt = $inv->created_at ? $inv->created_at->copy()->timezone(config('app.timezone')) : null;
                $jamPengajuan = $createdAt?->format('H:i');
                $tanggalPengajuanDisplay = $tanggalPengajuan;
                if ($tanggalPengajuan && $jamPengajuan) {
                    $tanggalPengajuanDisplay = trim($tanggalPengajuan . ' ' . $jamPengajuan);
                }

                return [
                    'id' => $inv->id,
                    'tanggal_pengajuan' => $tanggalPengajuan,
                    'tanggal_pengajuan_display' => $tanggalPengajuanDisplay,
                    'jam_pengajuan' => $jamPengajuan,
                    'tanggal_invoice' => $inv->tanggal_invoice ? $inv->tanggal_invoice->format('Y-m-d') : null,
                    'kegiatan' => $inv->kegiatan,
                    'tagihan_invoice' => (int) $inv->tagihan_invoice,
                    'ppn' => $inv->ppn,
                    'total_invoice_ope' => (int) $inv->total_invoice_ope,
                    'total_tagihan' => (int) $inv->total_tagihan,
                    'user' => [
                        'id' => $inv->user?->id,
                        'name' => $inv->user?->name,
                    ],
                    'nomor_surat_submission_id' => $inv->nomor_surat_submission_id,
                    'nomor_surat' => $inv->nomorSurat?->formatted_nomor_surat,
                    'status' => $inv->status,
                    'manager_notes' => $inv->manager_notes,
                    'approved_by' => $inv->approvedBy?->name,
                    'approved_at' => $inv->approved_at?->format('Y-m-d H:i'),
                    'download_url' => route('invoices.download', $inv->id),
                    'bukti_surat_konfirmasi_name' => $inv->bukti_surat_konfirmasi ? basename($inv->bukti_surat_konfirmasi) : null,
                    'ope_items' => $inv->opeItems->map(fn ($item) => [
                        'id' => $item->id,
                        'deskripsi' => $item->deskripsi,
                        'nominal' => (int) $item->nominal,
                    ])->values(),
                ];
            })
            ->withQueryString();

        $canAssignNomor = $user?->hasAnyRole(['Admin', 'Supervisor']) ?? false;
        
        $nomorSuratOptions = [];
        if ($canAssignNomor) {
            $assignedNomorIds = collect($invoices->items())
                ->pluck('nomor_surat_submission_id')
                ->filter()
                ->unique();

            $nomorSuratOptions = NomorSuratSubmission::query()
                ->whereDoesntHave('suratTugas')
                ->whereDoesntHave('invoice')
                ->orderByDesc('tanggal_pengajuan')
                ->limit(100)
                ->get()
                ->map(fn (NomorSuratSubmission $nomor) => [
                    'id' => $nomor->id,
                    'formatted' => $nomor->formatted_nomor_surat,
                    'tujuan_surat' => $nomor->tujuan_surat,
                    'tanggal_pengajuan' => optional($nomor->tanggal_pengajuan)->format('Y-m-d'),
                    'nama_klien' => $nomor->nama_klien,
                ])
                ->values();
        }

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'canManageInvoices' => $user?->hasRole('Admin') ?? false,
            'canViewAllInvoices' => $canViewAll,
            'canAssignNomor' => $canAssignNomor,
            'canModerateInvoices' => $user?->hasRole('Manager') ?? false,
            'nomorSuratOptions' => $nomorSuratOptions,
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $canAssignNomor = $user?->hasAnyRole(['Admin', 'Supervisor']) ?? false;
        
        $nomorSuratOptions = [];
        if ($canAssignNomor) {
            $nomorSuratOptions = NomorSuratSubmission::query()
                ->whereDoesntHave('suratTugas') // tidak terpakai di surat tugas
                ->whereDoesntHave('invoice') // tidak terpakai di invoice
                ->orderByDesc('tanggal_pengajuan')
                ->limit(100)
                ->get()
                ->map(fn (NomorSuratSubmission $nomor) => [
                    'id' => $nomor->id,
                    'formatted' => $nomor->formatted_nomor_surat,
                    'tujuan_surat' => $nomor->tujuan_surat,
                    'tanggal_pengajuan' => optional($nomor->tanggal_pengajuan)->format('Y-m-d'),
                    'nama_klien' => $nomor->nama_klien,
                ])
                ->values();
        }

        return Inertia::render('Invoices/Create', [
            'canAssignNomor' => $canAssignNomor,
            'nomorSuratOptions' => $nomorSuratOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'tanggal_invoice' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tagihan_invoice' => ['required'],
            'ppn' => ['required', 'in:include,exclude,tanpa'],
            'ope_items' => ['required', 'array', 'min:1'],
            'ope_items.*.deskripsi' => ['required', 'string', 'max:255'],
            'ope_items.*.nominal' => ['required', 'integer', 'min:0'],
            'bukti_surat_konfirmasi' => ['required', 'file', 'mimes:pdf', 'max:5120'], // 5MB
        ]);

        // Normalize currency inputs (store in Rupiah as integer)
        $tagihan = (int) preg_replace('/\D/', '', (string) $request->input('tagihan_invoice'));
        $opeItems = collect($validated['ope_items'])
            ->map(function (array $item) {
                $nominal = (int) preg_replace('/\D/', '', (string) $item['nominal']);

                return [
                    'deskripsi' => $item['deskripsi'],
                    'nominal' => $nominal,
                ];
            });

        $totalOpe = $opeItems->sum('nominal');
        $ppnRate = strcasecmp($validated['ppn'], 'include') === 0 ? 0.11 : 0;
        $ppnAmount = (int) round($tagihan * $ppnRate);
        $totalTagihan = $tagihan + $ppnAmount + $totalOpe;

        $path = $request->file('bukti_surat_konfirmasi')->store('invoices/konfirmasi');

        DB::transaction(function () use ($validated, $tagihan, $totalOpe, $totalTagihan, $path, $opeItems) {
            $invoice = InvoiceSubmission::create([
                'user_id' => Auth::id(),
                'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
                'tanggal_invoice' => $validated['tanggal_invoice'],
                'kegiatan' => $validated['kegiatan'],
                'tagihan_invoice' => $tagihan,
                'ppn' => $validated['ppn'],
                'total_invoice_ope' => $totalOpe,
                'total_tagihan' => $totalTagihan,
                'bukti_surat_konfirmasi' => $path,
            ]);

            $invoice->opeItems()->createMany($opeItems->all());
        });

        return back()->with('success', 'Pengajuan Invoice tersimpan');
    }

    public function update(Request $request, InvoiceSubmission $invoice): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'tanggal_invoice' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tagihan_invoice' => ['required'],
            'ppn' => ['required', 'in:include,exclude,tanpa'],
            'ope_items' => ['required', 'array', 'min:1'],
            'ope_items.*.deskripsi' => ['required', 'string', 'max:255'],
            'ope_items.*.nominal' => ['required', 'integer', 'min:0'],
            'bukti_surat_konfirmasi' => ['sometimes', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $tagihan = (int) preg_replace('/\D/', '', (string) $request->input('tagihan_invoice'));
        $opeItems = collect($validated['ope_items'])
            ->map(function (array $item) {
                $nominal = (int) preg_replace('/\D/', '', (string) $item['nominal']);

                return [
                    'deskripsi' => $item['deskripsi'],
                    'nominal' => $nominal,
                ];
            });

        $totalOpe = $opeItems->sum('nominal');
        $ppnRate = strcasecmp($validated['ppn'], 'include') === 0 ? 0.11 : 0;
        $ppnAmount = (int) round($tagihan * $ppnRate);
        $totalTagihan = $tagihan + $ppnAmount + $totalOpe;
        $newAttachment = null;
        if ($request->hasFile('bukti_surat_konfirmasi')) {
            $newAttachment = $request->file('bukti_surat_konfirmasi')->store('invoices/konfirmasi');
        }

        DB::transaction(function () use ($invoice, $validated, $tagihan, $totalOpe, $totalTagihan, $opeItems, $newAttachment) {
            if ($newAttachment) {
                if ($invoice->bukti_surat_konfirmasi && \Storage::exists($invoice->bukti_surat_konfirmasi)) {
                    \Storage::delete($invoice->bukti_surat_konfirmasi);
                }

                $invoice->bukti_surat_konfirmasi = $newAttachment;
            }

            $invoice->fill([
                'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
                'tanggal_invoice' => $validated['tanggal_invoice'],
                'kegiatan' => $validated['kegiatan'],
                'tagihan_invoice' => $tagihan,
                'ppn' => $validated['ppn'],
                'total_invoice_ope' => $totalOpe,
                'total_tagihan' => $totalTagihan,
            ]);

            $invoice->save();

            $invoice->opeItems()->delete();
            $invoice->opeItems()->createMany($opeItems->all());
        });

        return back()->with('success', 'Pengajuan Invoice diperbarui');
    }

    public function destroy(InvoiceSubmission $invoice): RedirectResponse
    {
        if ($invoice->bukti_surat_konfirmasi && \Storage::exists($invoice->bukti_surat_konfirmasi)) {
            \Storage::delete($invoice->bukti_surat_konfirmasi);
        }

        $invoice->delete();

        return back()->with('success', 'Pengajuan Invoice dihapus');
    }



    public function download(Request $request, InvoiceSubmission $invoice)
    {
        $user = $request->user();
        $canViewAll = $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false;

        if (! $canViewAll && $invoice->user_id !== $user?->id) {
            abort(403);
        }

        $path = $invoice->bukti_surat_konfirmasi;
        if (!\Storage::exists($path)) {
            abort(404, 'File tidak ditemukan');
        }

        return \Storage::download($path);
    }

    public function assignNomorSurat(Request $request, InvoiceSubmission $invoice): RedirectResponse
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Supervisor'])) {
            abort(403);
        }

        $rawNomorId = $request->input('nomor_surat_submission_id');
        if ($rawNomorId === 'null' || $rawNomorId === '' || $rawNomorId === null) {
            $request->merge(['nomor_surat_submission_id' => null]);
        }

        $validated = $request->validate([
            'nomor_surat_submission_id' => [
                'nullable',
                'integer',
                'exists:nomor_surat_submissions,id',
            ],
        ]);

        $nomorSuratId = $validated['nomor_surat_submission_id'] ?? null;

        if ($nomorSuratId) {
            InvoiceSubmission::where('nomor_surat_submission_id', $nomorSuratId)
                ->where('id', '!=', $invoice->id)
                ->update(['nomor_surat_submission_id' => null]);
        }

        $invoice->nomor_surat_submission_id = $nomorSuratId;
        $invoice->save();

        return back()->with(
            'success',
            $nomorSuratId ? 'Nomor surat berhasil dihubungkan ke invoice.' : 'Nomor surat dilepas dari invoice.'
        );
    }

    public function approve(Request $request, InvoiceSubmission $invoice): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        if (! $user?->hasRole('Manager')) {
            abort(403);
        }

        $validated = $request->validate([
            'manager_notes' => 'nullable|string|max:500',
        ]);

        $invoice->update([
            'status' => 'approved',
            'manager_notes' => $validated['manager_notes'] ?? null,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Invoice berhasil disetujui.');
    }

    public function reject(Request $request, InvoiceSubmission $invoice): \Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        if (! $user?->hasRole('Manager')) {
            abort(403);
        }

        $validated = $request->validate([
            'manager_notes' => 'required|string|max:500',
        ]);

        $invoice->update([
            'status' => 'rejected',
            'manager_notes' => $validated['manager_notes'],
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Invoice berhasil ditolak.');
    }


}
