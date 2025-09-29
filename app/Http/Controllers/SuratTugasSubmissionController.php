<?php

namespace App\Http\Controllers;

use App\Models\NomorSuratSubmission;
use App\Models\SuratTugasSubmission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\Rule;

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
            ->with(['user', 'pic', 'processor', 'nomorSurat'])
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
                    'nomor_surat_submission_id' => $submission->nomor_surat_submission_id,
                    'tanggal_pengajuan' => optional($submission->tanggal_pengajuan)->format('Y-m-d'),
                    'kegiatan' => $submission->kegiatan,
                    'tanggal_kegiatan' => optional($submission->tanggal_kegiatan)->format('Y-m-d'),
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
                    'nomor_surat' => $submission->nomorSurat?->formatted_nomor_surat,
                    'nomor_surat_detail' => $submission->nomorSurat ? [
                        'id' => $submission->nomorSurat->id,
                        'formatted' => $submission->nomorSurat->formatted_nomor_surat,
                        'tujuan_surat' => $submission->nomorSurat->tujuan_surat,
                        'nama_klien' => $submission->nomorSurat->nama_klien,
                        'tanggal_pengajuan' => optional($submission->nomorSurat->tanggal_pengajuan)->format('Y-m-d'),
                    ] : null,
                    'can_download_pdf' => $user ? $this->userCanDownload($user, $submission) : false,
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

        $canAssignNomor = $user?->hasAnyRole(['Admin', 'Supervisor']) ?? false;

        $nomorSuratOptions = [];
        if ($canAssignNomor) {
            $assignedNomorIds = collect($submissions->items())
                ->pluck('nomor_surat_submission_id')
                ->filter()
                ->unique();

            $nomorSuratOptions = NomorSuratSubmission::query()
                ->where(function ($query) use ($assignedNomorIds) {
                    $query->whereDoesntHave('suratTugas');
                    if ($assignedNomorIds->isNotEmpty()) {
                        $query->orWhereIn('id', $assignedNomorIds);
                    }
                })
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

        return Inertia::render('SuratTugas/Index', [
            'submissions' => $submissions,
            'picOptions' => $picOptions,
            'canManage' => $user?->hasRole('Admin') ?? false,
            'canModerate' => $user?->hasRole('Manager') ?? false,
            'canViewAll' => $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor']) ?? false,
            'canAssignNomor' => $canAssignNomor,
            'nomorSuratOptions' => $nomorSuratOptions,
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

        $suratTugas->loadMissing(['user', 'pic', 'processor', 'nomorSurat']);

        $data = [
            'id' => $suratTugas->id,
            'tanggal_pengajuan' => optional($suratTugas->tanggal_pengajuan)->format('Y-m-d'),
            'kegiatan' => $suratTugas->kegiatan,
            'tanggal_kegiatan' => optional($suratTugas->tanggal_kegiatan)->format('Y-m-d'),
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
            'nomor_surat' => $suratTugas->nomorSurat?->formatted_nomor_surat,
            'nomor_surat_detail' => $suratTugas->nomorSurat ? [
                'id' => $suratTugas->nomorSurat->id,
                'formatted' => $suratTugas->nomorSurat->formatted_nomor_surat,
                'tujuan_surat' => $suratTugas->nomorSurat->tujuan_surat,
                'nama_klien' => $suratTugas->nomorSurat->nama_klien,
                'tanggal_pengajuan' => optional($suratTugas->nomorSurat->tanggal_pengajuan)->format('Y-m-d'),
            ] : null,
        ];

        return Inertia::render('SuratTugas/Show', [
            'submission' => $data,
            'canModerate' => $isManager,
            'canEdit' => $isAdmin
                || ((($isKaryawan || $isPic)
                    && $suratTugas->user_id === $user?->id
                    && ($suratTugas->status ?? 'pending') === 'rejected')),
            'canDownloadPdf' => $user ? $this->userCanDownload($user, $suratTugas) : false,
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

    public function assignNomorSurat(Request $request, SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Supervisor'])) {
            abort(403);
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
            SuratTugasSubmission::where('nomor_surat_submission_id', $nomorSuratId)
                ->where('id', '!=', $suratTugas->id)
                ->update(['nomor_surat_submission_id' => null]);
        }

        $suratTugas->nomor_surat_submission_id = $nomorSuratId;
        $suratTugas->save();

        return back()->with(
            'success',
            $nomorSuratId ? 'Nomor surat berhasil dihubungkan ke surat tugas.' : 'Nomor surat dilepas dari surat tugas.'
        );
    }

    public function download(Request $request, SuratTugasSubmission $suratTugas): StreamedResponse
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'user']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $pdfContent = $this->buildPdf($suratTugas);
        $fileName = sprintf('surat-tugas-%d.pdf', $suratTugas->id);

        return response()->streamDownload(
            static function () use ($pdfContent) {
                echo $pdfContent;
            },
            $fileName,
            ['Content-Type' => 'application/pdf']
        );
    }

    private function buildPdf(SuratTugasSubmission $suratTugas): string
    {
        $title = 'SURAT TUGAS';
        $subtitle = $suratTugas->nomorSurat?->formatted_nomor_surat
            ?? sprintf('ID: %d', $suratTugas->id);
        $issuedAt = optional($suratTugas->tanggal_pengajuan)->translatedFormat('d F Y') ?? '-';

        $sections = [
            'DETAIL PENUGASAN' => [
                'Nama Kegiatan' => $suratTugas->kegiatan,
                'Tanggal Kegiatan' => optional($suratTugas->tanggal_kegiatan)->translatedFormat('d F Y') ?? '-',
                'Nama Pendampingan' => $suratTugas->nama_pendampingan,
                'PIC Penanggung Jawab' => $suratTugas->pic?->name ?? '-',
            ],
            'PEMBIAYAAN' => [
                'Fee Pendampingan' => $this->formatCurrency($suratTugas->fee_pendampingan),
                'Instruktur 1' => $this->formatInstructor($suratTugas->instruktor_1_nama, $suratTugas->instruktor_1_fee),
                'Instruktur 2' => $this->formatInstructor($suratTugas->instruktor_2_nama, $suratTugas->instruktor_2_fee),
                'Total Estimasi' => $this->formatCurrency(
                    ($suratTugas->fee_pendampingan ?? 0)
                    + ($suratTugas->instruktor_1_fee ?? 0)
                    + ($suratTugas->instruktor_2_fee ?? 0)
                ),
            ],
            'INFORMASI TAMBAHAN' => [
                'Status Persetujuan' => strtoupper($suratTugas->status ?? 'PENDING'),
                'Pengaju' => $suratTugas->user?->name ?? '-',
                'Tanggal Dibuat' => optional($suratTugas->created_at)->format('d F Y H:i') ?? '-',
            ],
        ];

        $stream = [];

        // Title & subtitle block
        $stream[] = 'BT';
        $stream[] = '/F2 20 Tf';
        $stream[] = '72 790 Td';
        $stream[] = '(' . $this->escapePdfText($title) . ') Tj';
        $stream[] = '/F1 12 Tf';
        $stream[] = '0 -24 Td';
        $stream[] = '(' . $this->escapePdfText('Nomor: ' . $subtitle) . ') Tj';
        $stream[] = '0 -18 Td';
        $stream[] = '(' . $this->escapePdfText('Tanggal Terbit: ' . $issuedAt) . ') Tj';
        $stream[] = 'ET';

        // Divider line
        $stream[] = '0.8 w';
        $stream[] = '72 738 m';
        $stream[] = '523 738 l';
        $stream[] = 'S';

        $currentY = 720;

        foreach ($sections as $label => $items) {
            // Section heading
            $stream[] = 'BT';
            $stream[] = '/F2 13 Tf';
            $stream[] = '72 ' . $currentY . ' Td';
            $stream[] = '(' . $this->escapePdfText($label) . ') Tj';
            $stream[] = 'ET';

            $currentY -= 18;

            foreach ($items as $key => $value) {
                $stream[] = 'BT';
                $stream[] = '/F3 11 Tf';
                $stream[] = '72 ' . $currentY . ' Td';
                $stream[] = '(' . $this->escapePdfText($key . ':') . ') Tj';
                $stream[] = 'ET';

                $stream[] = 'BT';
                $stream[] = '/F1 11 Tf';
                $stream[] = '200 ' . $currentY . ' Td';
                $stream[] = '(' . $this->escapePdfText($value) . ') Tj';
                $stream[] = 'ET';

                $currentY -= 16;
            }

            $currentY -= 10;
        }

        // Footer note
        $stream[] = 'BT';
        $stream[] = '/F1 9 Tf';
        $stream[] = '72 140 Td';
        $stream[] = '(' . $this->escapePdfText('Dokumen ini dihasilkan oleh sistem AP Operasional.') . ') Tj';
        $stream[] = 'ET';

        $streamContent = implode("\n", $stream) . "\n";
        $streamLength = strlen($streamContent);

        $objects = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj\n",
            "4 0 obj\n<< /Length {$streamLength} >>\nstream\n{$streamContent}endstream\nendobj\n",
            "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
            "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
            "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n";
        $pdf .= '0 ' . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }

        $pdf .= "trailer\n";
        $pdf .= "<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n";
        $pdf .= $xrefOffset . "\n";
        $pdf .= "%%EOF\n";

        return $pdf;
    }

    private function formatCurrency(?int $amount): string
    {
        return 'Rp ' . number_format((int) $amount, 0, ',', '.');
    }

    private function formatInstructor(?string $name, ?int $fee): string
    {
        if (! $name) {
            return '-';
        }

        return sprintf('%s (%s)', $name, $this->formatCurrency($fee));
    }

    private function userCanDownload(User $user, SuratTugasSubmission $submission): bool
    {
        if ($user->hasAnyRole(['Admin', 'Manager', 'Supervisor'])) {
            return true;
        }

        if ($user->hasRole('PIC')) {
            return ($submission->status ?? 'pending') === 'approved'
                && $submission->pic_id === $user->id;
        }

        return false;
    }

    private function escapePdfText(string $text): string
    {
        return strtr($text, [
            '\\' => '\\\\',
            '(' => '\\(',
            ')' => '\\)',
        ]);
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
