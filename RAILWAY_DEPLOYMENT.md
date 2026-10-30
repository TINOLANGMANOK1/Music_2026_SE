# 🚂 Railway Deployment Guide for Music Laravel System

## 📋 Pre-Deployment Checklist

### 1. **Verify .gitignore is Correct**
Make sure `.env` is in `.gitignore` (already done ✅)

### 2. **Check composer.json Requirements**
Your app should specify PHP version:
```json
"require": {
    "php": "^8.2"
}
```

### 3. **Prepare Environment Variables**
You'll need to set these in Railway:

## 🔑 Required Environment Variables for Railway

### Core Laravel Settings
```env
APP_NAME="Music Booking System"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_KEY_HERE
APP_URL=https://your-app.railway.app
```

### Database (Railway MySQL)
```env
DB_CONNECTION=mysql
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_DATABASE=${{MYSQL_DATABASE}}
DB_USERNAME=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
```

### Session & Cache
```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### External API (Your existing API)
```env
EXTERNAL_API_URL=your_external_api_url
EXTERNAL_API_CLIENT_ID=your_client_id
EXTERNAL_API_CLIENT_SECRET=your_new_secret
```

### Mail Configuration (Optional but recommended)
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Music System"
```

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Commit all changes:**
```powershell
cd "c:\Users\Public\JP Repo\Music_Laravel"
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [Railway.app](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `Music_Laravel` repository
5. Select the `main` branch

### Step 3: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically create MySQL and set environment variables

### Step 4: Configure Environment Variables

1. Go to your Laravel service → **"Variables"** tab
2. Click **"RAW Editor"** and paste:

```env
APP_NAME=Music Booking System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:GENERATE_THIS_FIRST
APP_URL=https://your-app.railway.app

DB_CONNECTION=mysql
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_DATABASE=${{MYSQL_DATABASE}}
DB_USERNAME=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}

SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database

EXTERNAL_API_URL=your_external_api_url
EXTERNAL_API_CLIENT_ID=your_client_id
EXTERNAL_API_CLIENT_SECRET=your_new_secret
```

### Step 5: Generate APP_KEY

**Option A: Locally**
```powershell
cd "c:\Users\Public\JP Repo\Music_Laravel\music"
php artisan key:generate --show
```
Copy the output and paste it as `APP_KEY` in Railway.

**Option B: In Railway Console**
1. Go to your service → **"Deploy Logs"**
2. Wait for first deployment to fail
3. Click **"⋮"** → **"Restart"**
4. The key will be generated automatically

### Step 6: Configure Root Directory

1. In Railway service settings → **"Settings"** tab
2. Set **Root Directory** to: `music`
3. Set **Build Command** to: `composer install --no-dev --optimize-autoloader && npm ci && npm run build`
4. Set **Start Command** to: `php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT`

### Step 7: Deploy!

1. Railway will automatically deploy
2. Wait for build to complete (5-10 minutes first time)
3. Check deploy logs for any errors

### Step 8: Post-Deployment Setup

Once deployed, run these commands in Railway console:

```bash
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

To access Railway console:
1. Go to your service
2. Click **"⋮"** menu
3. Select **"Shell"**

## 🔐 Security Checklist for Production

- [ ] `APP_DEBUG=false` in Railway
- [ ] Strong `APP_KEY` generated
- [ ] All secrets rotated (especially `EXTERNAL_API_CLIENT_SECRET`)
- [ ] Database credentials secured
- [ ] HTTPS enforced (Railway does this automatically)
- [ ] Generated RFID tokens for production use
- [ ] Test all booking flows
- [ ] Test RFID scanner with production tokens

## 🔧 Common Issues & Solutions

### Issue: "No application encryption key"
**Solution:** Generate and set `APP_KEY` in Railway variables

### Issue: "Database connection failed"
**Solution:** 
- Make sure MySQL service is running
- Check that `DB_HOST` uses `${{MYSQL_HOST}}` reference
- Verify database is in the same Railway project

### Issue: "Storage folder not writable"
**Solution:** Railway handles this automatically, but if needed:
```bash
chmod -R 775 storage bootstrap/cache
```

### Issue: "Vite manifest not found"
**Solution:** Make sure `npm run build` runs in build phase:
```bash
composer install --no-dev && npm ci && npm run build
```

### Issue: "RFID endpoints not working"
**Solution:** 
- Generate new RFID tokens in production
- Update RFID scanner with production URL and tokens
- Check that `auth:sanctum` middleware is active

## 📊 Monitoring Your Deployment

### View Logs
```bash
# In Railway console or logs tab
tail -f storage/logs/laravel.log
```

### Check Application Status
```bash
php artisan about
```

### Test Database Connection
```bash
php artisan migrate:status
```

## 🔄 Updating Your Deployment

After making code changes:

1. Commit and push to GitHub:
```powershell
git add .
git commit -m "Your changes"
git push origin main
```

2. Railway will automatically redeploy

3. For database changes:
```bash
php artisan migrate --force
```

## 💾 Database Backups

Railway MySQL includes automatic backups. To manually backup:

1. Go to MySQL service → **"Data"** tab
2. Click **"Backup"**
3. Or use Railway CLI:
```bash
railway run mysqldump -u user -p database > backup.sql
```

## 🎯 Performance Optimization

### Enable OPcache (Automatic on Railway)

### Queue Workers (Optional)
If you add queue jobs later:
```bash
php artisan queue:work --daemon
```

### Redis (Optional Upgrade)
For better performance, add Redis:
1. Railway → **"+ New"** → **"Redis"**
2. Update `.env`:
```env
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_HOST=${{REDIS_HOST}}
REDIS_PORT=${{REDIS_PORT}}
```

## 🌐 Custom Domain Setup

1. Railway project → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Add your domain
4. Update DNS records as instructed
5. Update `APP_URL` in Railway variables

## ✅ Final Checklist

- [ ] Application deployed successfully
- [ ] Database migrations ran
- [ ] Can access dashboard
- [ ] Can log in as admin
- [ ] Booking system works
- [ ] RFID scanner configured (if ready)
- [ ] All environment variables set
- [ ] Custom domain configured (optional)
- [ ] Monitoring/logging enabled
- [ ] Backup strategy in place

## 📞 Need Help?

- Railway Docs: https://docs.railway.app/
- Laravel Deployment: https://laravel.com/docs/11.x/deployment
- Railway Discord: https://discord.gg/railway

---

**Estimated Deploy Time:** 10-15 minutes
**Cost:** Free tier available, ~$5-20/month for production
