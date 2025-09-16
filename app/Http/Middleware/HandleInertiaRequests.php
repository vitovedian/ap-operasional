<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'isAdmin' => fn () => $request->user()?->hasRole('Admin') ?? false,
                'isFinanceManager' => fn () => $request->user()?->hasRole('Manager Keuangan') ?? false,
                'canSubmitSuratTugas' => fn () => $request->user()?->hasAnyRole(['Karyawan', 'Manager Operasional']) ?? false,
                'canViewSuratTugasList' => fn () => $request->user()?->hasAnyRole(['Admin', 'Manager Operasional']) ?? false,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
