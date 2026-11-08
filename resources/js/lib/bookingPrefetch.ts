import { router } from '@inertiajs/react';

export function invalidateResourceAndActivityPrefetches() {
    router.flush('/resources');
    router.flush('/activity-log');
}
