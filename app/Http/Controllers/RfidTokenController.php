<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RfidTokenController extends Controller
{
    /**
     * Generate a new API token for RFID scanner
     * This should only be accessible to admin users
     */
    public function generateToken(Request $request)
    {
        $request->validate([
            'device_name' => 'required|string|max:255',
        ]);

        $user = $request->user();

        // Only admin users can generate RFID tokens
        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Create token with specific abilities for RFID operations
        $token = $user->createToken($request->device_name, ['rfid:scan', 'rfid:logout']);

        return response()->json([
            'token' => $token->plainTextToken,
            'device_name' => $request->device_name,
            'expires_at' => null, // Token doesn't expire
            'abilities' => ['rfid:scan', 'rfid:logout'],
            'instructions' => 'Store this token securely. It will only be shown once. Add it to RFID scanner requests as: Authorization: Bearer {token}'
        ]);
    }

    /**
     * List all active RFID tokens
     */
    public function listTokens(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tokens = $user->tokens()->where('name', 'like', '%RFID%')->get();

        return response()->json([
            'tokens' => $tokens->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'abilities' => $token->abilities,
                    'created_at' => $token->created_at,
                    'last_used_at' => $token->last_used_at,
                ];
            })
        ]);
    }

    /**
     * Revoke a specific token
     */
    public function revokeToken(Request $request, $tokenId)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $token = $user->tokens()->where('id', $tokenId)->first();

        if (!$token) {
            return response()->json(['error' => 'Token not found'], 404);
        }

        $token->delete();

        return response()->json(['message' => 'Token revoked successfully']);
    }
}
