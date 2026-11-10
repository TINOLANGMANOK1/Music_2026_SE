# Vercel deployment

The Vite build uses Laravel Wayfinder to generate route and controller-action TypeScript modules. The generator runs `php artisan wayfinder:generate --with-form`, so the Vercel install step must provide PHP and install the Laravel Composer dependencies before Vercel runs `npm run build`.

The root `vercel.json` selects `scripts/vercel-install.sh` as Vercel's install command. The script installs PHP 8.4 CLI and the XML/mbstring extensions from Vercel's Amazon Linux build image, verifies and installs Composer, installs production PHP dependencies, generates Wayfinder files with Artisan, then runs `npm ci`. The Wayfinder Vite plugin is skipped on Vercel because generation has already run in the install step; it remains enabled for local development and builds.

Composer setup and Wayfinder generation use `APP_ENV=testing` so Laravel's service provider does not try to connect to the configured database during the build. This applies only to the install-step subprocess and does not change the deployment's runtime environment.

The generated Wayfinder files are intentionally Git-ignored; they are generated during each build. This setup addresses build-time generation only and does not configure a Laravel PHP application runtime on Vercel.
