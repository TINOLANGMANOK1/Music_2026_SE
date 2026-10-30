# Cecilia Hall Booking System - Security Documentation

## Security Features Implemented

### 1. Authentication & Authorization ✅

#### Route Protection
- All routes protected by `auth` middleware
- Only authenticated users can access the system

#### Role-Based Access Control (RBAC)
```php
// Booking Creation
- Student Assistant: Can create bookings (own email only)
- Music Dean: Can create bookings for anyone

// Approval/Rejection
- Music Dean ONLY: Can approve or reject bookings

// Deletion
- Student Assistant: Can delete own pending bookings
- Music Dean: Can delete any booking
```

### 2. Rate Limiting (Throttling) ✅

```php
POST   /cecilia-hall/bookings       → 20 requests per minute
PATCH  /cecilia-hall/bookings/{id}  → 30 requests per minute  
DELETE /cecilia-hall/bookings/{id}  → 10 requests per minute
```

**Purpose:** Prevents spam, DoS attacks, and accidental duplicate submissions

### 3. Input Validation ✅

#### Backend Validation (Laravel)
```php
'name' => 'required|string|max:255',
'email' => 'required|email|max:255',
'booker_type' => 'required|in:music_department,external',
'date' => 'required|date|after_or_equal:today',
'start_time' => 'required|date_format:H:i',
'end_time' => 'required|date_format:H:i|after:start_time',
'purpose' => 'required|string|max:1000',
'letter' => 'required_if:booker_type,external|nullable|file|mimes:pdf|max:5120',
```

#### XSS Protection
- `purpose` field: `strip_tags()` removes HTML/JavaScript
- All output rendered through Inertia.js (React) - auto-escaping

### 4. File Upload Security ✅

#### PDF Validation
- **MIME Type Check:** Only PDF files allowed (`mimes:pdf`)
- **Size Limit:** Maximum 5MB (5120 KB)
- **Filename Sanitization:** Special characters removed
  ```php
  preg_replace('/[^a-zA-Z0-9_.-]/', '_', $originalName);
  ```
- **Timestamped Filenames:** Prevents overwriting (`time() . '_' . $sanitizedName`)

#### Storage
- Files stored in `storage/app/public/cecilia-hall-letters/`
- File deletion on booking deletion

### 5. Authorization Logic ✅

#### Booking Creation
```php
// Student Assistants can only book with their own email
if ($user->role !== 'Music Dean' && $validated['email'] !== $user->email) {
    return error('Only Music Dean can create bookings for others');
}
```

#### Booking Deletion
```php
// Complex authorization matrix
$isMusicDean = $user->role === 'Music Dean';
$isCreator = $user->email === $bookingModel->email;
$isPending = $bookingModel->status === 'pending';

// Allow if:
// - Music Dean (any booking)
// - Creator AND booking is pending
if (!$isMusicDean && !($isCreator && $isPending)) {
    return 403 Forbidden;
}
```

#### Status Updates (Approval/Rejection)
```php
// Only Music Dean can approve/reject
if (auth()->user()->role !== 'Music Dean') {
    return 403 Forbidden;
}

// Prevent re-approval of approved bookings
// Dean can only reject → reject on already approved bookings
if ($bookingModel->status === 'approved') {
    $validated = validate(['status' => 'required|in:rejected']);
}
```

### 6. Data Integrity ✅

#### Conflict Detection
```php
// Prevents double-booking same time slot
hasConflict() method checks:
- Same date
- Overlapping time ranges
- Excludes rejected bookings
```

#### Past Date Prevention
```php
if (Carbon::parse($date . ' ' . $start_time)->isPast()) {
    return error('Cannot book past time slots');
}
```

#### Audit Trail
```php
// Tracks who approved/rejected and when
'approved_by' => auth()->id(),
'approved_at' => now(),
'rejection_reason' => $reason,
```

### 7. CSRF Protection ✅

All POST/PATCH/DELETE requests include CSRF token:
```typescript
headers: {
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
}
```

### 8. Timezone Safety ✅

```php
// Prevent timezone conversion bugs
$booking->getRawOriginal('date')  // Returns raw DB value
```

---

## Security Testing Checklist

### Test Cases

#### ✅ Authentication Tests
- [ ] Unauthenticated users redirected to login
- [ ] Cannot access API endpoints without auth

#### ✅ Authorization Tests  
- [ ] Student Assistant cannot approve bookings
- [ ] Student Assistant cannot delete approved bookings
- [ ] Student Assistant cannot create bookings with different email
- [ ] Music Dean can perform all actions

#### ✅ Rate Limiting Tests
- [ ] 21st booking request within 1 minute returns 429 Too Many Requests
- [ ] Approval spam blocked after 30 requests/minute
- [ ] Delete spam blocked after 10 requests/minute

#### ✅ Input Validation Tests
- [ ] XSS attempt in purpose field sanitized: `<script>alert('xss')</script>`
- [ ] Invalid email rejected
- [ ] Past date booking rejected
- [ ] End time before start time rejected
- [ ] Non-PDF file upload rejected
- [ ] File >5MB rejected

#### ✅ File Upload Tests
- [ ] Filename with special chars sanitized: `../../etc/passwd.pdf` → `123456_.._.._etc_passwd.pdf`
- [ ] File deleted when booking deleted

#### ✅ Conflict Detection Tests
- [ ] Cannot book overlapping time slot
- [ ] Can book same slot after rejection

#### ✅ Business Logic Tests
- [ ] Cannot re-approve approved booking
- [ ] Dean can reject approved booking
- [ ] Creator can delete own pending booking
- [ ] Creator cannot delete own approved booking

---

## Known Limitations

### 1. No Virus Scanning
**Risk:** Malicious PDF could be uploaded  
**Mitigation:** File type restricted to PDF, stored outside web root  
**Future:** Integrate ClamAV or similar

### 2. No Email Verification
**Risk:** User could book with someone else's email (if Music Dean)  
**Mitigation:** Only Music Dean has this privilege (trusted role)

### 3. No IP-Based Blocking
**Risk:** Distributed attacks could bypass rate limiting  
**Mitigation:** Application-level throttling in place  
**Future:** Integrate CloudFlare or fail2ban

---

## Security Best Practices Applied

1. ✅ **Principle of Least Privilege:** Users have minimal permissions needed
2. ✅ **Defense in Depth:** Multiple layers (auth → validation → authorization)
3. ✅ **Input Validation:** Server-side validation on all inputs
4. ✅ **Output Encoding:** React auto-escapes, `strip_tags()` on storage
5. ✅ **Secure Defaults:** Deny by default, allow explicitly
6. ✅ **Audit Logging:** Track who approved/rejected bookings
7. ✅ **Error Handling:** Generic error messages, detailed logs

---

## Maintenance

### Regular Security Audits
- Review uploaded PDFs periodically
- Monitor rate limiting logs for suspicious patterns
- Update Laravel and dependencies regularly

### Incident Response
1. If malicious file detected: Delete from `storage/cecilia-hall-letters/`
2. If unauthorized access: Check `admin_activity_logs` table
3. If XSS attempt: Verify `strip_tags()` is active in controller

---

## Version History

- **v1.0** (Nov 2, 2025): Initial implementation with basic auth
- **v2.0** (Nov 2, 2025): **Security hardening**
  - Added rate limiting
  - Implemented ownership validation
  - Added filename sanitization
  - Enhanced authorization logic
  - Added XSS protection
  - Prevented approved booking re-approval

---

*Last Updated: November 2, 2025*
