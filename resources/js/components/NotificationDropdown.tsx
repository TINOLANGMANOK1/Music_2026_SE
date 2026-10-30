import { Bell, Trash2, Clock, Mail, CheckCircle2, Search, X, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import ResetUserPasswordModal from './ResetUserPasswordModal';

interface Notification {
    id: string;
    type: string;
    data: {
        user_email: string;
        user_name: string;
        user_id: number;
        message: string;
    };
    read_at: string | null;
    created_at: string;
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; email: string } | null>(null);
    const { auth } = usePage().props as any;

    const fetchNotifications = async () => {
        // Only fetch for Admins and Music Deans
        if (!auth.user || !['Administrator', 'Music Dean'].includes(auth.user.role)) {
            return;
        }
        
        try {
            const response = await fetch('/api/notifications', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                console.error('Failed to fetch notifications, status:', response.status);
                return;
            }
            
            const data = await response.json();
            setNotifications(data);
            const unread = data.filter((n: Notification) => !n.read_at).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const getCsrfToken = () => {
        // Try to get CSRF token from meta tag
        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // If not found, try to get from cookies (Laravel stores XSRF-TOKEN cookie)
        if (!csrfToken) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith('XSRF-TOKEN=')) {
                    csrfToken = decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
                    break;
                }
            }
        }
        
        return csrfToken;
    };

    useEffect(() => {
        // Fetch immediately on mount
        fetchNotifications();
        // Also re-fetch when auth changes (after login)
        const timer = setTimeout(() => {
            fetchNotifications();
        }, 500);
        
        // Set up interval for auto-refresh
        const interval = setInterval(fetchNotifications, 30000);
        
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [auth.user]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const csrfToken = getCsrfToken();
            console.log('Marking as read:', notificationId, 'CSRF:', csrfToken ? 'present' : 'MISSING');
            
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    _token: csrfToken,
                }),
            });
            
            console.log('Response status:', response.status);
            const text = await response.text();
            console.log('Response text:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                return;
            }
            
            console.log('Response data:', data);
            
            if (!response.ok) {
                console.error('Mark as read failed:', data);
                return;
            }
            
            console.log('Mark as read successful, refreshing...');
            await fetchNotifications();
            console.log('Notifications refreshed after mark as read');
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadNotifications = notifications.filter((n) => !n.read_at);
        const csrfToken = getCsrfToken();
        
        console.log('Marking all as read, count:', unreadNotifications.length, 'CSRF:', csrfToken ? 'present' : 'MISSING');
        
        try {
            const results = await Promise.all(
                unreadNotifications.map((n) =>
                    fetch(`/api/notifications/${n.id}/read`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': csrfToken || '',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            _token: csrfToken,
                        }),
                    })
                    .then(async (r) => {
                        const data = await r.json();
                        console.log(`Notification ${n.id} status:`, r.status, 'data:', data);
                        return r;
                    })
                    .catch(err => console.error(`Error marking ${n.id}:`, err))
                )
            );
            console.log('Mark all as read completed');
            await fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            const csrfToken = getCsrfToken();
            console.log('Deleting notification:', notificationId);
            
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    _token: csrfToken,
                }),
            });
            
            console.log('Delete response status:', response.status);
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse delete response:', text);
                return;
            }
            
            if (!response.ok) {
                console.error('Delete failed:', data);
                return;
            }
            
            console.log('Delete successful');
            await fetchNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleQuickAction = (notif: Notification) => {
        setSelectedUser({
            id: notif.data?.user_id || 0,
            name: notif.data?.user_name || 'Unknown User',
            email: notif.data?.user_email || 'unknown@example.com',
        });
        setShowResetModal(true);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getNotificationCategory = (type: string) => {
        const categories: Record<string, { label: string; color: string }> = {
            password_reset: { label: 'Password Reset', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            system_alert: { label: 'System Alert', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
            maintenance: { label: 'Maintenance', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
        };
        return categories[type] || { label: 'Notification', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' };
    };

    // Filter notifications
    const filteredNotifications = notifications.filter((notif) => {
        const userName = notif.data?.user_name || '';
        const userEmail = notif.data?.user_email || '';
        const matchesSearch =
            userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || (notif.type || 'password_reset') === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(notifications.map((n) => n.type || 'password_reset').filter(Boolean)));

    // Only show for Admins and Music Deans
    if (!auth.user || !['Administrator', 'Music Dean'].includes(auth.user.role)) {
        return null;
    }

    return (
        <>
            <DropdownMenu onOpenChange={(open) => {
                // Refresh notifications when dropdown opens
                if (open) {
                    fetchNotifications();
                }
            }}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 cursor-pointer hover:bg-accent">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-fit">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-96 p-0 max-h-[700px] overflow-hidden flex flex-col">
                    <div className="border-b border-border p-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/30 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-base">Notifications</h3>
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {unreadCount} new
                            </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-8 h-8 text-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filter & Mark All */}
                    {notifications.length > 0 && (
                        <div className="border-b border-border px-4 py-3 space-y-3 flex-shrink-0">
                            <div className="flex gap-1 flex-wrap">
                                <Button
                                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All
                                </Button>
                                {categories.map((cat) => {
                                    const category = getNotificationCategory(cat);
                                    return (
                                        <Button
                                            key={cat}
                                            variant={selectedCategory === cat ? 'default' : 'outline'}
                                            size="sm"
                                            className="text-xs h-7"
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {category.label}
                                        </Button>
                                    );
                                })}
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="w-full text-xs h-7 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                >
                                    Mark all as read
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Notifications List */}
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-8 px-4 flex-1 flex flex-col items-center justify-center">
                            <div className="flex justify-center mb-3">
                                <Bell className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? 'No notifications match your search' : 'No notifications yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[450px] overflow-y-auto flex-1">
                            {filteredNotifications.map((notif) => {
                                const category = getNotificationCategory(notif.type || 'password_reset');
                                return (
                                    <div
                                        key={notif.id}
                                        className={`mx-2 my-1 p-3 rounded-lg border transition-all ${
                                            notif.read_at
                                                ? 'bg-background border-border'
                                                : 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-900/30'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex gap-3 flex-1 min-w-0">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {notif.read_at ? (
                                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                                                    ) : (
                                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className={`font-medium text-sm ${notif.read_at ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                            {category.label}
                                                        </p>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${category.color}`}>
                                                            New
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 space-y-1">
                                                        <p className="text-xs font-medium text-foreground">{notif.data?.user_name || 'Unknown User'}</p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{notif.data?.user_email || 'unknown@example.com'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatTime(notif.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(notif.id)}
                                                className="h-7 w-7 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-all hover:shadow-sm hover:scale-110 active:scale-95"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            {!notif.read_at && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="flex-1 text-xs h-7 bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:border-blue-900/50 transition-all hover:shadow-sm hover:scale-105 active:scale-95"
                                                >
                                                    Mark as Read
                                                </Button>
                                            )}
                                            {(notif.type || 'password_reset') === 'password_reset' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleQuickAction(notif)}
                                                    className="flex-1 text-xs h-7 gap-1 bg-green-600 hover:bg-green-700 transition-all hover:shadow-md hover:scale-105 active:scale-95"
                                                >
                                                    <Key className="h-3 w-3" />
                                                    Reset Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {/* End of Notifications Indicator */}
                            <div className="px-4 py-3 border-t border-border bg-background text-center text-xs text-muted-foreground">
                                End of notifications
                            </div>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Password Modal */}
            {showResetModal && selectedUser && (
                <ResetUserPasswordModal
                    isOpen={showResetModal}
                    onClose={() => {
                        setShowResetModal(false);
                        setSelectedUser(null);
                    }}
                    preselectedUser={selectedUser}
                />
            )}
        </>
    );
}
