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
        $user = $request->user();
        $isAdmin = $user?->hasRole('Admin') ?? false;
        $isManager = $user?->hasRole('Manager') ?? false;
        $isSupervisor = $user?->hasRole('Supervisor') ?? false;
        $isKaryawan = $user?->hasRole('Karyawan') ?? false;
        $isPic = $user?->hasRole('PIC') ?? false;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'isAdmin' => fn () => $isAdmin,
                'isManager' => fn () => $isManager,
                'isSupervisor' => fn () => $isSupervisor,
                'isKaryawan' => fn () => $isKaryawan,
                'isPic' => fn () => $isPic,
                'canViewAllLists' => fn () => $isAdmin || $isManager || $isSupervisor,
                'canApproveSuratTugas' => fn () => $isManager,
                'canSubmitForms' => fn () => $isAdmin || $isKaryawan || $isPic,
                'canSubmitNomorSurat' => fn () => $isAdmin || $isSupervisor || $isKaryawan || $isPic,
                'canSubmitAtk' => fn () => $isAdmin || $isKaryawan || $isPic,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
