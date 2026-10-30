<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class UserController extends Controller
{
    use AuthorizesRequests;
    public function store(Request $request)
    {
        // Ensure only Admin or Music Dean can access this
        $this->authorize('create', User::class);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:Administrator,Music Dean,Student Assistant,Student Panel',
            'phone' => 'nullable|string|max:15',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
        ]);

        return Redirect::back()->with('success', 'User added successfully!');
    }

    /**
     * Reset a user's password to default (Admin/Dean only)
     */
    public function resetPassword(Request $request, User $user)
    {
        // Only Admin or Music Dean can reset passwords
        $this->authorize('update', $user);

        // Get default password from config
        $defaultPassword = config("defaults.passwords.{$user->role}");

        if (!$defaultPassword) {
            return Redirect::back()->with('error', 'Cannot reset password for this user role.');
        }

        // Update password
        $user->update([
            'password' => Hash::make($defaultPassword),
        ]);

        return Redirect::back()->with('success', "Password for {$user->name} has been reset to default.");
    }

    /**
     * Search users by name (Admin/Dean only)
     */
    public function searchUsers(Request $request)
    {
        // Only Admin or Music Dean can search users
        if (!in_array(auth()->user()?->role, ['Administrator', 'Music Dean'])) {
            return response()->json([], 403);
        }

        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $users = User::where('name', 'like', "%{$query}%")
            ->select('id', 'name', 'role', 'email')
            ->limit(10)
            ->get();

        return response()->json($users);
    }
}
