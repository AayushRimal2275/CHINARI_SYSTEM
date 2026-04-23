<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (ValidationException $exception, Request $request): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'data' => null,
                'errors' => $exception->errors(),
                'meta' => null,
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'data' => null,
                'errors' => ['auth' => ['Authentication required.']],
                'meta' => null,
            ], 401);
        });

        $exceptions->render(function (ModelNotFoundException $exception, Request $request): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
                'data' => null,
                'errors' => ['resource' => ['The requested resource could not be found.']],
                'meta' => null,
            ], 404);
        });

        $exceptions->render(function (\Throwable $exception, Request $request): JsonResponse {
            $status = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500;

            return response()->json([
                'success' => false,
                'message' => $status >= 500 ? 'Server error.' : $exception->getMessage(),
                'data' => null,
                'errors' => ['server' => [$exception->getMessage()]],
                'meta' => null,
            ], $status);
        });
    })->create();
