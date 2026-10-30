import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import ResetMTLTimeModal from '@/components/ResetMTLTimeModal';
import SuccessModal from '@/components/SuccessModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const page = usePage<SharedData & { flash: { success?: boolean; message?: string } }>();
    const { auth, flash } = page.props;
    const [isResetMTLTimeModalOpen, setIsResetMTLTimeModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Handle flash messages from backend
    useEffect(() => {
        console.log('Flash data:', flash);
        if (flash?.success && flash?.message) {
            console.log('Showing success modal:', flash.message);
            setSuccessMessage(flash.message);
            setIsSuccessModalOpen(true);
        }
    }, [flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to resend the verification email.
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing} data-test="update-profile-button">Save</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {(auth.user.role === 'Administrator' || auth.user.role === 'Music Dean') && (
                    <div className="space-y-6">
                        <HeadingSmall 
                            title="Reset MTL Time" 
                            description="Reset MTL session time for all students or specific students back to 480 minutes (8 hours)."
                        />
                        
                        <Button 
                            onClick={() => setIsResetMTLTimeModalOpen(true)} 
                            variant="destructive"
                        >
                            Reset MTL Time
                        </Button>
                    </div>
                )}

                <DeleteUser />
            </SettingsLayout>

            {(auth.user.role === 'Administrator' || auth.user.role === 'Music Dean') && (
                <>
                    <ResetMTLTimeModal
                        isOpen={isResetMTLTimeModalOpen}
                        onClose={() => setIsResetMTLTimeModalOpen(false)}
                        onSuccess={() => {
                            console.log('onSuccess callback triggered');
                            // Use flash message if available, otherwise use default
                            const message = flash?.message || 'MTL time has been successfully reset!';
                            setSuccessMessage(message);
                            setIsSuccessModalOpen(true);
                        }}
                    />

                    <SuccessModal
                        isOpen={isSuccessModalOpen}
                        onClose={() => setIsSuccessModalOpen(false)}
                        message={successMessage}
                    />
                </>
            )}
        </AppLayout>
    );
}
