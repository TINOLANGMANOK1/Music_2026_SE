<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ProfilePictureController;
use App\Http\Controllers\DashboardChartController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\MTLTimeController;
use App\Http\Controllers\MTLController;
use App\Http\Controllers\CeciliaHallController;


use App\Http\Controllers\ManageEquipmentController;
use App\Http\Controllers\RfidController;
use App\Http\Controllers\RfidTokenController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ManageCubiclesController;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/resources', [ResourceController::class, 'index'])
        ->name('resources');

    // Cecilia Hall Routes
    Route::get('/cecilia-hall', [CeciliaHallController::class, 'index'])
        ->name('cecilia-hall');
    Route::post('/cecilia-hall/bookings', [CeciliaHallController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('cecilia-hall.store');
    Route::patch('/cecilia-hall/bookings/{booking}', [CeciliaHallController::class, 'updateStatus'])
        ->middleware(['admin', 'throttle:30,1'])
        ->name('cecilia-hall.update-status');
    Route::delete('/cecilia-hall/bookings/{booking}', [CeciliaHallController::class, 'destroy'])
        ->middleware(['admin', 'throttle:10,1'])
        ->name('cecilia-hall.destroy');
    Route::get('/cecilia-hall/approvals', [CeciliaHallController::class, 'approvals'])
        ->name('cecilia-hall.approvals');
    Route::get('/cecilia-hall/bookings/{booking}/letter', [CeciliaHallController::class, 'viewLetter'])
        ->name('cecilia-hall.view-letter');

    // MTL Booking Routes
    Route::get('/mtl-booking', [MTLController::class, 'index'])
        ->name('mtl-booking');
    Route::post('/mtl-booking/bookings', [MTLController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('mtl-booking.store');
    Route::patch('/mtl-booking/bookings/{booking}', [MTLController::class, 'updateStatus'])
        ->middleware(['admin', 'throttle:30,1'])
        ->name('mtl-booking.update-status');
    Route::delete('/mtl-booking/bookings/{booking}', [MTLController::class, 'destroy'])
        ->middleware(['admin', 'throttle:10,1'])
        ->name('mtl-booking.destroy');
    Route::get('/mtl-booking/approvals', [MTLController::class, 'approvals'])
        ->name('mtl-booking.approvals');

    Route::get('/activity-log', [ActivityLogController::class, 'index'])
        ->name('activity-log');
    
    // API endpoint for student activity log
    Route::get('/api/student-activity-log', [ActivityLogController::class, 'getStudentActivityLog']);

    Route::get('/reports', [ReportController::class, 'index'])
        ->middleware('admin')
        ->name('reports');
    Route::get('/reports/export-data', [ReportController::class, 'exportData'])
        ->middleware('admin')
        ->name('reports.export-data');

    // Student Information - Student Assistants can view, only Admin can modify
    Route::get('student-information', [StudentController::class, 'index'])->name('student-information.index');
    Route::post('student-information', [StudentController::class, 'store'])->middleware('admin')->name('student-information.store');
    Route::post('student-information/delete', [StudentController::class, 'bulkDelete'])->middleware('admin')->name('student-information.delete');
    Route::post('student-information/sync', [StudentController::class, 'syncExternalStudents'])->middleware('admin', 'throttle:5,60')->name('student-information.sync');


    // Inventory - Student Assistants can view, only Admin can modify
    Route::get('inventory', [AssetController::class, 'index'])->name('inventory.index');
    Route::post('inventory', [AssetController::class, 'store'])->middleware('admin')->name('inventory.store');
    Route::put('inventory/{inventory}', [AssetController::class, 'update'])->middleware('admin')->name('inventory.update');
    Route::delete('inventory/{inventory}', [AssetController::class, 'destroy'])->middleware('admin')->name('inventory.destroy');
    Route::put('inventory/{inventory}/status', [AssetController::class, 'updateStatus'])->middleware('admin')->name('inventory.updateStatus');
    Route::post('inventory/dispose', [AssetController::class, 'dispose'])->middleware('admin')->name('inventory.dispose');

    // Manage Cubicles (Admin and Music Dean only)
    Route::get('/manage-cubicles', [ManageCubiclesController::class, 'index'])
        ->middleware('admin')
        ->name('manage-cubicles.index');
    Route::post('/manage-cubicles', [ManageCubiclesController::class, 'store'])
        ->middleware('admin')
        ->name('manage-cubicles.store');
    Route::put('/manage-cubicles/{id}', [ManageCubiclesController::class, 'update'])
        ->middleware('admin')
        ->name('manage-cubicles.update');
    Route::delete('/manage-cubicles/{id}', [ManageCubiclesController::class, 'destroy'])
        ->middleware('admin')
        ->name('manage-cubicles.destroy');


    // Route::get('/manage-equipment', [ManageEquipmentController::class, 'index'])
    //     ->name('manage-equipment');

    Route::get('/account', function () {
        return Inertia::render('Account');
    })->name('account');

    Route::get('/user-profile', function () {
        return Inertia::render('UserProfile');
    })->name('user-profile');

    Route::get('/user-management', function () {
        return Inertia::render('UserManagement');
    })->middleware('admin')->name('user-management');

    Route::get('/api/students', [StudentController::class, 'apiSearch']);

    Route::get('/api/students/all', [MTLTimeController::class, 'getAllStudents'])->middleware('admin');
    Route::post('/mtl-time/reset', [MTLTimeController::class, 'resetMTLTime'])->middleware('admin')->name('mtl-time.reset');

    Route::get('/api/notifications', [NotificationController::class, 'index']);
    Route::post('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/api/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::get('/api/search-users', [UserController::class, 'searchUsers'])->middleware('admin');
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('admin')->name('users.resetPassword');

    Route::post('/bookings/cubicle', [BookingController::class, 'bookCubicle'])
        ->middleware('throttle:20,1')
        ->name('bookings.cubicle');
    Route::post('/bookings/instrument', [BookingController::class, 'bookInstrument'])
        ->middleware('throttle:20,1')
        ->name('bookings.instrument');
    Route::post('/bookings/tool', [BookingController::class, 'bookTool'])
        ->middleware('throttle:20,1')
        ->name('bookings.tool');

    Route::get('/api/available-cubicles', [BookingController::class, 'getAvailableCubicles']);
    Route::get('/api/available-instruments', [BookingController::class, 'getAvailableInstruments']);
    Route::get('/api/available-tools', [BookingController::class, 'getAvailableTools']);

    Route::get('/api/inventory/next-number', [InventoryController::class, 'getNextNumber'])->middleware('admin');

    Route::post('/timeouts/cubicle', [BookingController::class, 'timeoutCubicle'])
        ->middleware('throttle:60,1')
        ->name('timeouts.cubicle');
    Route::post('/timeouts/instrument', [BookingController::class, 'timeoutInstrument'])
        ->middleware('throttle:60,1')
        ->name('timeouts.instrument');
    Route::post('/timeouts/tool', [BookingController::class, 'timeoutTool'])
        ->middleware('throttle:60,1')
        ->name('timeouts.tool');

    Route::post('/users', [UserController::class, 'store'])->middleware('admin')->name('users.store');

    // RFID Token Management (Admin only)
    Route::post('/api/rfid/token/generate', [RfidTokenController::class, 'generateToken'])->middleware('admin')->name('rfid.token.generate');
    Route::get('/api/rfid/tokens', [RfidTokenController::class, 'listTokens'])->middleware('admin')->name('rfid.tokens.list');
    Route::delete('/api/rfid/tokens/{tokenId}', [RfidTokenController::class, 'revokeToken'])->middleware('admin')->name('rfid.token.revoke');

    Route::post('/profile-picture', [ProfilePictureController::class, 'upload'])->name('profile-picture.upload');
    Route::delete('/profile-picture', [ProfilePictureController::class, 'remove'])->name('profile-picture.remove');

    Route::get('/api/dashboard-chart/weekly-usage', [DashboardChartController::class, 'getWeeklyUsage']);
    Route::get('/api/dashboard-chart/weekly-tool-usage', [DashboardChartController::class, 'getWeeklyToolUsage']);
    Route::get('/api/dashboard-chart/weekly-cubicle-usage', [DashboardChartController::class, 'getWeeklyCubicleUsage']);
});

// RFID Scanner Routes - Protected with both web session and Sanctum API tokens
Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::post('/rfid-scan', [RfidController::class, 'rfidScan'])->name('rfid.scan');
    Route::post('/rfid-logout', [RfidController::class, 'rfidLogout'])->name('rfid.logout');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
