<?php

namespace App\Http\Controllers;

use App\Models\NomorSuratSubmission;
use App\Models\SuratTugasSubmission;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
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
            ->with(['user', 'pic', 'pics', 'processor', 'nomorSurat'])
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
                $pics = $submission->pics
                    ->map(fn (User $pic) => [
                        'id' => $pic->id,
                        'name' => $pic->name,
                        'email' => $pic->email,
                    ])
                    ->values();
                $instruktors = collect(range(1, 5))->map(function (int $index) use ($submission) {
                    $nameKey = "instruktor_{$index}_nama";
                    $feeKey = "instruktor_{$index}_fee";

                    return [
                        'nama' => $submission->{$nameKey},
                        'fee' => (int) $submission->{$feeKey},
                    ];
                })->filter(fn ($instruktor) => filled($instruktor['nama']))->values();

                $feePendampingan = (int) $submission->fee_pendampingan;
                $totalInstruktur = $instruktors->sum('fee');
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
                    'pics' => $pics,
                    'pic_ids' => $pics->pluck('id')->map(fn ($id) => (int) $id)->all(),
                    'nama_pendampingan' => $submission->nama_pendampingan,
                    'fee_pendampingan' => $feePendampingan,
                    'instruktor_1_nama' => $submission->instruktor_1_nama,
                    'instruktor_1_fee' => (int) $submission->instruktor_1_fee,
                    'instruktor_2_nama' => $submission->instruktor_2_nama,
                    'instruktor_2_fee' => (int) $submission->instruktor_2_fee,
                    'instruktor_3_nama' => $submission->instruktor_3_nama,
                    'instruktor_3_fee' => (int) $submission->instruktor_3_fee,
                    'instruktor_4_nama' => $submission->instruktor_4_nama,
                    'instruktor_4_fee' => (int) $submission->instruktor_4_fee,
                    'instruktor_5_nama' => $submission->instruktor_5_nama,
                    'instruktor_5_fee' => (int) $submission->instruktor_5_fee,
                    'total_fee_instruktur' => $totalInstruktur,
                    'total_fee' => $totalKeseluruhan,
                    'instruktors' => $instruktors,
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
                    'processed_at' => optional($submission->processed_at)->format('Y-m-d H:i'),
                    'nomor_surat' => $submission->nomorSurat?->formatted_nomor_surat,
                    'nomor_surat_detail' => $submission->nomorSurat ? [
                        'id' => $submission->nomorSurat->id,
                        'formatted' => $submission->nomorSurat->formatted_nomor_surat,
                        'tujuan_surat' => $submission->nomorSurat->tujuan_surat,
                        'nama_klien' => $submission->nomorSurat->nama_klien,
                        'tanggal_pengajuan' => optional($submission->nomorSurat->tanggal_pengajuan)->format('Y-m-d'),
                    ] : null,
                    'can_download_pdf' => $user ? $this->userCanDownload($user, $submission) : false,
                    'download_urls' => $user && $this->userCanDownload($user, $submission) ? [
                        'utama' => route('surat-tugas.download', $submission->id),
                        'pic' => route('surat-tugas.download-pic', $submission->id),
                        'trainer' => route('surat-tugas.download-trainer', $submission->id),
                        'pendamping' => route('surat-tugas.download-pendamping', $submission->id),
                        'instruktur' => route('surat-tugas.download-instruktur', $submission->id),
                    ] : null,
                    'preview_url' => $status === 'approved'
                        && $user
                        && $this->userCanDownload($user, $submission)
                        ? route('surat-tugas.preview-pdf', $submission->id)
                        : null,
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
        $rules = [
            'tanggal_pengajuan' => ['required', 'date'],
            'kegiatan' => ['required', 'string', 'max:255'],
            'tanggal_kegiatan' => ['required', 'date'],
            'pic_ids' => ['required', 'array', 'min:1'],
            'pic_ids.*' => ['integer', Rule::exists('users', 'id')],
            'nama_pendampingan' => ['nullable', 'string', 'max:255'],
            'fee_pendampingan' => ['nullable'],
        ];

        foreach (range(1, 5) as $index) {
            $nameRule = $index === 1 ? ['required', 'string', 'max:255'] : ['nullable', 'string', 'max:255'];
            $feeRule = $index === 1 ? ['required'] : ['nullable'];

            $rules["instruktor_{$index}_nama"] = $nameRule;
            $rules["instruktor_{$index}_fee"] = $feeRule;
        }

        $validated = $request->validate($rules);

        $picIds = collect($validated['pic_ids'] ?? [])
            ->map(fn ($value) => (int) $value)
            ->filter()
            ->unique()
            ->values();

        if ($picIds->isEmpty()) {
            return back()->with('error', 'Pilih minimal satu PIC.');
        }

        $pics = User::whereIn('id', $picIds)->get();

        if ($pics->count() !== $picIds->count()) {
            return back()->with('error', 'PIC yang dipilih tidak valid.');
        }

        $invalidPic = $pics->first(fn (User $user) => ! $user->hasRole('PIC'));
        if ($invalidPic) {
            return back()->with('error', 'PIC yang dipilih tidak valid.');
        }

        $primaryPicId = $picIds->first();

        $feePendampingan = (int) preg_replace('/\D/', '', (string) $request->input('fee_pendampingan'));
        $instruktorFees = [];
        foreach (range(1, 5) as $index) {
            $feeKey = "instruktor_{$index}_fee";
            $instruktorFees[$feeKey] = (int) preg_replace('/\D/', '', (string) $request->input($feeKey));
        }

        $namaPendampingan = $request->filled('nama_pendampingan')
            ? trim((string) $request->input('nama_pendampingan'))
            : '';

        $payload = [
            'user_id' => Auth::id(),
            'tanggal_pengajuan' => $validated['tanggal_pengajuan'],
            'kegiatan' => $validated['kegiatan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'pic_id' => $primaryPicId,
            'nama_pendampingan' => $namaPendampingan,
            'fee_pendampingan' => $feePendampingan,
            'status' => 'pending',
        ];

        foreach (range(1, 5) as $index) {
            $nameKey = "instruktor_{$index}_nama";
            $feeKey = "instruktor_{$index}_fee";

            $nameValue = $validated[$nameKey] ?? null;
            if ($nameValue === '') {
                $nameValue = null;
            }

            $payload[$nameKey] = $nameValue;
            $payload[$feeKey] = $nameValue ? ($instruktorFees[$feeKey] ?? 0) : 0;
        }

        $submission = SuratTugasSubmission::create($payload);

        $submission->pics()->sync(
            $picIds
                ->mapWithKeys(fn ($id, $index) => [
                    $id => ['position' => $index + 1],
                ])
                ->all()
        );

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

        $suratTugas->loadMissing(['user', 'pic', 'pics', 'processor', 'nomorSurat']);

        $instruktors = collect(range(1, 5))->map(function (int $index) use ($suratTugas) {
            $nameKey = "instruktor_{$index}_nama";
            $feeKey = "instruktor_{$index}_fee";

            return [
                'nama' => $suratTugas->{$nameKey},
                'fee' => (int) $suratTugas->{$feeKey},
            ];
        })->filter(fn ($instruktor) => filled($instruktor['nama']))->values();

        $feePendampingan = (int) $suratTugas->fee_pendampingan;
        $totalInstruktur = $instruktors->sum('fee');
        $totalKeseluruhan = $feePendampingan + $totalInstruktur;

        $pics = $suratTugas->pics
            ->map(fn (User $pic) => [
                'id' => $pic->id,
                'name' => $pic->name,
                'email' => $pic->email,
            ])
            ->values();

        $data = [
            'id' => $suratTugas->id,
            'tanggal_pengajuan' => optional($suratTugas->tanggal_pengajuan)->format('Y-m-d'),
            'kegiatan' => $suratTugas->kegiatan,
            'tanggal_kegiatan' => optional($suratTugas->tanggal_kegiatan)->format('Y-m-d'),
            'nama_pendampingan' => $suratTugas->nama_pendampingan,
            'fee_pendampingan' => $feePendampingan,
            'pic_ids' => $pics->pluck('id')->map(fn ($id) => (int) $id)->all(),
            'instruktor_1_nama' => $suratTugas->instruktor_1_nama,
            'instruktor_1_fee' => (int) $suratTugas->instruktor_1_fee,
            'instruktor_2_nama' => $suratTugas->instruktor_2_nama,
            'instruktor_2_fee' => (int) $suratTugas->instruktor_2_fee,
            'instruktor_3_nama' => $suratTugas->instruktor_3_nama,
            'instruktor_3_fee' => (int) $suratTugas->instruktor_3_fee,
            'instruktor_4_nama' => $suratTugas->instruktor_4_nama,
            'instruktor_4_fee' => (int) $suratTugas->instruktor_4_fee,
            'instruktor_5_nama' => $suratTugas->instruktor_5_nama,
            'instruktor_5_fee' => (int) $suratTugas->instruktor_5_fee,
            'total_fee_instruktur' => $totalInstruktur,
            'total_fee' => $totalKeseluruhan,
            'instruktors' => $instruktors,
            'status' => $suratTugas->status ?? 'pending',
            'catatan_revisi' => $suratTugas->catatan_revisi,
            'processed_at' => optional($suratTugas->processed_at)->format('Y-m-d H:i'),
            'pic' => $suratTugas->pic ? [
                'id' => $suratTugas->pic->id,
                'name' => $suratTugas->pic->name,
                'email' => $suratTugas->pic->email,
            ] : null,
            'pics' => $pics,
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
            'downloadUrls' => $user && $this->userCanDownload($user, $suratTugas) ? [
                'utama' => route('surat-tugas.download', $suratTugas->id),
                'pic' => route('surat-tugas.download-pic', $suratTugas->id),
                'trainer' => route('surat-tugas.download-trainer', $suratTugas->id),
                'pendamping' => route('surat-tugas.download-pendamping', $suratTugas->id),
                'instruktur' => route('surat-tugas.download-instruktur', $suratTugas->id),
            ] : null,
            'previewUrl' => ($suratTugas->status ?? 'pending') === 'approved'
                && $user
                && $this->userCanDownload($user, $suratTugas)
                ? route('surat-tugas.preview-pdf', $suratTugas->id)
                : null,
        ]);
    }

    public function previewPdf(Request $request, SuratTugasSubmission $suratTugas): Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user']);

        if (($suratTugas->status ?? 'pending') !== 'approved') {
            abort(403);
        }

        if (($suratTugas->status ?? 'pending') !== 'approved') {
            abort(403);
        }

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $picOptions = $suratTugas->pics
            ->map(fn (User $pic) => [
                'id' => $pic->id,
                'name' => $pic->name,
            ])
            ->values();

        $selectedPicId = (int) $request->input('pic_id');
        if ($picOptions->isEmpty()) {
            $selectedPicId = 0;
        } elseif (! $picOptions->contains(fn ($option) => $option['id'] === $selectedPicId)) {
            $selectedPicId = $picOptions->first()['id'];
        }
        if ($selectedPicId === 0) {
            $selectedPicId = null;
        }

        $instructorOptions = collect(range(1, 5))
            ->map(function (int $index) use ($suratTugas) {
                $nameKey = "instruktor_{$index}_nama";
                $feeKey = "instruktor_{$index}_fee";

                $name = $suratTugas->{$nameKey};
                if (! filled($name)) {
                    return null;
                }

                return [
                    'index' => $index,
                    'name' => $name,
                    'fee' => (int) $suratTugas->{$feeKey},
                ];
            })
            ->filter()
            ->values();

        $selectedInstructorIndex = (int) $request->input('instructor');
        if ($instructorOptions->isEmpty()) {
            $selectedInstructorIndex = 0;
        } elseif (! $instructorOptions->contains(fn ($option) => $option['index'] === $selectedInstructorIndex)) {
            $selectedInstructorIndex = $instructorOptions->first()['index'];
        }
        if ($selectedInstructorIndex === 0) {
            $selectedInstructorIndex = null;
        }

        $template = $request->input('template', 'pic');
        if (! in_array($template, ['pic', 'trainer'], true)) {
            $template = 'pic';
        }

        $routeParameters = ['suratTugas' => $suratTugas->id];
        if ($template === 'pic' && $selectedPicId) {
            $routeParameters['pic_id'] = $selectedPicId;
        }
        if ($template === 'trainer' && $selectedInstructorIndex) {
            $routeParameters['instructor'] = $selectedInstructorIndex;
        }

        $previewRoute = $template === 'trainer'
            ? 'surat-tugas.preview-trainer-stream'
            : 'surat-tugas.preview-pic-stream';

        $downloadRoute = $template === 'trainer'
            ? 'surat-tugas.download-trainer'
            : 'surat-tugas.download-pic';

        return Inertia::render('SuratTugas/PdfPreview', [
            'submission' => [
                'id' => $suratTugas->id,
                'kegiatan' => $suratTugas->kegiatan,
                'tanggal_pengajuan' => optional($suratTugas->tanggal_pengajuan)->format('Y-m-d'),
                'nama_pic' => $picOptions->pluck('name')->filter()->implode(', ') ?: optional($suratTugas->pic)->name,
                'status' => $suratTugas->status ?? 'pending',
            ],
            'previewUrl' => route($previewRoute, $routeParameters),
            'downloadUrl' => route($downloadRoute, $routeParameters),
            'backUrl' => route('surat-tugas.index'),
            'picOptions' => $picOptions->all(),
            'selectedPicId' => $selectedPicId,
            'instructorOptions' => $instructorOptions->all(),
            'selectedInstructorIndex' => $selectedInstructorIndex,
            'template' => $template,
        ]);
    }

    public function update(Request $request, SuratTugasSubmission $suratTugas): RedirectResponse
    {
        $keysToNullifyIfEmpty = [
            'tanggal_pengajuan',
            'kegiatan',
            'tanggal_kegiatan',
            'nama_pendampingan',
        ];

        foreach ($keysToNullifyIfEmpty as $key) {
            if ($request->has($key) && $request->input($key) === '') {
                $request->merge([$key => null]);
            }
        }

        $rules = [
            'tanggal_pengajuan' => ['sometimes', 'nullable', 'date'],
            'kegiatan' => ['sometimes', 'nullable', 'string', 'max:255'],
            'tanggal_kegiatan' => ['sometimes', 'nullable', 'date'],
            'pic_ids' => ['sometimes', 'array', 'min:1'],
            'pic_ids.*' => ['sometimes', 'integer', Rule::exists('users', 'id')],
            'nama_pendampingan' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fee_pendampingan' => ['sometimes', 'nullable'],
        ];

        foreach (range(1, 5) as $index) {
            $rules["instruktor_{$index}_nama"] = ['sometimes', 'nullable', 'string', 'max:255'];
            $rules["instruktor_{$index}_fee"] = ['sometimes', 'nullable'];
        }

        $validated = $request->validate($rules);

        $picIds = null;
        if (array_key_exists('pic_ids', $validated)) {
            $picIds = collect($validated['pic_ids'] ?? [])
                ->map(fn ($value) => (int) $value)
                ->filter()
                ->unique()
                ->values();

            if ($picIds->isEmpty()) {
                return back()->with('error', 'Pilih minimal satu PIC.');
            }
        }

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

        $primaryPicId = null;

        if ($picIds !== null) {
            $pics = User::whereIn('id', $picIds)->get();

            if ($pics->count() !== $picIds->count()) {
                return back()->with('error', 'PIC yang dipilih tidak valid.');
            }

            $invalidPic = $pics->first(fn (User $candidate) => ! $candidate->hasRole('PIC'));
            if ($invalidPic) {
                return back()->with('error', 'PIC yang dipilih tidak valid.');
            }

            $primaryPicId = $picIds->first();
        }

        $updates = [];

        if (array_key_exists('tanggal_pengajuan', $validated) && filled($validated['tanggal_pengajuan'])) {
            $updates['tanggal_pengajuan'] = $validated['tanggal_pengajuan'];
        }

        if (array_key_exists('kegiatan', $validated) && filled($validated['kegiatan'])) {
            $updates['kegiatan'] = trim((string) $validated['kegiatan']);
        }

        if (array_key_exists('tanggal_kegiatan', $validated) && filled($validated['tanggal_kegiatan'])) {
            $updates['tanggal_kegiatan'] = $validated['tanggal_kegiatan'];
        }

        if ($primaryPicId !== null) {
            $updates['pic_id'] = $primaryPicId;
        }

        if (array_key_exists('nama_pendampingan', $validated) && filled($validated['nama_pendampingan'])) {
            $updates['nama_pendampingan'] = trim((string) $validated['nama_pendampingan']);
        }

        if ($request->has('fee_pendampingan')) {
            $rawFeePendampingan = (string) $request->input('fee_pendampingan');
            if ($rawFeePendampingan !== '') {
                $updates['fee_pendampingan'] = (int) preg_replace('/\D/', '', $rawFeePendampingan);
            }
        }

        foreach (range(1, 5) as $index) {
            $nameKey = "instruktor_{$index}_nama";
            $feeKey = "instruktor_{$index}_fee";

            if (! array_key_exists($nameKey, $validated)) {
                continue;
            }

            $nameValue = $validated[$nameKey];

            if (! filled($nameValue)) {
                continue;
            }

            $updates[$nameKey] = trim((string) $nameValue);

            if ($request->has($feeKey)) {
                $rawFee = (string) $request->input($feeKey);
                if ($rawFee !== '') {
                    $updates[$feeKey] = (int) preg_replace('/\D/', '', $rawFee);
                }
            }
        }

        if (! empty($updates)) {
            $suratTugas->fill($updates);
        }

        if (($isKaryawan || $isPic) && ! $isAdmin) {
            $suratTugas->status = 'pending';
            $suratTugas->catatan_revisi = null;
            $suratTugas->processed_by = null;
            $suratTugas->processed_at = null;
        }

        $suratTugas->save();

        if ($isAdmin) {
            $suratTugas->refresh();
            $suratTugas->user_id = $suratTugas->getOriginal('user_id');
            $suratTugas->save();
        }

        if ($picIds !== null) {
            $suratTugas->pics()->sync(
                $picIds
                    ->mapWithKeys(fn ($id, $index) => [
                        $id => ['position' => $index + 1],
                    ])
                    ->all()
            );
        }

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

    public function download(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (($suratTugas->status ?? 'pending') !== 'approved') {
            abort(403);
        }

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $pdf = Pdf::loadView('pdf.surat-tugas', ['suratTugas' => $suratTugas]);
        $fileName = sprintf('surat-tugas-%d.pdf', $suratTugas->id);

        return $pdf->download($fileName);
    }

    public function downloadPicTemplate(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $selectedPicId = (int) $request->input('pic_id');
        if ($selectedPicId) {
            $selectedPic = $suratTugas->pics->firstWhere('id', $selectedPicId);
            if ($selectedPic) {
                $suratTugas->setRelation('pic', $selectedPic);
            }
        }

        $pdf = Pdf::loadView('pdf.surat-tugas-pic', ['suratTugas' => $suratTugas]);
        $fileName = sprintf('surat-tugas-pic-%d.pdf', $suratTugas->id);

        return $pdf->download($fileName);
    }

    public function streamPicTemplate(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $selectedPicId = (int) $request->input('pic_id');
        if ($selectedPicId) {
            $selectedPic = $suratTugas->pics->firstWhere('id', $selectedPicId);
            if ($selectedPic) {
                $suratTugas->setRelation('pic', $selectedPic);
            }
        }

        $pdf = Pdf::loadView('pdf.surat-tugas-pic', ['suratTugas' => $suratTugas]);
        $fileName = sprintf('surat-tugas-pic-%d.pdf', $suratTugas->id);

        return $pdf->stream($fileName, ['Attachment' => false]);
    }

    public function downloadTrainerTemplate(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $selectedInstructorIndex = (int) $request->input('instructor');
        $selectedInstructor = null;
        if ($selectedInstructorIndex) {
            $selectedInstructor = $this->getInstructorByIndex($suratTugas, $selectedInstructorIndex);
        }

        $pdf = Pdf::loadView('pdf.surat-tugas-trainer', [
            'suratTugas' => $suratTugas,
            'selectedInstructorIndex' => $selectedInstructorIndex,
            'selectedInstructor' => $selectedInstructor,
        ]);
        $fileName = sprintf('surat-tugas-trainer-%d.pdf', $suratTugas->id);

        return $pdf->download($fileName);
    }

    public function streamTrainerTemplate(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $selectedInstructorIndex = (int) $request->input('instructor');
        $selectedInstructor = null;
        if ($selectedInstructorIndex) {
            $selectedInstructor = $this->getInstructorByIndex($suratTugas, $selectedInstructorIndex);
        }

        $pdf = Pdf::loadView('pdf.surat-tugas-trainer', [
            'suratTugas' => $suratTugas,
            'selectedInstructorIndex' => $selectedInstructorIndex,
            'selectedInstructor' => $selectedInstructor,
        ]);
        $fileName = sprintf('surat-tugas-trainer-%d.pdf', $suratTugas->id);

        return $pdf->stream($fileName, ['Attachment' => false]);
    }

    public function downloadPendampingTemplate(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $pdf = Pdf::loadView('pdf.surat-tugas-pendamping', ['suratTugas' => $suratTugas]);
        $fileName = sprintf('surat-tugas-pendamping-%d.pdf', $suratTugas->id);

        return $pdf->download($fileName);
    }

    public function downloadInstrukturTemplate(Request $request, SuratTugasSubmission $suratTugas): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user?->hasAnyRole(['Admin', 'Manager', 'Supervisor', 'PIC'])) {
            abort(403);
        }

        $suratTugas->loadMissing(['nomorSurat', 'pic', 'pics', 'user', 'processor']);

        if (! $this->userCanDownload($user, $suratTugas)) {
            abort(403);
        }

        $pdf = Pdf::loadView('pdf.surat-tugas-instruktur', ['suratTugas' => $suratTugas]);
        $fileName = sprintf('surat-tugas-instruktur-%d.pdf', $suratTugas->id);

        return $pdf->download($fileName);
    }

    private function getInstructorByIndex(SuratTugasSubmission $suratTugas, int $index): ?array
    {
        if ($index < 1 || $index > 5) {
            return null;
        }

        $nameKey = "instruktor_{$index}_nama";
        $feeKey = "instruktor_{$index}_fee";
        $name = $suratTugas->{$nameKey};

        if (! filled($name)) {
            return null;
        }

        return [
            'index' => $index,
            'name' => $name,
            'fee' => (int) $suratTugas->{$feeKey},
        ];
    }

    private function userCanDownload(User $user, SuratTugasSubmission $submission): bool
    {
        if ($user->hasAnyRole(['Admin', 'Manager', 'Supervisor'])) {
            return true;
        }

        if ($user->hasRole('PIC')) {
            $submission->loadMissing('pics');

            return ($submission->status ?? 'pending') === 'approved'
                && $submission->pics->contains('id', $user->id);
        }

        return false;
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
