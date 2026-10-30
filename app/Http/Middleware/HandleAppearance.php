<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Get the appearance from the session or default to 'system'
        $appearance = session('appearance', 'system');

        // Determine the actual theme
        $theme = 'light'; // Default to light

        if ($appearance === 'dark') {
            $theme = 'dark';
        } elseif ($appearance === 'system') {
            // Check user's system preference (e.g., from a cookie or header)
            // For simplicity, we'll just default to light for 'system' if no explicit preference
            // In a real app, you'd read a cookie or a header like 'Sec-CH-Prefers-Color-Scheme'
            $theme = 'light'; // Default system to light
        }

        // Add the theme class to the <html> tag
        $response->headers->set('X-Inertia-Theme', $theme);

        return $response;
    }
}
