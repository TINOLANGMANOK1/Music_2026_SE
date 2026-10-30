<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Return generic message for security (don't reveal if email exists)
        if (!$user) {
            return back()->with('status', __('If an account exists with that email, an administrator has been notified.'));
        }

        // Create a password reset request in the database
        $token = Str::random(60);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => hash('sha256', $token),
                'created_at' => now(),
            ]
        );

        // Get all administrators
        $admins = User::whereIn('role', ['Administrator', 'Music Dean'])->get();

        // Create notification for each admin
        foreach ($admins as $admin) {
            // Music Dean should only get notifications for Student Assistant and Student Panel
            if ($admin->role === 'Music Dean' && !in_array($user->role, ['Student Assistant', 'Student Panel'])) {
                continue; // Skip creating notification for Music Dean if user is not Student Assistant or Student Panel
            }

            $notificationData = [
                'user_email' => $user->email,
                'user_name' => $user->name,
                'user_id' => $user->id,
                'message' => "{$user->name} ({$user->email}) has requested a password reset. Please use the Reset User Password feature on the Account page to set a new default password.",
            ];

            DB::table('notifications')->insert([
                'id' => Str::uuid(),
                'notifiable_id' => $admin->id,
                'notifiable_type' => User::class,
                'type' => 'password_reset',
                'data' => json_encode($notificationData),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('status', __('If an account exists with that email, an administrator has been notified.'));
    }
}
