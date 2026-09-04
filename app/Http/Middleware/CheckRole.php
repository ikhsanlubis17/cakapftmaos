<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please login first.'
            ], 401);
        }

        $userRole = $user->role instanceof \BackedEnum ? $user->role->value : (string)$user->role;

        if (!in_array($userRole, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. You do not have permission to perform this action.',
                'required_role' => implode(' or ', $roles),
                'your_role' => $userRole
            ], 403);
        }

        return $next($request);
    }
}
