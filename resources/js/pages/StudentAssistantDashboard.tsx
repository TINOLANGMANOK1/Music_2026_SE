import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BookCubicleModal from '@/components/BookCubicleModal';
import BorrowInstrumentModal from '@/components/BorrowInstrumentModal';
import BorrowToolModal from '@/components/BorrowToolModal';
import SuccessModal from '@/components/SuccessModal';
import FailureModal from '@/components/FailureModal';
import LoginSuccessModal from '@/components/LoginSuccessModal';
import { useModalContext } from '@/contexts/ModalContext';
import { 
    CalendarDays,
    Clock,
    Bell,
    Music,
    Wrench,
    DoorOpen,
    Plus,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

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
    recentActivity = [], 
    ceciliaHallBookings = [], 
    pendingCount = 0,
    stats = {
        todayBookings: 0,
        pendingApprovals: 0,
        availableInstruments: 0,
        availableTools: 0,
        availableCubicles: 0,
    },
    loginSuccess = false
}: DashboardProps) {
    const [showFABMenu, setShowFABMenu] = useState(false);
    const [showLoginSuccess, setShowLoginSuccess] = useState(false);
    
    // Modal states
    const [isBookCubicleModalOpen, setIsBookCubicleModalOpen] = useState(false);
    const [isBorrowInstrumentModalOpen, setIsBorrowInstrumentModalOpen] = useState(false);
    const [isBorrowToolModalOpen, setIsBorrowToolModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<unknown | null>(null);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [failureDetails, setFailureDetails] = useState<unknown | null>(null);

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

    const handleBookingSuccess = (details: unknown) => {
        setIsBookCubicleModalOpen(false);
        setIsBorrowInstrumentModalOpen(false);
        setIsBorrowToolModalOpen(false);
        setBookingDetails(details);
        setIsSuccessModalOpen(true);
        setShowFABMenu(false);
    };

    const handleBookingFailure = (details: unknown) => {
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome back, {auth.user.name}! 👋
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Student Assistant Portal - Quick access to your daily tasks
                        </p>
                    </div>

                    {/* Statistics Summary Cards */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 mb-6">
                        {/* Today's Bookings */}
                        <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-lg">
                            <CardContent className="pt-4 pb-3 px-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium mb-0.5">Today's Bookings</p>
                                        <h3 className="text-4xl font-bold leading-tight">{stats.todayBookings}</h3>
                                        <p className="text-sm text-white/90">Active Today</p>
                                    </div>
                                    <div className="bg-white/20 rounded-full p-2 ml-2">
                                        <CalendarDays className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Approvals */}
                        <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0 shadow-lg">
                            <CardContent className="pt-4 pb-3 px-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium mb-0.5">Pending Approvals</p>
                                        <h3 className="text-4xl font-bold leading-tight">{stats.pendingApprovals}</h3>
                                        <p className="text-sm text-white/90">Needs Action</p>
                                    </div>
                                    <div className="bg-white/20 rounded-full p-2 ml-2">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Instruments */}
                        <Card className="bg-gradient-to-br from-purple-400 to-purple-500 text-white border-0 shadow-lg">
                            <CardContent className="pt-4 pb-3 px-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium mb-0.5">Available Instruments</p>
                                        <h3 className="text-4xl font-bold leading-tight">{stats.availableInstruments}</h3>
                                        <p className="text-sm text-white/90">Ready to Book</p>
                                    </div>
                                    <div className="bg-white/20 rounded-full p-2 ml-2">
                                        <Music className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Tools */}
                        <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white border-0 shadow-lg">
                            <CardContent className="pt-4 pb-3 px-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium mb-0.5">Available Tools</p>
                                        <h3 className="text-4xl font-bold leading-tight">{stats.availableTools}</h3>
                                        <p className="text-sm text-white/90">In Stock</p>
                                    </div>
                                    <div className="bg-white/20 rounded-full p-2 ml-2">
                                        <Wrench className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Cubicles */}
                        <Card className="bg-gradient-to-br from-pink-400 to-pink-500 text-white border-0 shadow-lg">
                            <CardContent className="pt-4 pb-3 px-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium mb-0.5">Available Cubicles</p>
                                        <h3 className="text-4xl font-bold leading-tight">{stats.availableCubicles}</h3>
                                        <p className="text-sm text-white/90">Open Now</p>
                                    </div>
                                    <div className="bg-white/20 rounded-full p-2 ml-2">
                                        <DoorOpen className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cecilia Hall Pending Bookings Notification */}
                    {ceciliaHallBookings.length > 0 && (
                        <Card className="mb-8 border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                    <Bell className="h-5 w-5" />
                                    Recent Cecilia Hall Bookings
                                </CardTitle>
                                <CardDescription>
                                    Recent booking requests that may need attention
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {ceciliaHallBookings.slice(0, 5).map((booking) => (
                                        <div 
                                            key={booking.id}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-pink-300 dark:hover:border-pink-700"
                                            onClick={() => {
                                                // Sanitize booking ID before navigation
                                                const sanitizedId = encodeURIComponent(String(booking.id));
                                                router.visit(`/cecilia-hall?bookingId=${sanitizedId}`);
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2 mb-2 flex-wrap">
                                                    <span className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex-shrink min-w-0">
                                                        {booking.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 flex-wrap">
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
                                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
                                                    {booking.purpose}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-center">
                                    <Link href="/cecilia-hall">
                                        <Button className="bg-pink-500 hover:bg-pink-600">
                                            <CalendarDays className="h-4 w-4 mr-2" />
                                            View All Cecilia Hall Bookings
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Information Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>Use the <strong>Student Information</strong> page to quickly look up student details</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-1">•</span>
                                        <span>Check <strong>Inventory</strong> to see what instruments and tools are available</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-pink-500 mt-1">•</span>
                                        <span>View and book <strong>Cecilia Hall</strong> for events (pending Dean approval)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-1">•</span>
                                        <span>You have <strong>view-only</strong> access - contact admin for changes</span>
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
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            What you can do:
                                        </h4>
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
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            Need help?
                                        </h4>
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
            <div className="fixed bottom-8 right-8 z-50">
                {/* Popup Menu */}
                {showFABMenu && (
                    <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
                        <Button
                            variant="default"
                            className="shadow-lg flex items-center justify-start w-full min-w-[180px]"
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
                            className="shadow-lg flex items-center justify-start w-full min-w-[180px]"
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
                            className="shadow-lg flex items-center justify-start w-full min-w-[180px]"
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
                    className={`rounded-full h-14 w-14 shadow-lg transition-transform ${showFABMenu ? 'rotate-45' : ''}`}
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
                    bookingDetails={bookingDetails as any}
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
                    errorMessage={(failureDetails as any)?.errorMessage}
                    studentDetails={(failureDetails as any)?.studentDetails}
                />
            )}

            {/* Login Success Modal */}
            <LoginSuccessModal
                isOpen={showLoginSuccess}
                onClose={() => setShowLoginSuccess(false)}
                onConfirm={() => setShowLoginSuccess(false)}
            />
        </AppLayout>
    );
}
