import { router } from '@inertiajs/react';

export function invalidateResourceAndActivityPrefetches() {
    router.flush('/resources');
    router.flush('/activity-log');
}

export function invalidateBookingPrefetches() {
    router.flush('/cecilia-hall');
    router.flush('/cecilia-hall/approvals');
    router.flush('/mtl-booking');
    router.flush('/mtl-booking/approvals');
}
