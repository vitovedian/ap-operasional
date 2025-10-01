<?php

namespace App\Http\Controllers;

use App\Models\AtkRequest;
use App\Models\InventoryLoanSubmission;
use App\Models\InvoiceSubmission;
use App\Models\NomorSuratSubmission;
use App\Models\SpjSubmission;
use App\Models\SuratTugasSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $resources = [
            [
                'key' => 'nomor-surat',
                'label' => 'Nomor Surat',
                'indexRoute' => 'nomor-surat.index',
                'createRoute' => 'nomor-surat.create',
                'allowedRoles' => ['Admin', 'Manager', 'Supervisor', 'Karyawan', 'PIC'],
                'createRoles' => ['Admin', 'Supervisor', 'Karyawan', 'PIC'],
                'description' => 'Kelola dan ajukan nomor surat resmi.',
            ],
            [
                'key' => 'surat-tugas',
                'label' => 'Surat Tugas',
                'indexRoute' => 'surat-tugas.index',
                'createRoute' => 'surat-tugas.create',
                'allowedRoles' => ['Admin', 'Manager', 'Supervisor', 'Karyawan', 'PIC'],
                'createRoles' => ['Admin', 'Karyawan', 'PIC'],
                'description' => 'Pantau pengajuan surat tugas dan statusnya.',
            ],
            [
                'key' => 'invoices',
                'label' => 'Invoice',
                'indexRoute' => 'invoices.index',
                'createRoute' => 'invoices.create',
                'allowedRoles' => ['Admin', 'Manager', 'Supervisor', 'Karyawan', 'PIC'],
                'createRoles' => ['Admin', 'Karyawan', 'PIC'],
                'description' => 'Pengajuan dan persetujuan invoice operasional.',
            ],
            [
                'key' => 'spj',
                'label' => 'Form SPJ',
                'indexRoute' => 'spj.index',
                'createRoute' => 'spj.create',
                'allowedRoles' => ['Admin', 'Manager', 'Supervisor', 'Karyawan', 'PIC'],
                'createRoles' => ['Admin', 'Karyawan', 'PIC'],
                'description' => 'Pelaporan pertanggungjawaban kegiatan.',
            ],
            [
                'key' => 'peminjaman-inventaris',
                'label' => 'Peminjaman Inventaris',
                'indexRoute' => 'peminjaman-inventaris.index',
                'createRoute' => 'peminjaman-inventaris.create',
                'allowedRoles' => ['Admin', 'Manager', 'Supervisor', 'Karyawan', 'PIC'],
                'createRoles' => ['Admin', 'Karyawan', 'PIC'],
                'description' => 'Ajukan dan awasi peminjaman inventaris.',
            ],
            [
                'key' => 'atk-requests',
                'label' => 'Permintaan ATK',
                'indexRoute' => 'atk-requests.index',
                'createRoute' => 'atk-requests.create',
                'allowedRoles' => ['Admin', 'Manager', 'Supervisor', 'PIC'],
                'createRoles' => ['Admin', 'PIC'],
                'description' => 'Kelola pengadaan alat tulis kantor.',
            ],
        ];

        $widgets = [];
        $quickLinks = [];

        foreach ($resources as $resource) {
            $canView = $user && $user->hasAnyRole($resource['allowedRoles']);
            if (! $canView) {
                continue;
            }

            $indexUrl = Route::has($resource['indexRoute']) ? route($resource['indexRoute']) : null;
            $createUrl = Route::has($resource['createRoute']) && $user->hasAnyRole($resource['createRoles'])
                ? route($resource['createRoute'])
                : null;

            if ($indexUrl) {
                $widgets[] = [
                    'key' => $resource['key'],
                    'label' => $resource['label'],
                    'count' => $this->resolveResourceCount($resource['key'], $user),
                    'href' => $indexUrl,
                    'description' => $resource['description'],
                ];
            }

            $linkTarget = $createUrl ?? $indexUrl;
            if ($linkTarget) {
                $quickLinks[] = [
                    'key' => $resource['key'],
                    'label' => $resource['label'],
                    'href' => $linkTarget,
                    'canCreate' => (bool) $createUrl,
                ];
            }
        }

        return Inertia::render('Dashboard', [
            'widgets' => $widgets,
            'quickLinks' => $quickLinks,
        ]);
    }

    private function resolveResourceCount(string $key, $user): int
    {
        if (! $user) {
            return 0;
        }

        return match ($key) {
            'nomor-surat' => NomorSuratSubmission::query()
                ->when(
                    ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                    fn ($query) => $query->where('user_id', $user->id)
                )
                ->count(),
            'surat-tugas' => SuratTugasSubmission::query()
                ->when(
                    $user->hasAnyRole(['Karyawan', 'PIC'])
                    && ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                    fn ($query) => $query->where('user_id', $user->id)
                )
                ->count(),
            'invoices' => InvoiceSubmission::query()
                ->when(
                    ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                    fn ($query) => $query->where('user_id', $user->id)
                )
                ->count(),
            'spj' => SpjSubmission::query()
                ->when(
                    ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                    fn ($query) => $query->where('user_id', $user->id)
                )
                ->count(),
            'peminjaman-inventaris' => InventoryLoanSubmission::query()
                ->when(
                    ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                    fn ($query) => $query->where('user_id', $user->id)
                )
                ->count(),
            'atk-requests' => AtkRequest::query()
                ->when(
                    ! $user->hasAnyRole(['Admin', 'Manager', 'Supervisor']),
                    fn ($query) => $query->where('user_id', $user->id)
                )
                ->count(),
            default => 0,
        };
    }
}
