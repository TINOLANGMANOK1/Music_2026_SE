import BookCubicleModal from '@/components/BookCubicleModal';
import BorrowInstrumentModal from '@/components/BorrowInstrumentModal';
import BorrowToolModal from '@/components/BorrowToolModal';
import FailureModal from '@/components/FailureModal';
import LoginSuccessModal from '@/components/LoginSuccessModal';
import SuccessModal from '@/components/SuccessModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useModalContext } from '@/contexts/ModalContext';
import AppLayout from '@/layouts/app-layout';
import { type BookingFailureResult, type BookingResult } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, CalendarDays, Clock, DoorOpen, Music, Plus, TrendingUp, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CeciliaHallBooking {
    id: number;
    name: string;
    email: string;
    date: string;
    time: string;
    purpose: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    booker_type: 'music_department' | 'external';
}

interface DashboardProps {
    auth: {
        user: {
            name: string;
            email: string;
            role: string;
        };
    };
    recentActivity?: Array<{
        action: string;
        time: string;
        details: string;
    }>;
    ceciliaHallBookings?: CeciliaHallBooking[];
    pendingCount?: number;
    stats?: {
        todayBookings: number;
        pendingApprovals: number;
        availableInstruments: number;
        availableTools: number;
        availableCubicles: number;
    };
    loginSuccess?: boolean;
}

