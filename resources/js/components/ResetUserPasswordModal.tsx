import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ResetUserPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedUser?: { id: number; name: string; email: string } | null;
}

export default function ResetUserPasswordModal({ isOpen, onClose, preselectedUser }: ResetUserPasswordModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<Array<{ id: number; name: string; role: string; email: string }>>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; role?: string; email: string } | null>(preselectedUser || null);
    const [isSearching, setIsSearching] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);



    const handleSearch = async (value: string) => {
        setSearchTerm(value);
        setError(null);
        setSuccess(null);

        if (value.length < 2) {
            setUsers([]);
            setSelectedUser(null);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/search-users?q=${encodeURIComponent(value)}`);
            if (!response.ok) throw new Error('Failed to search users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError('Failed to search users');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setSearchTerm(user.name);
        setUsers([]);
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;

        setIsResetting(true);
        setError(null);
        setSuccess(null);

        router.post(
            `/users/${selectedUser.id}/reset-password`,
            {},
            {
                onSuccess: () => {
                    setSuccess(`Password for ${selectedUser.name} has been reset successfully. The user has been notified.`);
                    setTimeout(() => {
                        onClose();
                        setSearchTerm('');
                        setSelectedUser(null);
                        setSuccess(null);
                    }, 2000);
                },
                onError: (errors: any) => {
                    setError(errors.message || 'Failed to reset password');
                },
                onFinish: () => {
                    setIsResetting(false);
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reset User Password</DialogTitle>
                    <DialogDescription>
                        Search and select any user to reset their password to the default for their role.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Input
                            placeholder="Search user by name..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            disabled={isSearching || isResetting}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {users.length > 0 && (
                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 border-b last:border-b-0 transition-colors"
                                >
                                    <div className="font-medium text-sm">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.role} • {user.email}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected User Info */}
                    {selectedUser && (
                        <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950">
                            <div className="font-medium text-sm mb-1">{selectedUser.name}</div>
                            <div className="text-xs text-muted-foreground">{selectedUser.role}</div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="w-4 h-4 bg-green-600 dark:bg-green-400 rounded-full flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={!selectedUser || isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
