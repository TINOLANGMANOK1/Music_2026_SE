<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfilePictureController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $user = Auth::user();

        // Delete old profile picture if exists
        if ($user->profile_picture_path) {
            Storage::disk(config('filesystems.default'))->delete($user->profile_picture_path);
        }

        // Store on the configured disk (cloudinary in production, public locally)
        $path = $request->file('profile_picture')->store('profile_pictures', config('filesystems.default'));
        
        // Get the full URL if using Cloudinary
        if (config('filesystems.default') === 'cloudinary') {
            $user->profile_picture_path = Storage::disk('cloudinary')->url($path);
        } else {
            $user->profile_picture_path = $path;
        }
        
        $user->save();

        return redirect()->back()->with('success', 'Profile picture uploaded successfully!');
    }

    public function remove()
    {
        $user = Auth::user();

        if ($user->profile_picture_path) {
            Storage::disk(config('filesystems.default'))->delete($user->profile_picture_path);
            $user->profile_picture_path = null;
            $user->save();
        }

        return redirect()->back()->with('success', 'Profile picture removed successfully!');
    }
}
