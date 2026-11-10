# Vercel deployment

This Laravel/Inertia application runs on Vercel's Container Runtime using FrankenPHP. `Dockerfile.vercel` installs production PHP dependencies, generates Wayfinder files and Vite assets, and packages Laravel behind a Caddy web server. The root `vercel.json` routes all requests to that container; it does not use a Vite `dist` output directory.

Vercel project detection should select the **Container** framework preset because the repository contains `Dockerfile.vercel`. If the project still shows a Vite preset or asks for an output directory, change **Settings > Build and Deployment > Framework Preset** to **Container**, clear any configured Output Directory, and redeploy.

Set deployment environment variables in Vercel before using the app:

- `APP_KEY`: a stable Laravel application key (generate locally with `php artisan key:generate --show`).
- `APP_URL`: the production deployment URL.
- Database variables such as `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` for an externally hosted database.
- `CLOUDINARY_URL` or the Cloudinary credentials used by the configured Cloudinary disk.

The app's default session and cache stores use the database, so configure the database and run migrations before relying on login/session-backed features. Container filesystems are ephemeral: keep uploads in Cloudinary or another external object store, not local disk. Configure persistent shared cache/session services if the app must use multiple instances.

The image build runs Composer package discovery and Vite/Wayfinder generation with `APP_ENV=testing` to avoid database access during build. That setting applies only during image construction; the running container uses `APP_ENV=production`.
