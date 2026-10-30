import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AddUserModal from '@/components/AddUserModal';
import ResetUserPasswordModal from '@/components/ResetUserPasswordModal';
import ResetMTLTimeModal from '@/components/ResetMTLTimeModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import SuccessModal from '@/components/SuccessModal';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    profile_picture_path: string | null;
}

export default function UserManagement() {
    const { auth } = usePage().props as any;
    const user = auth.user as UserData;

    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isResetUserPasswordModalOpen, setIsResetUserPasswordModalOpen] = useState(false);
    const [isResetMTLTimeModalOpen, setIsResetMTLTimeModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('MTL time has been successfully reset!');

    return (
        <AppLayout>
            <Head title="User Management" />
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-2">User Management</h1>
                <p className="text-muted-foreground mb-6">
                    Manage user accounts, reset passwords, and configure system settings.
                </p>

                {/* User Management Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-primary">User Management</h2>
                    
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

                {/* Password Management Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-primary">Password Management</h2>
                    
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

                    {/* Change Password Card */}
                    {user?.role !== 'Student Panel' && (
                        <Card className="mb-6 p-7">
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Update your account password</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    Click below to change your account password.
                                </p>
                                <Button onClick={() => setIsChangePasswordModalOpen(true)}>Change Password</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
            />

            {/* Reset User Password Modal */}
            <ResetUserPasswordModal
                isOpen={isResetUserPasswordModalOpen}
                onClose={() => setIsResetUserPasswordModalOpen(false)}
            />

            {/* Reset MTL Time Modal */}
            <ResetMTLTimeModal
                isOpen={isResetMTLTimeModalOpen}
                onClose={() => setIsResetMTLTimeModalOpen(false)}
                onSuccess={() => {
                    setSuccessMessage('MTL time has been successfully reset!');
                    setIsSuccessModalOpen(true);
                }}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
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
