# Timezone Configuration - Philippine Time (Asia/Manila)

## Problem
The system was showing negative time usage when accessed from different devices or timezones. This occurred because:

1. Time calculations were using `DateTime` without timezone awareness
2. Frontend JavaScript was parsing timestamps based on the browser's timezone
3. Duration calculations became incorrect when device timezone != server timezone

## Solution Implemented

### 1. Backend PHP Configuration

**File: `config/app.php`**
```php
'timezone' => 'Asia/Manila',
```
Already configured to use Philippine timezone.

**File: `.env.example`** (Added for Railway deployment)
```env
APP_TIMEZONE=Asia/Manila
```

### 2. Backend Time Calculations Fixed

**Files Updated:**
- `app/Http/Controllers/BookingController.php`
  - `timeoutCubicle()` - Line ~357
  - `timeoutInstrument()` - Line ~416
  - `timeoutTool()` - Line ~470

**Changes Made:**
```php
// OLD (timezone unaware):
$timeIn = new \DateTime($booking->time_in);
$durationInMinutes = ($timeOut->getTimestamp() - $timeIn->getTimestamp()) / 60;

// NEW (timezone aware):
$timeIn = \Carbon\Carbon::parse($booking->time_in);
$durationInMinutes = $timeOut->diffInMinutes($timeIn);
```

**Why This Works:**
- `Carbon::parse()` automatically respects the `config('app.timezone')` setting
- `diffInMinutes()` calculates the difference in the same timezone
- Prevents timezone conversion errors

### 3. API Response Format Standardized

**File: `app/Http/Controllers/ResourceController.php`**

All timestamps sent to frontend are now formatted as ISO 8601 with timezone:

```php
// Format time_in to ISO 8601 with timezone for consistent frontend parsing
$item->time_in = $item->time_in 
    ? \Carbon\Carbon::parse($item->time_in)->toIso8601String() 
    : '-';
```

**Example Output:**
```
"2024-11-07T14:30:00+08:00"  // Instead of "2024-11-07 14:30:00"
```

This format includes the timezone offset (+08:00 for Philippines), ensuring JavaScript `new Date()` parses it correctly regardless of the user's device timezone.

### 4. Database Considerations

**Timestamp Storage:**
- All `time_in`, `time_out`, `created_at`, `updated_at` columns store timestamps
- Laravel automatically converts these to the app timezone when reading
- MySQL `TIMESTAMP` type stores UTC internally, converts based on connection timezone

**No Migration Required:**
- Existing timestamps are preserved
- Carbon handles the conversion automatically when parsing

## Frontend Handling

Frontend files (TypeScript/React) parse timestamps using JavaScript's `Date` object:

```typescript
// These now work correctly because backend sends ISO 8601 format:
new Date(item.time_in).toLocaleString()
new Date(item.time_in).toLocaleTimeString()
new Date(item.time_in).toLocaleDateString()

// Duration calculations also work correctly:
const timeIn = new Date(row.time_in);
const timeOut = new Date(row.time_out);
const duration = (timeOut.getTime() - timeIn.getTime()) / 60000; // minutes
```

## Railway Deployment

**Environment Variable Required:**
Add to Railway dashboard → Variables:

```
APP_TIMEZONE=Asia/Manila
```

Or ensure your `.env` file includes:
```
APP_TIMEZONE=Asia/Manila
```

## Testing Checklist

- [ ] Cubicle timeout shows correct duration
- [ ] Instrument timeout shows correct duration
- [ ] Tool timeout shows correct duration
- [ ] Activity log shows correct time usage
- [ ] MTL time deduction is accurate
- [ ] Resources page shows correct time_in
- [ ] No negative time values appear
- [ ] Times display correctly on different device timezones

## Future Considerations

If you need to support multiple timezones:

1. Store user timezone preference in database
2. Send timezone-aware ISO 8601 timestamps (already done ✅)
3. Frontend can convert to user's local timezone for display
4. Backend calculations always use `Asia/Manila` as reference

## Related Files

- `config/app.php` - App timezone configuration
- `.env.example` - Environment timezone setting
- `app/Http/Controllers/BookingController.php` - Duration calculations
- `app/Http/Controllers/ResourceController.php` - API responses
- `resources/js/pages/Resources.tsx` - Frontend time display
- `resources/js/pages/ActivityLog.tsx` - Time usage calculations
