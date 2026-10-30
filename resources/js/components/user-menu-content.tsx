import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import LogoutSuccessModal from '@/components/LogoutSuccessModal';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        setShowLogoutSuccess(true);
    };

    const confirmLogoutSuccess = () => {
        setShowLogoutSuccess(false);
        // Clear login success flag so modal shows on next login
        sessionStorage.removeItem('hasSeenLoginSuccess');
        
        // Use native form submission to avoid CSRF token issues
        // Create a hidden form and submit it
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = logout().url;
        
        // Add CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        document.body.appendChild(form);
        form.submit();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href="/account" as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                onClick={(e) => {
                    e.preventDefault();
                    setShowLogoutConfirm(true);
                }}
                data-test="logout-button"
            >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
            </DropdownMenuItem>

            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmLogout}
                title="Log out?"
                message="Are you sure you want to log out? You will need to log in again to access the system."
                confirmText="Log out"
            />

            <LogoutSuccessModal
                isOpen={showLogoutSuccess}
                onClose={() => setShowLogoutSuccess(false)}
                onConfirm={confirmLogoutSuccess}
            />
        </>
    );
}
