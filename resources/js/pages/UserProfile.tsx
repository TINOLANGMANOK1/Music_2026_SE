import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    profile_picture_path: string | null;
}

export default function UserProfile() {
    const { auth } = usePage().props as any;
    const user = auth.user as UserData;

    const [userData, setUserData] = useState<UserData | null>(user);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmChangePhotoModalOpen, setIsConfirmChangePhotoModalOpen] = useState(false);
    const [isConfirmRemovePhotoModalOpen, setIsConfirmRemovePhotoModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Your profile picture has been successfully updated.');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getInitials = useInitials();

    useEffect(() => {
        setUserData(user);
    }, [user]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        router.post('/profile-picture', formData, {
            onSuccess: () => {
                setIsSuccessModalOpen(true);
                event.target.value = '';
                router.reload({ only: ['auth'] });
            },
            onError: (errors: any) => {
                setMessage({ type: 'error', text: errors.profile_picture || 'Failed to upload profile picture.' });
                event.target.value = '';
            },
            preserveScroll: true,
        });
    };

    const handleUploadClick = () => {
        if (userData?.profile_picture_path) {
            setIsConfirmChangePhotoModalOpen(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleConfirmChangePhoto = () => {
        setIsConfirmChangePhotoModalOpen(false);
        fileInputRef.current?.click();
    };

    const handleRemovePicture = () => {
        if (!userData?.profile_picture_path) {
            setMessage({ type: 'error', text: 'No profile picture to remove.' });
            return;
        }

        setIsConfirmRemovePhotoModalOpen(true);
    };

    const handleConfirmRemovePhoto = () => {
        setIsConfirmRemovePhotoModalOpen(false);
        router.delete('/profile-picture', {
            onSuccess: () => {
                setIsSuccessModalOpen(true);
                router.reload({ only: ['auth'] });
            },
            onError: (errors: any) => {
                setMessage({ type: 'error', text: 'Failed to remove profile picture.' });
            },
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title="User Profile" />
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-2">User Profile</h1>
                <p className="text-muted-foreground mb-6">
                    Manage your personal profile information and account settings.
                </p>

                {/* Profile Picture Card */}
                <Card className="mb-6 p-7">
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                        <CardDescription>Upload or remove your profile picture</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center space-x-4">
                        <Avatar className="size-24">
                            <AvatarImage 
                                src={(() => {
                                    const path = userData?.profile_picture_path;
                                    if (!path) return undefined;
                                    
                                    if (path.startsWith('http://') || path.startsWith('https://')) {
                                        return path;
                                    }
                                    
                                    return `/storage/${path}`;
                                })()} 
                                alt="Profile" 
                            />
                            <AvatarFallback className="text-black dark:text-white">{getInitials(userData?.name || '')}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                            <Button onClick={handleUploadClick}>Upload Photo</Button>
                            <Button variant="outline" onClick={handleRemovePicture} disabled={!userData?.profile_picture_path}>Remove Photo</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic Information Card */}
                <Card className="mb-6 p-7">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Your personal account details</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">NAME</label>
                            <Input id="name" value={userData?.name || ''} readOnly />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ROLE</label>
                            <Input id="role" value={userData?.role || ''} readOnly />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">EMAIL</label>
                            <Input id="email" value={userData?.email || ''} readOnly />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PHONE NO.</label>
                            <Input id="phone" value={userData?.phone || ''} readOnly />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Modal for changing profile picture */}
            <ConfirmationModal
                isOpen={isConfirmChangePhotoModalOpen}
                onClose={() => setIsConfirmChangePhotoModalOpen(false)}
                onConfirm={handleConfirmChangePhoto}
                title="Change Profile Picture"
                message="You already have a profile picture. Are you sure you want to change it?"
            />

            {/* Confirmation Modal for removing profile picture */}
            <ConfirmationModal
                isOpen={isConfirmRemovePhotoModalOpen}
                onClose={() => setIsConfirmRemovePhotoModalOpen(false)}
                onConfirm={handleConfirmRemovePhoto}
                title="Remove Profile Picture"
                message="Are you sure you want to remove your profile picture? This action cannot be undone."
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Success!"
                message={successMessage}
            />
        </AppLayout>
    );
}
