import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Home, Clock, BarChart, Users, Package, Wrench, UserCog, Building2, Calendar } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuNavItems: NavItem[] = [
    {
        title: 'Home',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Cecilia Hall',
        href: '/cecilia-hall',
        icon: Building2,
    },
    {
        title: 'MTL Booking',
        href: '/mtl-booking',
        icon: Calendar,
    },
    {
        title: 'Resources',
        href: '/resources',
        icon: BookOpen,
    },
];

const conditionalMenuNavItems: NavItem[] = [
    {
        title: 'Activity Log',
        href: '/activity-log',
        icon: Clock,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart,
    },
];

const studentNavItems: NavItem[] = [
    {
        title: 'Information',
        href: '/student-information',
        icon: Users,
    },
];

const inventoryNavItems: NavItem[] = [
    {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
    },
];

const cubicleNavItems: NavItem[] = [
    {
        title: 'Manage Cubicles',
        href: '/manage-cubicles',
        icon: Building2,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth.user;
    const page = usePage();

    const isStudentAssistant = user?.role === 'Student Assistant';
    const isStudentPanel = user?.role === 'Student Panel';
    const isAdministratorOrMusicDean = user?.role === 'Administrator' || user?.role === 'Music Dean';
    const getInitials = useInitials();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:!bg-transparent hover:!text-inherit">
                            <Link href={'/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* MENU Section */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>MENU</SidebarGroupLabel>
                    <SidebarMenu>
                        {menuNavItems
                            .filter(item => {
                                // Hide Cecilia Hall from Student Panel
                                if (item.title === 'Cecilia Hall' && isStudentPanel) {
                                    return false;
                                }
                                return true;
                            })
                            .map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith(typeof item.href === 'string' ? item.href : item.href.url)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                        {!isStudentAssistant && !isStudentPanel && conditionalMenuNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith(typeof item.href === 'string' ? item.href : item.href.url)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* STUDENT Section */}
                {!isStudentPanel && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>STUDENT</SidebarGroupLabel>
                        <SidebarMenu>
                            {studentNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(typeof item.href === 'string' ? item.href : item.href.url)}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* INVENTORY Section */}
                {!isStudentPanel && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>INVENTORY</SidebarGroupLabel>
                        <SidebarMenu>
                            {inventoryNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(typeof item.href === 'string' ? item.href : item.href.url)}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* CUBICLES Section - Admin and Music Dean only */}
                {isAdministratorOrMusicDean && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>CUBICLES</SidebarGroupLabel>
                        <SidebarMenu>
                            {cubicleNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(typeof item.href === 'string' ? item.href : item.href.url)}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* ACCOUNT Section */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>ACCOUNT</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                tooltip={{ children: "Account" }}
                                asChild
                                isActive={page.url.startsWith('/account') || page.url.startsWith('/user-profile') || page.url.startsWith('/user-management')}
                            >
                                <Link href="/account" prefetch>
                                    <UserCog />
                                    <span>Account</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
