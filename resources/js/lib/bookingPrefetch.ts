import { router } from '@inertiajs/react';

export function invalidateResourceAndActivityPrefetches() {
    router.flush('/resources');
    router.flush('/activity-log');
}
<<<<<<< HEAD

export function invalidateBookingPrefetches() {
    router.flush('/cecilia-hall');
    router.flush('/cecilia-hall/approvals');
    router.flush('/mtl-booking');
    router.flush('/mtl-booking/approvals');
}
=======
>>>>>>> 621add42940bdb7224513d52ec87c861001273ee
