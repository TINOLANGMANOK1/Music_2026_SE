# Vercel deployment

This Laravel/Inertia application runs on Vercel's Container Runtime using FrankenPHP. `Dockerfile.vercel` installs production PHP dependencies, generates Wayfinder files and Vite assets, and packages Laravel behind a Caddy web server. The root `vercel.json` routes all requests to that container; it does not use a Vite `dist` output directory.

Vercel project detection should select the **Container** framework preset because the repository contains `Dockerfile.vercel`. If the project still shows a Vite preset or asks for an output directory, change **Settings > Build and Deployment > Framework Preset** to **Container**, clear any configured Output Directory, and redeploy.

Set deployment environment variables in Vercel before using the app:

- `APP_KEY`: a stable Laravel application key (generate locally with `php artisan key:generate --show`).
- `APP_URL`: the production deployment URL.
- Database variables such as `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` for an externally hosted database.
- `CLOUDINARY_URL` or the Cloudinary credentials used by the configured Cloudinary disk.

On Vercel, the app uses Laravel's encrypted cookie session driver and in-memory array cache to avoid requiring MySQL just to render the public/login pages. Keep `APP_KEY` stable: it is used to encrypt session cookies. The cache is not shared or persistent, and the cookie session does not store data in MySQL. The application still requires a reachable database for authentication, bookings, inventory, and other database-backed features. Configure and migrate the external database before using those features. Container filesystems are ephemeral: keep uploads in Cloudinary or another external object store, not local disk.

The image build runs Composer package discovery and Vite/Wayfinder generation with `APP_ENV=testing` to avoid database access during build. That setting applies only during image construction; the running container uses `APP_ENV=production`.
