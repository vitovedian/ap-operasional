<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verified', 'role:Admin']);
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $users = User::query()->with('roles')
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => optional($user->roles->first())->name,
                ];
            })
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'currentUserId' => Auth::id(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', 'string', Rule::exists('roles', 'name')],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        // Assign role (default to Karyawan if available)
        $roleName = $validated['role'] ?? Role::query()->where('name', 'Karyawan')->value('name');
        if ($roleName) {
            $user->syncRoles([$roleName]);
        }

        return back()->with('success', 'User created');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            // Treat empty string as "no change"; only validate if provided and not empty
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'nullable', 'string', Rule::exists('roles', 'name')],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if ($request->filled('password')) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        // Update role if provided (prevent demoting self from Admin)
        if ($request->has('role')) {
            $newRole = $validated['role'] ?? null;
            if ($user->id === Auth::id() && $newRole && $newRole !== 'Admin') {
                return back()->with('error', 'Tidak dapat mengubah role Anda sendiri dari Admin.');
            }
            if ($newRole) {
                $user->syncRoles([$newRole]);
            }
        }

        return back()->with('success', 'User updated');
    }

    public function destroy(User $user): RedirectResponse
    {
        // Prevent deleting yourself
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();
        return back()->with('success', 'User deleted');
    }
}
