# Deployment Migration Fix Guide - Railway

## Issue
The migration `2025_11_06_184539_create_asset_disposals_table` is failing because the `asset_disposals` table already exists in the production database.

## Solution for Railway

### Automatic Fix (Implemented)
A pre-deployment script has been added that automatically handles this issue:

**Files Updated:**
1. **`pre-deploy.php`** - Checks if the table exists and marks the migration as complete
2. **`Procfile`** - Runs pre-deploy script before migrations
3. **`nixpacks.toml`** - Runs pre-deploy script before migrations
4. **Migration file** - Added safety check with `Schema::hasTable()`

### How It Works
When you deploy to Railway:
1. `pre-deploy.php` runs first
2. Checks if `asset_disposals` table exists
3. If it exists but migration isn't recorded, it adds the migration record
4. Then migrations run normally without errors

### Manual Fix (If Needed)
If you need to manually fix the current deployment in Railway:

1. Go to Railway Dashboard
2. Select your project
3. Go to the "Variables" tab
4. Add a new variable:
   - Name: `RUN_MIGRATION_FIX`
   - Value: `true`
5. Redeploy

Or use Railway CLI:
```bash
railway run php pre-deploy.php
railway run php artisan migrate --force
```

## What's Been Fixed

✅ Pre-deployment script checks for conflicts  
✅ Migration file has safety check  
✅ Procfile updated to run pre-deploy  
✅ nixpacks.toml updated to run pre-deploy  

## Next Deployment
Simply push your code to Railway:
```bash
git add .
git commit -m "Fix migration conflict with pre-deploy script"
git push
```

Railway will automatically:
1. Run pre-deploy.php (fixes the conflict)
2. Run migrations (now works without error)
3. Start the application

