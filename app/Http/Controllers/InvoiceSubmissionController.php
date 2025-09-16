<?php

namespace App\Http\Controllers;

use App\Models\InvoiceSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceSubmissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
    }

    public function index(): Response
    {
        $invoices = InvoiceSubmission::query()
            ->with('user')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (InvoiceSubmission $inv) {
                return [
                    'id' => $inv->id,
                    'tanggal_pengajuan' => $inv->tanggal_pengajuan,
                    'tanggal_invoice' => $inv->tanggal_invoice,
                    'kegiatan' => $inv->kegiatan,
                    'tagihan_invoice' => (int) $inv->tagihan_invoice,
                    'ppn' => $inv->ppn,
                    'total_invoice_ope' => (int) $inv->total_invoice_ope,
                    'user' => [
                        'id' => $inv->user?->id,
                        'name' => $inv->user?->name,
                    ],
                    'download_url' => route('invoices.download', $inv->id),
                ];
            })
            ->withQueryString();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Invoices/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengajuan' => ['required', 'date'],
            'tanggal_invoice' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tagihan_invoice' => ['required'],
            'ppn' => ['required', 'in:include,exclude,tanpa'],
            'total_invoice_ope' => ['required'],
            'bukti_surat_konfirmasi' => ['required', 'file', 'mimes:pdf', 'max:5120'], // 5MB
        ]);

        // Normalize currency inputs (store in Rupiah as integer)
        $tagihan = (int) preg_replace('/\D/', '', (string) $request->input('tagihan_invoice'));
        $totalOpe = (int) preg_replace('/\D/', '', (string) $request->input('total_invoice_ope'));

        $path = $request->file('bukti_surat_konfirmasi')->store('invoices/konfirmasi');

        InvoiceSubmission::create([
            'user_id' => Auth::id(),
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'tanggal_invoice' => $validated['tanggal_invoice'],
            'kegiatan' => $validated['kegiatan'],
            'tagihan_invoice' => $tagihan,
            'ppn' => $validated['ppn'],
            'total_invoice_ope' => $totalOpe,
            'bukti_surat_konfirmasi' => $path,
        ]);

        return back()->with('success', 'Pengajuan Invoice tersimpan');
    }

    public function download(InvoiceSubmission $invoice)
    {
        $path = $invoice->bukti_surat_konfirmasi;
        if (!\Storage::exists($path)) {
            abort(404, 'File tidak ditemukan');
        }

        return \Storage::download($path);
    }
}
