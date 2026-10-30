import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage 
                    src={(() => {
                        const path = user.profile_picture_path;
                        if (!path) return undefined;
                        
                        // Check if it's a full URL (http or https)
                        if (path.startsWith('http://') || path.startsWith('https://')) {
                            return path;
                        }
                        
                        // Otherwise it's a local path
                        return `/storage/${path}`;
                    })()} 
                    alt={user.name} 
                />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-gray-800 dark:text-white">{user.name}</span>
                {showEmail && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
            </div>
        </>
    );
}
