# Vercel deployment

The Vite build uses Laravel Wayfinder to generate route and controller-action TypeScript modules. The generator runs `php artisan wayfinder:generate --with-form`, so the Vercel install step must provide PHP and install the Laravel Composer dependencies before Vercel runs `npm run build`.

The root `vercel.json` selects `scripts/vercel-install.sh` as Vercel's install command. The script installs PHP 8.4 CLI and the XML/mbstring extensions from Vercel's Amazon Linux build image, verifies and installs Composer, installs production PHP dependencies, then runs `npm ci`. Wayfinder generation remains configured in `vite.config.ts` and runs at the start of the frontend build.

Composer setup and Wayfinder generation use `APP_ENV=testing` so Laravel's service provider does not try to connect to the configured database during the build. The Vercel-specific Wayfinder command sets this only for generation; it does not change the deployment's runtime environment.

The generated Wayfinder files are intentionally Git-ignored; they are generated during each build. This setup addresses build-time generation only and does not configure a Laravel PHP application runtime on Vercel.
