<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'loginSuccess' => $request->session()->get('loginSuccess', false),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $request->authenticate();

        // Migrate session to new ID (safer than regenerate, preserves data)
        // This will carry over the CSRF token to the new session
        $request->session()->migrate(true);
        
        // Flash success message for next request
        $request->session()->flash('loginSuccess', true);

        // Force a complete browser redirect to get fresh CSRF token in HTML
        return response()->redirectTo(route('dashboard'))
            ->header('X-Inertia-Location', route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Add header to clear Inertia cache
        return redirect('/')
            ->header('X-Inertia-Location', url('/'));
    }
}
