<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('reset password link screen can be rendered', function () {
    $this->get(route('password.request'))->assertOk();
});

test('reset request notifies an administrator without disclosing whether an account exists', function () {
    $admin = User::factory()->create(['role' => 'Administrator']);
    $user = User::factory()->create(['role' => 'Student Assistant']);

    $knownEmailResponse = $this->post(route('password.email'), ['email' => $user->email]);
    $unknownEmailResponse = $this->post(route('password.email'), ['email' => 'missing@example.com']);

    $genericStatus = __('If an account exists with that email, an administrator has been notified.');
    $knownEmailResponse->assertSessionHas('status', $genericStatus);
    $unknownEmailResponse->assertSessionHas('status', $genericStatus);

    $this->assertDatabaseHas('notifications', [
        'notifiable_id' => $admin->id,
        'notifiable_type' => User::class,
        'type' => 'password_reset',
    ]);

    expect(DB::table('password_reset_tokens')->where('email', $user->email)->exists())->toBeTrue();
    expect(DB::table('password_reset_tokens')->where('email', 'missing@example.com')->exists())->toBeFalse();
});

test('reset password screen can be rendered for a token', function () {
    $this->get(route('password.reset', 'example-token'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/reset-password'));
});
