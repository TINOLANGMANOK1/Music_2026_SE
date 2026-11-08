import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash?: {
        success?: string;
        message?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    profile_picture_path?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface BookingResult {
    reference: string;
    name: string;
    idNumber: string;
    cubicleType?: string;
    cubicleNo?: number | string;
    instrumentType?: string;
    instrumentNo?: number | string;
    toolType?: string;
    toolNo?: number | string;
    instruments?: Array<{ category: string; code: string }>;
    tools?: Array<{ category: string; code: string }>;
}

export interface BookingFailureResult {
    errorMessage: string;
    studentDetails: {
        studentId: string;
        name: string;
        availableTime: string;
    };
}

export interface BookingItemDetail {
    type: 'instrument' | 'tool';
    category: string;
    code: string;
}
