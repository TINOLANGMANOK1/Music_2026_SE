import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import AddUserModal from '@/components/AddUserModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import ResetUserPasswordModal from '@/components/ResetUserPasswordModal';
import ResetMTLTimeModal from '@/components/ResetMTLTimeModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    profile_picture_path: string | null;
}

export default function Account() {
    const { auth } = usePage().props as any;
    const user = auth.user as UserData; // Cast to UserData

    const [userData, setUserData] = useState<UserData | null>(user);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isResetUserPasswordModalOpen, setIsResetUserPasswordModalOpen] = useState(false);
    const [isResetMTLTimeModalOpen, setIsResetMTLTimeModalOpen] = useState(false);
    const [isConfirmChangePhotoModalOpen, setIsConfirmChangePhotoModalOpen] = useState(false);
    const [isConfirmRemovePhotoModalOpen, setIsConfirmRemovePhotoModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Your profile picture has been successfully updated.');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'management'>('profile');

    const getInitials = useInitials(); // Assuming useInitials is available

    // Sync userData when auth.user changes
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
                event.target.value = ''; // Clear the file input
                // Force a full page reload to get updated data
                router.reload({ only: ['auth'] });
            },
            onError: (errors: any) => {
                setMessage({ type: 'error', text: errors.profile_picture || 'Failed to upload profile picture.' });
                event.target.value = ''; // Clear the file input
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

    const openChangePasswordModal = () => {
        setIsChangePasswordModalOpen(true);
    };

    return (
        <AppLayout>
            <Head title="Account" />
            <div className="p-4 md:p-10">
                <div className="mb-2">
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your personal profile information and user management.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 mt-6 border-b">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2",
                            activeTab === 'profile'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <User className="h-5 w-5" />
                        My Profile
                    </button>
                    {(user?.role === 'Administrator' || user?.role === 'Music Dean') && (
                        <button
                            onClick={() => setActiveTab('management')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2",
                                activeTab === 'management'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Users className="h-5 w-5" />
                            User Management
                        </button>
                    )}
                </div>

                {activeTab === 'profile' && (
                    <>
                {/* User Profile Section */}
                <div className="mb-8">
                    
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
                                        
                                        // Check if it's a full URL (http or https)
                                        if (path.startsWith('http://') || path.startsWith('https://')) {
                                            return path;
                                        }
                                        
                                        // Otherwise it's a local path
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

                {/* Password Management Section */}
                {user?.role !== 'Student Panel' && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-primary">Password Management</h2>
                        
                        {/* Change Password Card */}
                        <Card className="mb-6 p-7">
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Update your account password for security</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    To keep your account secure, please remember to update your password regularly.
                                </p>
                                <Button onClick={openChangePasswordModal}>Change Password</Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
                </>
                )}

                {activeTab === 'management' && (user?.role === 'Administrator' || user?.role === 'Music Dean') && (
                    <>
                {/* User Management Section */}
                <div className="mb-8">
                        
                        {/* Add New User Card */}
                        <Card className="mb-6 p-7">
                            <CardHeader>
                                <CardTitle>Add New User</CardTitle>
                                <CardDescription>Create new user accounts in the system</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    Click below to add a new user to the system.
                                </p>
                                <Button onClick={() => setIsAddUserModalOpen(true)}>Add New User</Button>
                            </CardContent>
                        </Card>

                        {/* Reset User Password Card */}
                        <Card className="mb-6 p-7">
                            <CardHeader>
                                <CardTitle>Reset User Password</CardTitle>
                                <CardDescription>Reset passwords for users to default</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    Reset passwords for any user in the system to their role's default password.
                                </p>
                                <Button onClick={() => setIsResetUserPasswordModalOpen(true)}>Reset Password</Button>
                            </CardContent>
                        </Card>

                        {/* Reset MTL Time Card */}
                        <Card className="mb-6 p-7">
                            <CardHeader>
                                <CardTitle>Reset MTL Time</CardTitle>
                                <CardDescription>Reset student MTL session time to default (8 hours)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    Reset MTL session time for all students or specific students back to 480 minutes (8 hours).
                                </p>
                                <Button onClick={() => setIsResetMTLTimeModalOpen(true)} variant="destructive">
                                    Reset MTL Time
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </>
                )}
            </div>

            {/* Add User Modal */}

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />

            {/* Reset User Password Modal */}
            <ResetUserPasswordModal
                isOpen={isResetUserPasswordModalOpen}
                onClose={() => setIsResetUserPasswordModalOpen(false)}
            />

            {/* Reset MTL Time Modal */}
            {(user?.role === 'Administrator' || user?.role === 'Music Dean') && (
                <ResetMTLTimeModal
                    isOpen={isResetMTLTimeModalOpen}
                    onClose={() => setIsResetMTLTimeModalOpen(false)}
                    onSuccess={() => {
                        setSuccessMessage('MTL time has been successfully reset!');
                        setIsSuccessModalOpen(true);
                    }}
                />
            )}

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