export default function StudentAssistantDashboard({
    auth,
    ceciliaHallBookings = [],
    stats = {
        todayBookings: 0,
        pendingApprovals: 0,
        availableInstruments: 0,
        availableTools: 0,
        availableCubicles: 0,
    },
    loginSuccess = false,
}: DashboardProps) {
    const [showFABMenu, setShowFABMenu] = useState(false);
    const [showLoginSuccess, setShowLoginSuccess] = useState(false);

    // Modal states
    const [isBookCubicleModalOpen, setIsBookCubicleModalOpen] = useState(false);
    const [isBorrowInstrumentModalOpen, setIsBorrowInstrumentModalOpen] = useState(false);
    const [isBorrowToolModalOpen, setIsBorrowToolModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<BookingResult | null>(null);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [failureDetails, setFailureDetails] = useState<BookingFailureResult | null>(null);

    const { setIsAnyBorrowModalOpen } = useModalContext();

    useEffect(() => {
        if (loginSuccess) {
            setShowLoginSuccess(true);
        }
    }, [loginSuccess]);

    useEffect(() => {
        const anyBorrowModalOpen = isBookCubicleModalOpen || isBorrowInstrumentModalOpen || isBorrowToolModalOpen;
        setIsAnyBorrowModalOpen(anyBorrowModalOpen);
    }, [isBookCubicleModalOpen, isBorrowInstrumentModalOpen, isBorrowToolModalOpen, setIsAnyBorrowModalOpen]);

    const handleBookingSuccess = (details: BookingResult) => {
        setIsBookCubicleModalOpen(false);
        setIsBorrowInstrumentModalOpen(false);
        setIsBorrowToolModalOpen(false);
        setBookingDetails(details);
        setIsSuccessModalOpen(true);
        setShowFABMenu(false);
    };

    const handleBookingFailure = (details: BookingFailureResult) => {
        setIsBookCubicleModalOpen(false);
        setIsBorrowInstrumentModalOpen(false);
        setIsBorrowToolModalOpen(false);
        setFailureDetails(details);
        setIsFailureModalOpen(true);
        setShowFABMenu(false);
    };

    return (
        <AppLayout>
            <Head title="Student Assistant Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {auth.user.name}! 👋</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Student Assistant Portal - Quick access to your daily tasks</p>
                    </div>

                    {/* Statistics Summary Cards */}
                    <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                        {/* Today's Bookings */}
                        <Card className="border-0 bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg">
                            <CardContent className="px-4 pt-4 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-0.5 text-sm font-medium text-white/80">Today's Bookings</p>
                                        <h3 className="text-4xl leading-tight font-bold">{stats.todayBookings}</h3>
                                        <p className="text-sm text-white/90">Active Today</p>
                                    </div>
                                    <div className="ml-2 rounded-full bg-white/20 p-2">
                                        <CalendarDays className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Approvals */}
                        <Card className="border-0 bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg">
                            <CardContent className="px-4 pt-4 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-0.5 text-sm font-medium text-white/80">Pending Approvals</p>
                                        <h3 className="text-4xl leading-tight font-bold">{stats.pendingApprovals}</h3>
                                        <p className="text-sm text-white/90">Needs Action</p>
                                    </div>
                                    <div className="ml-2 rounded-full bg-white/20 p-2">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Instruments */}
                        <Card className="border-0 bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-lg">
                            <CardContent className="px-4 pt-4 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-0.5 text-sm font-medium text-white/80">Available Instruments</p>
                                        <h3 className="text-4xl leading-tight font-bold">{stats.availableInstruments}</h3>
                                        <p className="text-sm text-white/90">Ready to Book</p>
                                    </div>
                                    <div className="ml-2 rounded-full bg-white/20 p-2">
                                        <Music className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Tools */}
                        <Card className="border-0 bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg">
                            <CardContent className="px-4 pt-4 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-0.5 text-sm font-medium text-white/80">Available Tools</p>
                                        <h3 className="text-4xl leading-tight font-bold">{stats.availableTools}</h3>
                                        <p className="text-sm text-white/90">In Stock</p>
                                    </div>
                                    <div className="ml-2 rounded-full bg-white/20 p-2">
                                        <Wrench className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Cubicles */}
                        <Card className="border-0 bg-gradient-to-br from-pink-400 to-pink-500 text-white shadow-lg">
                            <CardContent className="px-4 pt-4 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-0.5 text-sm font-medium text-white/80">Available Cubicles</p>
                                        <h3 className="text-4xl leading-tight font-bold">{stats.availableCubicles}</h3>
                                        <p className="text-sm text-white/90">Open Now</p>
                                    </div>
                                    <div className="ml-2 rounded-full bg-white/20 p-2">
                                        <DoorOpen className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cecilia Hall Pending Bookings Notification */}
                    {ceciliaHallBookings.length > 0 && (
                        <Card className="mb-8 border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                    <Bell className="h-5 w-5" />
                                    Recent Cecilia Hall Bookings
                                </CardTitle>
                                <CardDescription>Recent booking requests that may need attention</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {ceciliaHallBookings.slice(0, 5).map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-lg dark:bg-gray-800 dark:hover:border-pink-700"
                                            onClick={() => {
                                                // Sanitize booking ID before navigation
                                                const sanitizedId = encodeURIComponent(String(booking.id));
                                                router.visit(`/cecilia-hall?bookingId=${sanitizedId}`);
                                            }}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 flex flex-wrap items-start gap-2">
                                                    <span className="line-clamp-1 min-w-0 flex-shrink font-semibold text-gray-900 dark:text-white">
                                                        {booking.name}
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            className={
                                                                booking.status === 'pending'
                                                                    ? 'bg-yellow-500'
                                                                    : booking.status === 'approved'
                                                                      ? 'bg-green-500'
                                                                      : booking.status === 'completed'
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-red-500'
                                                            }
                                                        >
                                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {booking.booker_type === 'external' ? '🏢 External' : '🎵 Music Dept'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {booking.date} • {booking.time}
                                                </p>
                                                <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-500">{booking.purpose}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-center">
                                    <Link href="/cecilia-hall">
                                        <Button className="bg-pink-500 hover:bg-pink-600">
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            View All Cecilia Hall Bookings
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Information Cards Row */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Quick Tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Quick Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 text-blue-500">•</span>
                                        <span>
                                            Use the <strong>Student Information</strong> page to quickly look up student details
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 text-purple-500">•</span>
                                        <span>
                                            Check <strong>Inventory</strong> to see what instruments and tools are available
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 text-pink-500">•</span>
                                        <span>
                                            View and book <strong>Cecilia Hall</strong> for events (pending Dean approval)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-1 text-green-500">•</span>
                                        <span>
                                            You have <strong>view-only</strong> access - contact admin for changes
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Your Role */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-purple-500" />
                                    Your Role
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">What you can do:</h4>
                                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                            <li className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span>
                                                View student information
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span>
                                                Browse inventory items
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-green-500">✓</span>
                                                View and book Cecilia Hall
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Need help?</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Contact the Music Dean or Administrator for assistance with modifications or special requests.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed right-8 bottom-8 z-50">
                {/* Popup Menu */}
                {showFABMenu && (
                    <div className="absolute right-0 bottom-16 mb-2 flex flex-col gap-2">
                        <Button
                            variant="default"
                            className="flex w-full min-w-[180px] items-center justify-start shadow-lg"
                            onClick={() => {
                                setIsBookCubicleModalOpen(true);
                                setShowFABMenu(false);
                            }}
                        >
                            <DoorOpen className="mr-2 h-4 w-4" />
                            Book Cubicle
                        </Button>
                        <Button
                            variant="default"
                            className="flex w-full min-w-[180px] items-center justify-start shadow-lg"
                            onClick={() => {
                                setIsBorrowInstrumentModalOpen(true);
                                setShowFABMenu(false);
                            }}
                        >
                            <Music className="mr-2 h-4 w-4" />
                            Borrow Instrument
                        </Button>
                        <Button
                            variant="default"
                            className="flex w-full min-w-[180px] items-center justify-start shadow-lg"
                            onClick={() => {
                                setIsBorrowToolModalOpen(true);
                                setShowFABMenu(false);
                            }}
                        >
                            <Wrench className="mr-2 h-4 w-4" />
                            Borrow Tools
                        </Button>
                    </div>
                )}

                {/* Main FAB Button */}
                <Button
                    size="lg"
                    className={`h-14 w-14 rounded-full shadow-lg transition-transform ${showFABMenu ? 'rotate-45' : ''}`}
                    onClick={() => setShowFABMenu(!showFABMenu)}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Book Cubicle Modal */}
            <BookCubicleModal
                isOpen={isBookCubicleModalOpen}
                onClose={() => setIsBookCubicleModalOpen(false)}
                onBookingSuccess={handleBookingSuccess}
                onBookingFailure={handleBookingFailure}
            />

            {/* Borrow Instrument Modal */}
            <BorrowInstrumentModal
                isOpen={isBorrowInstrumentModalOpen}
                onClose={() => setIsBorrowInstrumentModalOpen(false)}
                onBookingSuccess={handleBookingSuccess}
                onBookingFailure={handleBookingFailure}
            />

            {/* Borrow Tool Modal */}
            <BorrowToolModal
                isOpen={isBorrowToolModalOpen}
                onClose={() => setIsBorrowToolModalOpen(false)}
                onBookingSuccess={handleBookingSuccess}
                onBookingFailure={handleBookingFailure}
            />

            {/* Success Modal */}
            {bookingDetails && (
                <SuccessModal
                    isOpen={isSuccessModalOpen}
                    onClose={() => {
                        setIsSuccessModalOpen(false);
                        setBookingDetails(null);
                    }}
                    bookingDetails={bookingDetails}
                />
            )}

            {/* Failure Modal */}
            {failureDetails && (
                <FailureModal
                    isOpen={isFailureModalOpen}
                    onClose={() => {
                        setIsFailureModalOpen(false);
                        setFailureDetails(null);
                    }}
                    errorMessage={failureDetails.errorMessage}
                    studentDetails={failureDetails.studentDetails}
                />
            )}

            {/* Login Success Modal */}
            <LoginSuccessModal isOpen={showLoginSuccess} onClose={() => setShowLoginSuccess(false)} onConfirm={() => setShowLoginSuccess(false)} />
        </AppLayout>
    );
}
