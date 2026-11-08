<?php

use App\Models\CeciliaHallBooking;
use App\Models\MTLBooking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

test('MTL booking page does not complete bookings or deduct time', function () {
    $user = User::factory()->create(['role' => 'Student Assistant']);
    DB::table('student')->insert([
        'student_id' => 'student-1',
        'first_name' => 'Test',
        'last_name' => 'Student',
        'middle_initial' => '',
        'mtl_time_remaining' => 120,
        'year' => 1,
        'sec' => 'A',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    MTLBooking::create([
        'user_id' => $user->id,
        'student_id' => 'student-1',
        'name' => 'Test Student',
        'email' => $user->email,
        'date' => now()->subDay()->toDateString(),
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'status' => 'approved',
    ]);

    $this->actingAs($user)->get(route('mtl-booking'))->assertOk();

    $this->assertDatabaseHas('student', [
        'student_id' => 'student-1',
        'mtl_time_remaining' => 120,
    ]);
    $this->assertDatabaseHas('mtl_bookings', [
        'student_id' => 'student-1',
        'status' => 'approved',
    ]);
});

test('expired MTL bookings are completed and deducted once by the scheduled command', function () {
    $this->travelTo(Carbon::parse('2026-03-10 12:00:00'));
    $user = User::factory()->create();
    DB::table('student')->insert([
        'student_id' => 'student-2',
        'first_name' => 'Test',
        'last_name' => 'Student',
        'middle_initial' => '',
        'mtl_time_remaining' => 120,
        'year' => 1,
        'sec' => 'A',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $booking = MTLBooking::create([
        'user_id' => $user->id,
        'student_id' => 'student-2',
        'name' => 'Test Student',
        'email' => $user->email,
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'status' => 'approved',
    ]);

    $this->artisan('mtl:complete-expired-bookings')->assertSuccessful();
    $this->artisan('mtl:complete-expired-bookings')->assertSuccessful();

    $this->assertDatabaseHas('student', [
        'student_id' => 'student-2',
        'mtl_time_remaining' => 60,
    ]);
    $this->assertDatabaseHas('mtl_bookings', [
        'id' => $booking->id,
        'status' => 'completed',
    ]);
});

test('MTL approvals are limited to administrator and dean roles', function () {
    $this->actingAs(User::factory()->create(['role' => 'Student Assistant']))
        ->get(route('mtl-booking.approvals'))
        ->assertForbidden();

    $this->actingAs(User::factory()->create(['role' => 'Administrator']))
        ->get(route('mtl-booking.approvals'))
        ->assertOk();

    $this->actingAs(User::factory()->create(['role' => 'Music Dean']))
        ->get(route('mtl-booking.approvals'))
        ->assertOk();
});

test('MTL approval is reflected in the booking page and removed from pending approvals', function () {
    $dean = User::factory()->create(['role' => 'Music Dean']);
    $booking = MTLBooking::create([
        'user_id' => $dean->id,
        'student_id' => 'student-approval-refresh',
        'name' => 'Test Student',
        'email' => $dean->email,
        'date' => now()->addDay()->toDateString(),
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'status' => 'pending',
    ]);

    $this->actingAs($dean)
        ->patch(route('mtl-booking.update-status', $booking), ['status' => 'approved'])
        ->assertOk();

    $this->get(route('mtl-booking'))
        ->assertInertia(fn ($page) => $page
            ->where('bookings.0.id', $booking->id)
            ->where('bookings.0.status', 'approved'));

    $this->get(route('mtl-booking.approvals'))
        ->assertInertia(fn ($page) => $page->has('pendingBookings', 0));
});

test('Cecilia Hall approval is reflected in the booking page and removed from pending approvals', function () {
    $dean = User::factory()->create(['role' => 'Music Dean']);
    $booking = CeciliaHallBooking::create([
        'name' => 'Test Booker',
        'email' => 'booker@example.com',
        'booker_type' => 'music_department',
        'date' => now()->addDay()->toDateString(),
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'purpose' => 'Test booking',
        'status' => 'pending',
    ]);

    $this->actingAs($dean)
        ->patch(route('cecilia-hall.update-status', $booking), ['status' => 'approved'])
        ->assertOk();

    $this->get(route('cecilia-hall'))
        ->assertInertia(fn ($page) => $page
            ->where('bookings.0.id', $booking->id)
            ->where('bookings.0.status', 'approved'));

    $this->get(route('cecilia-hall.approvals'))
        ->assertInertia(fn ($page) => $page->has('pendingBookings', 0));
});

test('Cecilia authorization letters are limited to the dean or booking owner', function () {
    $owner = User::factory()->create(['role' => 'Student Assistant']);
    $otherUser = User::factory()->create(['role' => 'Student Assistant']);
    $booking = CeciliaHallBooking::create([
        'name' => $owner->name,
        'email' => $owner->email,
        'booker_type' => 'music_department',
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'purpose' => 'Test booking',
        'status' => 'pending',
        'letter_path' => 'cecilia-hall-letters/test.pdf',
    ]);

    $this->actingAs($otherUser)
        ->get(route('cecilia-hall.view-letter', $booking))
        ->assertForbidden();

    $this->actingAs($owner)
        ->get(route('cecilia-hall.view-letter', $booking))
        ->assertNotFound();

    $dean = User::factory()->create(['role' => 'Music Dean']);
    $this->actingAs($dean)
        ->get(route('cecilia-hall.view-letter', $booking))
        ->assertNotFound();
});

test('Cecilia rejection does not record approval metadata', function () {
    $dean = User::factory()->create(['role' => 'Music Dean']);
    $booking = CeciliaHallBooking::create([
        'name' => 'Test Booker',
        'email' => 'booker@example.com',
        'booker_type' => 'music_department',
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'purpose' => 'Test booking',
        'status' => 'pending',
    ]);

    $this->actingAs($dean)
        ->patch(route('cecilia-hall.update-status', $booking), [
            'status' => 'rejected',
            'rejection_reason' => 'Test rejection',
        ])
        ->assertOk();

    $this->assertDatabaseHas('cecilia_hall_bookings', [
        'id' => $booking->id,
        'status' => 'rejected',
        'approved_by' => null,
        'approved_at' => null,
    ]);
});

test('adjacent MTL and Cecilia bookings do not conflict', function () {
    $user = User::factory()->create();
    MTLBooking::create([
        'user_id' => $user->id,
        'name' => 'First MTL booking',
        'email' => $user->email,
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'status' => 'approved',
    ]);

    expect(MTLBooking::hasConflict('2026-03-10', '11:00:00', '12:00:00'))->toBeFalse();
    expect(MTLBooking::hasConflict('2026-03-10', '10:30:00', '11:30:00'))->toBeTrue();

    CeciliaHallBooking::create([
        'name' => 'First Hall booking',
        'email' => $user->email,
        'booker_type' => 'music_department',
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'purpose' => 'Test booking',
        'status' => 'approved',
    ]);

    expect((new CeciliaHallBooking([
        'date' => '2026-03-10',
        'start_time' => '11:00:00',
        'end_time' => '12:00:00',
    ]))->hasConflict())->toBeFalse();
    expect((new CeciliaHallBooking([
        'date' => '2026-03-10',
        'start_time' => '10:30:00',
        'end_time' => '11:30:00',
    ]))->hasConflict())->toBeTrue();
});

describe('borrow and return workflows', function () {
    beforeEach(function () {
        $this->travelTo(Carbon::parse('2026-03-10 10:00:00'));
        $this->borrower = User::factory()->create(['role' => 'Student Assistant']);
        $this->studentId = 'borrow-student';

        DB::table('student')->insert([
            'student_id' => $this->studentId,
            'first_name' => 'Borrow',
            'last_name' => 'Student',
            'middle_initial' => '',
            'mtl_time_remaining' => 120,
            'year' => 1,
            'sec' => 'A',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    });

    test('MTL cubicle can be booked and returned with minutes deducted', function () {
        DB::table('cubicle_info')->insert([
            'cubicle_id' => 'mtl-1',
            'cubicle_type_id' => 3,
            'cubicle_type' => 'MTL',
            'cubicle_no' => 1,
            'cubicle_name' => 'MTL Cubicle',
            'cubicle_num' => '1',
            'cubicle_loc' => 'LSGH 1F',
            'status' => 'Available',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->borrower)
            ->from(route('dashboard'))
            ->post(route('bookings.cubicle'), [
                'cubicle_id' => 'mtl-1',
                'student_id' => $this->studentId,
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->travelTo(Carbon::parse('2026-03-10 10:30:00'));
        $this->actingAs($this->borrower)
            ->from(route('dashboard'))
            ->post(route('timeouts.cubicle'), ['cubicle_id' => 'mtl-1'])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('cubicle_bookings', [
            'cubicle_id' => 'mtl-1',
            'status' => 'Active',
        ]);
        $this->assertDatabaseHas('cubicle_info', [
            'cubicle_id' => 'mtl-1',
            'status' => 'Available',
        ]);
        expect(DB::table('cubicle_usage')->where('cubicle_id', 'mtl-1')->value('end_time'))->not->toBeNull();
        $this->assertDatabaseHas('student', [
            'student_id' => $this->studentId,
            'mtl_time_remaining' => 90,
        ]);
    });

    test('instrument can be borrowed and returned', function () {
        $instrumentId = DB::table('assets')->insertGetId([
            'asset_code' => 'INST-TEST-1',
            'name' => 'Test Guitar',
            'category' => 'Musical Instruments',
            'office' => 'Music Room',
            'is_borrowable' => true,
            'status' => 'Available',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('instrument_info')->insert([
            'instrument_id' => (string) $instrumentId,
            'instrument_type_id' => '1',
            'instrument_type' => 'Musical Instruments',
            'instrument_no' => (string) $instrumentId,
            'status' => 'Available',
        ]);

        $this->actingAs($this->borrower)
            ->from(route('dashboard'))
            ->post(route('bookings.instrument'), [
                'instrument_id' => $instrumentId,
                'student_id' => $this->studentId,
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->travelTo(Carbon::parse('2026-03-10 10:15:00'));
        $this->actingAs($this->borrower)
            ->from(route('dashboard'))
            ->post(route('timeouts.instrument'), ['instrument_id' => $instrumentId])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('instrument_bookings', [
            'instrument_id' => $instrumentId,
            'status' => 'Active',
        ]);
        $this->assertDatabaseHas('assets', [
            'id' => $instrumentId,
            'status' => 'Available',
        ]);
        expect(DB::table('instrument_usage')->where('instrument_id', $instrumentId)->value('end_time'))->not->toBeNull();
    });

    test('tool can be borrowed and returned', function () {
        $toolId = DB::table('assets')->insertGetId([
            'asset_code' => 'TOOL-TEST-1',
            'name' => 'Test Tool',
            'category' => 'Hand Tools',
            'office' => 'Music Room',
            'is_borrowable' => true,
            'status' => 'Available',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('tools_info')->insert([
            'tool_id' => (string) $toolId,
            'tool_type' => 'Hand Tools',
            'tool_no' => (string) $toolId,
            'status' => 'Available',
        ]);

        $this->actingAs($this->borrower)
            ->from(route('dashboard'))
            ->post(route('bookings.tool'), [
                'tool_ids' => [$toolId],
                'student_id' => $this->studentId,
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->travelTo(Carbon::parse('2026-03-10 10:15:00'));
        $this->actingAs($this->borrower)
            ->from(route('dashboard'))
            ->post(route('timeouts.tool'), ['tool_id' => $toolId])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('tool_bookings', [
            'tool_id' => $toolId,
            'status' => 'Active',
        ]);
        $this->assertDatabaseHas('assets', [
            'id' => $toolId,
            'status' => 'Available',
        ]);
        $this->assertDatabaseHas('tool_usage', [
            'tool_id' => $toolId,
            'student_id' => $this->studentId,
        ]);
        expect(DB::table('tool_usage')->where('tool_id', $toolId)->where('student_id', $this->studentId)->value('end_time'))->not->toBeNull();
    });

    test('non-borrowable instruments are rejected without changing inventory', function () {
        $instrumentId = DB::table('assets')->insertGetId([
            'asset_code' => 'INST-TEST-NO-BORROW',
            'name' => 'Unavailable Instrument',
            'category' => 'Musical Instruments',
            'office' => 'Music Room',
            'is_borrowable' => false,
            'status' => 'Available',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->borrower)
            ->postJson(route('bookings.instrument'), [
                'instrument_id' => $instrumentId,
                'student_id' => $this->studentId,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('booking', 'Instrument is not available.');

        $this->assertDatabaseMissing('instrument_bookings', ['instrument_id' => $instrumentId]);
        $this->assertDatabaseHas('assets', [
            'id' => $instrumentId,
            'status' => 'Available',
        ]);
    });
});
