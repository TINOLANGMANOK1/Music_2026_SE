import { useState, useMemo, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookingModal } from '@/components/cecilia-hall/booking-modal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    CalendarDays,
    Clock,
    User,
    X,
    BarChart3,
    ChevronDown,
    Trash2,
    Info,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, startOfDay, addMinutes, isWithinInterval, endOfDay, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, getDay, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlot {
    id: string;
    start: Date;
    end: Date;
    studentName?: string;
    studentId?: string;
    email?: string;
    date?: string;
    time?: string;
    purpose?: string;
    bookerType?: 'music_department' | 'external';
    letterUrl?: string;
    status: 'available' | 'booked' | 'pending' | 'completed' | 'cancelled';
    cancellationReason?: string;
}

interface CeciliaHallProps {
    bookings?: any[];
    rejectedBookings?: any[];
    auth?: {
        user?: {
            role?: string;
        };
    };
}

export default function CeciliaHall({ bookings = [], rejectedBookings = [], auth }: CeciliaHallProps) {
    const isMusicDean = auth?.user?.role === 'Music Dean';
    const canManageBookings = auth?.user?.role === 'Music Dean' || auth?.user?.role === 'Administrator';
    const canCreateBooking = auth?.user?.role === 'Music Dean' || auth?.user?.role === 'Administrator' || auth?.user?.role === 'Student Assistant';
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
    );
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showDayDetailModal, setShowDayDetailModal] = useState(false);
    const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null);
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<TimeSlot | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingSlotDate, setBookingSlotDate] = useState<Date | undefined>(undefined);
    const [bookingSlotTime, setBookingSlotTime] = useState<string | undefined>(undefined);
    
    // Approval/Rejection states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteCancelledModal, setShowDeleteCancelledModal] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showRejectedModal, setShowRejectedModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectedWeekStart, setRejectedWeekStart] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPendingDetailsModal, setShowPendingDetailsModal] = useState(false);
    const [selectedPendingBooking, setSelectedPendingBooking] = useState<TimeSlot | null>(null);

    // Mock data for demonstration - will be replaced with real data from backend
    const [mockBookings, setMockBookings] = useState<TimeSlot[]>([]);
    const [activeTab, setActiveTab] = useState<'calendar' | 'pending'>('calendar');
    
    // Ref to track if we've already processed the URL parameter
    const hasProcessedUrlParam = useRef(false);

    // Handle URL parameters to open specific booking
    useEffect(() => {
        // Prevent multiple executions
        if (hasProcessedUrlParam.current) {
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('bookingId');
        
        // Validate booking ID and ensure bookings are loaded
        if (!bookingId || mockBookings.length === 0) {
            return;
        }
        
        // Mark as processed
        hasProcessedUrlParam.current = true;
        
        // Sanitize: ensure bookingId is alphanumeric (for string IDs) or numeric
        if (!/^[a-zA-Z0-9-_]+$/.test(bookingId)) {
            console.error('Invalid booking ID format');
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }
        
        // Find the booking
        const booking = mockBookings.find(b => b.id === bookingId);
        if (booking) {
            // Use the start Date object from the booking
            const date = booking.start;
            setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
            setSelectedDate(date);
            
            // Open the booking detail modal
            setSelectedBooking(booking);
            setShowBookingDetailModal(true);
        }
        
        // Clear the URL parameters (whether booking found or not)
        window.history.replaceState({}, '', window.location.pathname);
    }, [mockBookings]);

    // Convert bookings from backend to TimeSlot format
    useEffect(() => {
        if (bookings && bookings.length > 0) {
            const converted = bookings.map(booking => {
                const dateParts = booking.date.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1;
                const day = parseInt(dateParts[2]);
                
                const startTimeParts = booking.start_time.split(':');
                const startHour = parseInt(startTimeParts[0]);
                const startMinute = parseInt(startTimeParts[1]);
                
                const endTimeParts = booking.end_time.split(':');
                const endHour = parseInt(endTimeParts[0]);
                const endMinute = parseInt(endTimeParts[1]);

                const startDate = new Date(year, month, day, startHour, startMinute);
                const endDate = new Date(year, month, day, endHour, endMinute);
                
                // Determine status based on backend status and whether booking is past
                const now = new Date();
                const isPast = endDate < now;
                let status: 'booked' | 'pending' | 'completed' | 'cancelled';
                
                if (booking.status === 'cancelled') {
                    status = 'cancelled';
                } else if (isPast && booking.status === 'approved') {
                    status = 'completed';
                } else if (booking.status === 'approved') {
                    status = 'booked';
                } else {
                    status = 'pending';
                }
                
                return {
                    id: booking.id.toString(),
                    start: startDate,
                    end: endDate,
                    studentName: booking.name,
                    studentId: booking.email,
                    email: booking.email,
                    date: booking.date,
                    time: `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`,
                    purpose: booking.purpose,
                    bookerType: booking.booker_type,
                    letterUrl: booking.letter_url,
                    status: status,
                    cancellationReason: booking.cancellation_reason,
                };
            });
            setMockBookings(converted);
        }
    }, [bookings]);

    // Generate time slots for the day (6 AM - 12 AM in 30-minute intervals)
    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 6;  // 6:00 AM
        const endHour = 24;   // 12:00 AM next day
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Convert to 12-hour format with AM/PM
                const period = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                const time = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
                slots.push(time);
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    // Get days for the current week view
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    // Navigate weeks
    const goToPreviousWeek = () => {
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    // Handle date selection from calendar picker
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
            setCurrentMonth(date);
        }
    };

    // Get bookings for the current week
    const weekBookings = useMemo(() => {
        const weekStart = startOfDay(currentWeekStart);
        const weekEnd = endOfDay(addDays(currentWeekStart, 6));
        
        return mockBookings.filter(booking => {
            const bookingDate = startOfDay(booking.start);
            // Only show booked and completed bookings, exclude pending
            return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd }) && 
                   (booking.status === 'booked' || booking.status === 'completed');
        });
    }, [mockBookings, currentWeekStart]);

    // Get bookings for the selected day
    const dayBookings = useMemo(() => {
        if (!selectedDate) return [];
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);
        
        return mockBookings.filter(booking => {
            const bookingDate = startOfDay(booking.start);
            // Only show booked and completed bookings, exclude pending
            return isWithinInterval(bookingDate, { start: dayStart, end: dayEnd }) && 
                   (booking.status === 'booked' || booking.status === 'completed');
        });
    }, [mockBookings, selectedDate]);

    // Get bookings for the current month
    const monthBookings = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        
        return mockBookings.filter(booking => {
            const bookingDate = startOfDay(booking.start);
            // Only show booked and completed bookings, exclude pending
            return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd }) && 
                   (booking.status === 'booked' || booking.status === 'completed');
        });
    }, [mockBookings, currentMonth]);

    // Current bookings based on view mode
    const currentBookings = viewMode === 'week' ? weekBookings : viewMode === 'day' ? dayBookings : monthBookings;

    const currentPendingBookings = useMemo(() => {
        const bookingsInView = viewMode === 'week'
            ? mockBookings.filter(booking => isWithinInterval(startOfDay(booking.start), {
                start: startOfDay(currentWeekStart),
                end: endOfDay(addDays(currentWeekStart, 6)),
            }))
            : viewMode === 'day'
            ? mockBookings.filter(booking => isWithinInterval(startOfDay(booking.start), {
                start: startOfDay(selectedDate || new Date()),
                end: endOfDay(selectedDate || new Date()),
            }))
            : mockBookings.filter(booking => isWithinInterval(startOfDay(booking.start), {
                start: startOfMonth(currentMonth),
                end: endOfMonth(currentMonth),
            }));

        return bookingsInView.filter(booking => booking.status === 'pending');
    }, [mockBookings, viewMode, currentWeekStart, selectedDate, currentMonth]);

    // Navigate days (for day view)
    const goToPreviousDay = () => {
        if (selectedDate) {
            const newDate = addDays(selectedDate, -1);
            setSelectedDate(newDate);
            setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
        }
    };

    const goToNextDay = () => {
        if (selectedDate) {
            const newDate = addDays(selectedDate, 1);
            setSelectedDate(newDate);
            setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
        }
    };

    // Navigate months (for month view)
    const goToPreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    // Generate calendar days for month view
    const generateMonthDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        
        const days = [];
        let currentDate = startDate;
        
        while (currentDate <= endDate) {
            days.push(currentDate);
            currentDate = addDays(currentDate, 1);
        }
        
        return days;
    }, [currentMonth]);

    // Get bookings for a specific day in month view
    const getBookingsForDay = (day: Date) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        return mockBookings.filter(booking => {
            const bookingDate = startOfDay(booking.start);
            // Only show booked and completed bookings, exclude pending
            return isWithinInterval(bookingDate, { start: dayStart, end: dayEnd }) && 
                   (booking.status === 'booked' || booking.status === 'completed');
        });
    };

    // Check if booking is in the past
    const isBookingPast = (booking: TimeSlot) => {
        return booking.end.getTime() < new Date().getTime();
    };

    // Handle day click in month view
    const handleDayClick = (day: Date) => {
        const dayBookings = getBookingsForDay(day);
        if (dayBookings.length > 0) {
            setSelectedDayForModal(day);
            setShowDayDetailModal(true);
        } else {
            // If no bookings, switch to day view to create one
            setSelectedDate(day);
            setViewMode('day');
        }
    };

    // Check if a time slot has a booking
    const getBookingForSlot = (day: Date, timeSlot: string) => {
        // Parse 12-hour format time (e.g., "8:00 AM" or "1:30 PM")
        const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return undefined;
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        const slotStart = new Date(day);
        slotStart.setHours(hours, minutes, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);
        
        const bookingsToCheck = viewMode === 'week' ? weekBookings : dayBookings;
        
        return bookingsToCheck.find(booking => {
            const bookingDay = startOfDay(booking.start);
            const slotDay = startOfDay(day);
            
            // Booking is in this slot if:
            // 1. Same day
            // 2. Either: booking starts in this slot OR booking is ongoing during this slot
            return (
                bookingDay.getTime() === slotDay.getTime() &&
                (
                    // Booking starts within this slot
                    (booking.start >= slotStart && booking.start < slotEnd) ||
                    // Or booking was already ongoing (started before this slot but ends after slot start)
                    (booking.start < slotStart && booking.end > slotStart)
                )
            );
        });
    };

    // Calculate booking span (how many 30-min slots it occupies)
    const getBookingSpan = (booking: TimeSlot) => {
        const durationMinutes = (booking.end.getTime() - booking.start.getTime()) / (1000 * 60);
        return Math.ceil(durationMinutes / 30);
    };

    // Check if this is the first slot of a booking
    const isFirstSlotOfBooking = (day: Date, timeSlot: string, booking: TimeSlot) => {
        const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return false;
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
        
        const slotStart = new Date(day);
        slotStart.setHours(hours, minutes, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);
        
        // Booking starts in this slot if booking start time is within this 30-min slot
        return booking.start >= slotStart && booking.start < slotEnd;
    };

    const handleSlotClick = (day: Date, timeSlot: string) => {
        const booking = getBookingForSlot(day, timeSlot);
        if (booking) {
            // Show booking detail modal
            setSelectedBooking(booking);
            setShowBookingDetailModal(true);
        } else {
            // Open booking modal
            setBookingSlotDate(day);
            setBookingSlotTime(timeSlot);
            setShowBookingModal(true);
        }
    };

    // Delete a cancelled booking directly
    const handleDeleteCancelledBooking = (bookingId: string) => {
        setBookingToDelete(bookingId);
        setShowDeleteCancelledModal(true);
    };

    const confirmDeleteCancelledBooking = async () => {
        if (!bookingToDelete) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`/cecilia-hall/bookings/${bookingToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an error. You may not have permission to delete this booking.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete booking');
            }
            
            setShowDeleteCancelledModal(false);
            setBookingToDelete(null);
            setSuccessMessage('Cancelled booking deleted successfully!');
            setShowSuccessModal(true);
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert(error instanceof Error ? error.message : 'An error occurred while deleting the booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete a booking
    const handleDeleteBooking = async (bookingId: string) => {
        if (!selectedBooking || deleteConfirmationText !== 'Delete Booking') return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`/cecilia-hall/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an error. You may not have permission to delete this booking.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete booking');
            }
            
            setShowDeleteModal(false);
            setShowBookingDetailModal(false);
            setDeleteConfirmationText('');
            setSuccessMessage('Booking deleted successfully!');
            setShowSuccessModal(true);
            
            // Reload after showing success modal
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete booking');
            setShowDeleteModal(false);
            setDeleteConfirmationText('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteBooking = (booking: TimeSlot) => {
        setSelectedBooking(booking);
        setDeleteConfirmationText('');
        setShowDeleteModal(true);
    };

    // Approve a booking
    const handleApproveBooking = async () => {
        if (!selectedBooking) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`/cecilia-hall/bookings/${selectedBooking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    status: 'approved',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve booking');
            }
            
            setShowApproveModal(false);
            setShowBookingDetailModal(false);
            setSuccessMessage('Booking approved successfully!');
            setShowSuccessModal(true);
            
            // Reload after showing success modal
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error approving booking:', error);
            alert(error instanceof Error ? error.message : 'Failed to approve booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Quick approve function for pending requests tab
    const handleApprove = async (booking: TimeSlot) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/cecilia-hall/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    status: 'approved',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve booking');
            }
            
            setSuccessMessage('Booking approved successfully!');
            setShowSuccessModal(true);
            
            // Reload after showing success modal
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error approving booking:', error);
            alert(error instanceof Error ? error.message : 'Failed to approve booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reject a booking
    const handleRejectBooking = async () => {
        if (!selectedBooking || !rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`/cecilia-hall/bookings/${selectedBooking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reject booking');
            }
            
            setShowRejectModal(false);
            setShowBookingDetailModal(false);
            setRejectionReason('');
            setSuccessMessage('Booking rejected successfully!');
            setShowSuccessModal(true);
            
            // Reload after showing success modal
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert(error instanceof Error ? error.message : 'Failed to reject booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get total bookings for current week
    const weekStats = useMemo(() => {
        return {
            total: currentBookings.length,
            booked: currentBookings.filter(b => b.status === 'booked').length,
            pending: currentPendingBookings.length,
        };
    }, [currentBookings, currentPendingBookings]);

    // Get all pending bookings across all dates (including cancelled)
    const allPendingBookings = useMemo(() => {
        return mockBookings.filter(b => b.status === 'pending' || b.status === 'cancelled');
    }, [mockBookings]);

    // Helper: format booking time range into 12-hour format using booking.date
    const formatBookingTime = (b: any) => {
        try {
            const base = parseISO(b.date);
            const startParts = (b.start_time || '').split(':').map((n: string) => parseInt(n, 10));
            const endParts = (b.end_time || '').split(':').map((n: string) => parseInt(n, 10));

            const s = new Date(base);
            s.setHours(startParts[0] || 0, startParts[1] || 0, startParts[2] || 0, 0);
            const e = new Date(base);
            e.setHours(endParts[0] || 0, endParts[1] || 0, endParts[2] || 0, 0);

            return `${format(s, 'h:mm a')} - ${format(e, 'h:mm a')}`;
        } catch (err) {
            return `${b.start_time || ''} - ${b.end_time || ''}`;
        }
    };

    // Rejected bookings filtered for the currently selected week in the modal
    const rejectedWeekFiltered = useMemo(() => {
        if (!rejectedBookings || rejectedBookings.length === 0) return [];
        const weekStart = startOfDay(rejectedWeekStart);
        const weekEnd = endOfDay(addDays(rejectedWeekStart, 6));
        return rejectedBookings.filter((b: any) => {
            try {
                const d = parseISO(b.date);
                return isWithinInterval(startOfDay(d), { start: weekStart, end: weekEnd });
            } catch (e) {
                return false;
            }
        });
    }, [rejectedBookings, rejectedWeekStart]);

    return (
        <AppLayout>
            <Head title="Cecilia Hall Booking" />
            <div className="p-4 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Cecilia Hall</h1>
                    <p className="text-muted-foreground">
                        Book the Cecilia Hall for your music practice sessions
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2',
                            activeTab === 'calendar'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <CalendarDays className="h-5 w-5" />
                        Calendar & Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2',
                            activeTab === 'pending'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Clock className="h-5 w-5" />
                        Pending Requests
                        {allPendingBookings.length > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                                {allPendingBookings.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Combined Stats moved into Calendar Controls to save space */}

                {/* CALENDAR & BOOKINGS TAB */}
                {activeTab === 'calendar' && (
                    <>
                        {/* Controls Card */}
                        <Card className="shadow-sm mb-6">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Calendar Controls
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Navigate through dates and manage your bookings
                        </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                {/* Controls */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Top Row: Navigation and Date Range */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button onClick={goToToday} variant="outline" className="h-9">
                                Today
                            </Button>
                            <div className="flex items-center gap-1">
                                <Button 
                                    onClick={
                                        viewMode === 'week' ? goToPreviousWeek : 
                                        viewMode === 'day' ? goToPreviousDay : 
                                        goToPreviousMonth
                                    } 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-9 w-9"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                    onClick={
                                        viewMode === 'week' ? goToNextWeek : 
                                        viewMode === 'day' ? goToNextDay : 
                                        goToNextMonth
                                    } 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-9 w-9"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">Date:</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            className="font-semibold justify-start text-left h-9 min-w-[240px]"
                                        >
                                            <CalendarDays className="h-4 w-4 mr-2" />
                                            {viewMode === 'week' 
                                                ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`
                                                : viewMode === 'day'
                                                ? selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select Date'
                                                : format(currentMonth, 'MMMM yyyy')
                                            }
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleDateSelect}
                                            components={{
                                                DayButton: ({ day, modifiers, ...props }) => {
                                                    const dayBookings = mockBookings.filter(booking => 
                                                        isSameDay(booking.start, day.date)
                                                    );
                                                    const hasBooked = dayBookings.some(b => b.status === 'booked');
                                                    const hasPending = dayBookings.some(b => b.status === 'pending');
                                                    const hasCompleted = dayBookings.some(b => b.status === 'completed');
                                                    
                                                    return (
                                                        <div className="relative">
                                                            <CalendarDayButton day={day} modifiers={modifiers} {...props} />
                                                            {dayBookings.length > 0 && (
                                                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                                    {hasBooked && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                                                                    {hasPending && <div className="w-1 h-1 rounded-full bg-yellow-500" />}
                                                                    {hasCompleted && <div className="w-1 h-1 rounded-full bg-gray-400" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* View Mode Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">View:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-9 min-w-[100px]">
                                        {viewMode === 'week' ? 'Week' : viewMode === 'day' ? 'Day' : 'Month'}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setViewMode('day')}>
                                        Day
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setViewMode('week')}>
                                        Week
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setViewMode('month')}>
                                        Month
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                        {/* Bottom Row: Legend, Stats, and New Booking Button (combined) */}
                    <div className="flex items-center justify-between">
                        {/* Legend */}
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                <span className="font-medium text-blue-700 dark:text-blue-300">Booked</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                                <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">Completed</span>
                            </div>
                        </div>

                        {/* Stats and New Booking Button */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{weekStats.total}</div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                </div>
                                <div className="h-8 w-px bg-border"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{weekStats.booked}</div>
                                    <div className="text-xs text-muted-foreground">Confirmed</div>
                                </div>
                                <div className="h-8 w-px bg-border"></div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{weekStats.pending}</div>
                                    <div className="text-xs text-muted-foreground">Pending</div>
                                </div>
                            </div>

                            {canCreateBooking && (
                                <Button 
                                    variant="default" 
                                    className="h-9"
                                    onClick={() => setShowBookingModal(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Booking
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                    </CardContent>
                </Card>

                {/* Month View Calendar Grid */}
                {viewMode === 'month' ? (
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            {/* Month Grid */}
                            <div className="grid grid-cols-7">
                                {/* Weekday Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div
                                        key={day}
                                        className="p-3 text-center border-b bg-muted/50 text-sm font-medium"
                                    >
                                        {day}
                                    </div>
                                ))}
                                
                                {/* Calendar Days */}
                                {generateMonthDays.map((day, idx) => {
                                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                    const isToday = isSameDay(day, new Date());
                                    const dayBookings = getBookingsForDay(day);
                                    const displayedBookings = dayBookings.slice(0, 3);
                                    const remainingCount = dayBookings.length - 3;
                                    
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "min-h-[120px] p-2 border-b border-r",
                                                !isCurrentMonth && "bg-muted/20",
                                                isToday && "bg-primary/5",
                                                "hover:bg-muted/40 cursor-pointer transition-colors"
                                            )}
                                            onClick={() => {
                                                handleDayClick(day);
                                            }}
                                        >
                                            <div className={cn(
                                                "text-sm font-medium mb-1",
                                                !isCurrentMonth && "text-muted-foreground",
                                                isToday && "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
                                            )}>
                                                {format(day, 'd')}
                                            </div>
                                            
                                            {/* Bookings for this day */}
                                            <div className="space-y-1">
                                                {displayedBookings.map((booking, bookingIdx) => (
                                                    <div
                                                        key={bookingIdx}
                                                        className={cn(
                                                            "text-xs px-1.5 py-0.5 rounded truncate",
                                                            booking.status === 'completed' && "bg-gray-400 text-white",
                                                            booking.status === 'booked' && "bg-blue-500 text-white",
                                                            booking.status === 'pending' && "bg-yellow-500 text-white"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDayClick(day);
                                                        }}
                                                    >
                                                        {format(booking.start, 'h:mm a')} {booking.studentName}
                                                    </div>
                                                ))}
                                                {remainingCount > 0 && (
                                                    <div 
                                                        className="text-xs text-muted-foreground px-1.5 hover:underline cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDayClick(day);
                                                        }}
                                                    >
                                                        +{remainingCount} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Week/Day Calendar Grid */
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <div className={cn("overflow-x-auto", viewMode === 'week' ? "min-w-[900px]" : "min-w-[600px]")}>
                                {/* Header Row - Days */}
                                <div className={cn("border-b bg-muted/50 sticky top-0 z-10", viewMode === 'week' ? "flex" : "flex")}>
                                    {viewMode === 'week' ? (
                                        <>
                                            <div className="w-20 flex-shrink-0 border-r text-sm font-medium bg-muted/50 flex items-center justify-end pr-2 py-2">
                                                Time
                                            </div>
                                            <div className="flex-1 grid grid-cols-7">
                                                {weekDays.map((day, idx) => {
                                                    const isToday = isSameDay(day, new Date());
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                "py-2 text-center border-r last:border-r-0 flex flex-col items-center justify-center",
                                                                isToday ? "bg-primary/10" : "bg-muted/50"
                                                            )}
                                                        >
                                                            <div className="text-xs text-muted-foreground">
                                                                {format(day, 'EEE')}
                                                            </div>
                                                            <div className={cn(
                                                                "text-lg font-semibold",
                                                                isToday && "text-primary"
                                                            )}>
                                                                {format(day, 'd')}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        selectedDate && (
                                            <>
                                                <div className="w-20 flex-shrink-0 border-r text-sm font-medium bg-muted/50 flex items-center justify-end pr-2 py-2">
                                                    Time
                                                </div>
                                                <div className={cn(
                                                    "flex-1 py-2 text-center flex flex-col items-center justify-center",
                                                    isSameDay(selectedDate, new Date()) ? "bg-primary/10" : "bg-muted/50"
                                                )}>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(selectedDate, 'EEEE')}
                                                    </div>
                                                    <div className={cn(
                                                        "text-lg font-semibold",
                                                        isSameDay(selectedDate, new Date()) && "text-primary"
                                                    )}>
                                                        {format(selectedDate, 'MMMM d, yyyy')}
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    )}
                                </div>

                                {/* Time Slots Grid */}
                                <div className="relative max-h-[600px] overflow-y-auto">
                                    {timeSlots.map((timeSlot, timeIdx) => (
                                        <div
                                            key={timeIdx}
                                            className={cn(
                                                "border-b last:border-b-0 hover:bg-muted/30 flex"
                                            )}
                                        >
                                            {/* Time Label */}
                                            <div className={cn(
                                                "border-r text-xs text-muted-foreground flex items-center justify-end pr-2 w-20 flex-shrink-0 py-2"
                                            )}>
                                                {timeSlot}
                                            </div>

                                            {/* Day Cells */}
                                            {viewMode === 'week' ? (
                                                <div className="flex-1 grid grid-cols-7">
                                                    {weekDays.map((day, dayIdx) => {
                                                        const booking = getBookingForSlot(day, timeSlot);
                                                        const isFirstSlot = booking ? isFirstSlotOfBooking(day, timeSlot, booking) : false;
                                                        const bookingSpan = booking ? getBookingSpan(booking) : 0;

                                                        return (
                                                            <div
                                                                key={dayIdx}
                                                                className={cn(
                                                                    "border-r last:border-r-0 p-1 min-h-[40px] cursor-pointer transition-colors relative",
                                                                    !booking && "hover:bg-green-50 dark:hover:bg-green-950/20"
                                                                )}
                                                                onClick={() => handleSlotClick(day, timeSlot)}
                                                            >
                                                                {booking && isFirstSlot && (
                                                                    <div
                                                                        className={cn(
                                                                        "absolute inset-x-1 rounded-md p-2 text-white text-xs overflow-hidden shadow-sm group",
                                                                        booking.status === 'completed' && "bg-gray-400 hover:bg-gray-500",
                                                                        booking.status === 'booked' && "bg-blue-500 hover:bg-blue-600",
                                                                        booking.status === 'pending' && "bg-yellow-500 hover:bg-yellow-600"
                                                                    )}
                                                                    style={{
                                                                        height: `${bookingSpan * 40 - 8}px`,
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-semibold truncate">
                                                                                {booking.studentName}
                                                                            </div>
                                                                            <div className="text-xs opacity-90">
                                                                                {format(booking.start, 'h:mm a')} - {format(booking.end, 'h:mm a')}
                                                                            </div>
                                                                        </div>
                                                                        {canManageBookings && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    confirmDeleteBooking(booking);
                                                                                }}
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-white/20 rounded p-0.5"
                                                                                title="Delete booking"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                </div>
                                            ) : (
                                                selectedDate && (() => {
                                                    const booking = getBookingForSlot(selectedDate, timeSlot);
                                                    const isFirstSlot = booking ? isFirstSlotOfBooking(selectedDate, timeSlot, booking) : false;
                                                    const bookingSpan = booking ? getBookingSpan(booking) : 0;

                                                    return (
                                                        <div
                                                            className={cn(
                                                                "flex-1 p-3 min-h-[60px] cursor-pointer transition-colors relative",
                                                                !booking && "hover:bg-green-50 dark:hover:bg-green-950/20"
                                                            )}
                                                            onClick={() => handleSlotClick(selectedDate, timeSlot)}
                                                        >
                                                            {booking && isFirstSlot && (
                                                                <div
                                                                    className={cn(
                                                                        "absolute inset-x-3 inset-y-2 rounded-lg p-3 text-white text-sm overflow-hidden shadow-md group",
                                                                        booking.status === 'completed' && "bg-gray-400 hover:bg-gray-500",
                                                                        booking.status === 'booked' && "bg-blue-500 hover:bg-blue-600",
                                                                        booking.status === 'pending' && "bg-yellow-500 hover:bg-yellow-600"
                                                                    )}
                                                                    style={{
                                                                        height: `${bookingSpan * 60 - 16}px`,
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-start h-full">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-bold text-base mb-1">
                                                                                {booking.studentName}
                                                                            </div>
                                                                            <div className="text-sm opacity-90 mb-1">
                                                                                ID: {booking.studentId}
                                                                            </div>
                                                                            <div className="text-sm opacity-90">
                                                                                {format(booking.start, 'h:mm a')} - {format(booking.end, 'h:mm a')}
                                                                            </div>
                                                                            <div className="mt-2 text-xs uppercase tracking-wide">
                                                                                {booking.status}
                                                                            </div>
                                                                        </div>
                                                                        {canManageBookings && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    confirmDeleteBooking(booking);
                                                                                }}
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-white/20 rounded p-1"
                                                                                title="Delete booking"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                )}
                    </>
                )}

                {/* PENDING REQUESTS TAB */}
                {activeTab === 'pending' && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                                Pending Booking Requests ({allPendingBookings.length})
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Review and manage pending booking requests
                            </p>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {allPendingBookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                                    <p className="text-sm text-muted-foreground">All booking requests have been processed.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {allPendingBookings.map((booking, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "p-4 border rounded-lg transition-colors",
                                                booking.status === 'cancelled'
                                                    ? "border-red-200 bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/10 dark:border-red-800 dark:hover:bg-red-900/20"
                                                    : "border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 cursor-pointer dark:border-orange-800 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
                                            )}
                                            onClick={() => {
                                                if (booking.status !== 'cancelled') {
                                                    setSelectedPendingBooking(booking);
                                                    setShowPendingDetailsModal(true);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-foreground">
                                                            {booking.studentName}
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                                                booking.bookerType === 'external' 
                                                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
                                                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                                                            )}>
                                                                {booking.bookerType === 'external' ? 'External' : 'Internal'}
                                                            </span>
                                                            {booking.status === 'cancelled' && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                                                                    Cancelled
                                                                </span>
                                                            )}
                                                            {booking.status === 'pending' && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700">
                                                                    Pending Approval
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="h-4 w-4" />
                                                            {format(booking.start, 'EEEE, MMMM d, yyyy')}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {format(booking.start, 'h:mm a')} - {format(booking.end, 'h:mm a')}
                                                        </div>
                                                        <div className="text-xs">
                                                            ({Math.floor((booking.end.getTime() - booking.start.getTime()) / (1000 * 60 * 60))}h {Math.round(((booking.end.getTime() - booking.start.getTime()) / (1000 * 60)) % 60)}m)
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                                        <User className="h-4 w-4" />
                                                        {booking.email}
                                                    </div>
                                                    {booking.purpose && (
                                                        <div className="mt-3 p-3 bg-background rounded border">
                                                            <p className="text-sm">
                                                                <span className="font-medium">Purpose:</span> {booking.purpose}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {booking.letterUrl && (
                                                        <div className="mt-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(booking.letterUrl, '_blank');
                                                                }}
                                                            >
                                                                📄 View Letter
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {booking.status === 'cancelled' && booking.cancellationReason && (
                                                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 rounded border border-red-200">
                                                            <p className="text-sm text-red-800 dark:text-red-200">
                                                                <span className="font-medium">Cancellation Reason:</span> {booking.cancellationReason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    {booking.status === 'cancelled' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-500 text-red-500 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCancelledBooking(booking.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApprove(booking);
                                                                }}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedBooking(booking);
                                                                    setShowRejectModal(true);
                                                                }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Pending Booking Details Modal */}
                <Dialog open={showPendingDetailsModal} onOpenChange={setShowPendingDetailsModal}>
                    <DialogContent className="max-w-md max-h-[90vh] flex flex-col gap-0 p-0">
                        <DialogHeader className="px-6 py-4 border-b">
                            <DialogTitle className="text-xl">Booking Details</DialogTitle>
                        </DialogHeader>
                        {selectedPendingBooking && (
                            <>
                                <div className="overflow-y-auto flex-1 px-6 py-4">
                                    <div className="space-y-5">
                                        {/* Student Name */}
                                        <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border border-primary/10">
                                            <p className="text-xs font-bold text-primary/70 uppercase tracking-wide mb-1">Student Name</p>
                                            <p className="text-base font-bold text-foreground">{selectedPendingBooking.studentName}</p>
                                        </div>

                                        {/* Booking Type Badge */}
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Booking Type</p>
                                            <span className={cn(
                                                "inline-block px-3 py-1.5 rounded-full text-sm font-semibold",
                                                selectedPendingBooking.bookerType === 'external' 
                                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                            )}>
                                                {selectedPendingBooking.bookerType === 'external' ? 'External Request' : 'Internal Request'}
                                            </span>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-muted/50 rounded-lg p-3 border">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                                                <p className="text-sm font-semibold text-foreground">{format(selectedPendingBooking.start, 'MMM dd, yyyy')}</p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-3 border">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Time</p>
                                                <p className="text-sm font-semibold text-foreground">{format(selectedPendingBooking.start, 'h:mm a')} - {format(selectedPendingBooking.end, 'h:mm a')}</p>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="bg-muted/50 rounded-lg p-3 border">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {Math.floor((selectedPendingBooking.end.getTime() - selectedPendingBooking.start.getTime()) / (1000 * 60 * 60))}h {Math.round(((selectedPendingBooking.end.getTime() - selectedPendingBooking.start.getTime()) / (1000 * 60)) % 60)}m
                                            </p>
                                        </div>

                                        {/* Purpose */}
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Purpose</p>
                                            <div className="bg-muted/50 rounded-lg p-3 border">
                                                <p className="text-sm break-words whitespace-pre-wrap max-h-[120px] overflow-y-auto text-foreground leading-relaxed">
                                                    {selectedPendingBooking.purpose || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Supporting Document */}
                                        {selectedPendingBooking.letterUrl && (
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Supporting Document</p>
                                                <Button
                                                    variant="outline"
                                                    className="w-full text-primary hover:bg-primary/10 border-primary/30 font-medium"
                                                    onClick={() => {
                                                        if (selectedPendingBooking.letterUrl) {
                                                            window.open(selectedPendingBooking.letterUrl, '_blank');
                                                        }
                                                    }}
                                                >
                                                    <span className="mr-2">📄</span>
                                                    View PDF Letter
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-10 rounded-lg"
                                        onClick={() => {
                                            setShowPendingDetailsModal(false);
                                            setSelectedBooking(selectedPendingBooking);
                                            setShowApproveModal(true);
                                        }}
                                    >
                                        ✓ Approve
                                    </Button>
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-10 rounded-lg"
                                        onClick={() => {
                                            setShowPendingDetailsModal(false);
                                            setSelectedBooking(selectedPendingBooking);
                                            setShowRejectModal(true);
                                        }}
                                    >
                                        ✕ Reject
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Rejected Bookings are now available via the 'Rejected Bookings' button in Calendar Controls */}

                {/* Day Detail Modal */}
                <Dialog open={showDayDetailModal} onOpenChange={setShowDayDetailModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                {selectedDayForModal && (
                                    <>
                                        <span>{format(selectedDayForModal, 'EEEE')}</span>
                                        <span className="text-muted-foreground">
                                            {format(selectedDayForModal, 'MMMM d')}
                                        </span>
                                    </>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {selectedDayForModal && getBookingsForDay(selectedDayForModal).map((booking, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer transition-colors",
                                        booking.status === 'completed' && "bg-gray-400 hover:bg-gray-500 text-white",
                                        booking.status === 'booked' && "bg-blue-500 hover:bg-blue-600 text-white",
                                        booking.status === 'pending' && "bg-yellow-500 hover:bg-yellow-600 text-white"
                                    )}
                                    onClick={() => {
                                        setShowDayDetailModal(false);
                                        handleSlotClick(selectedDayForModal, format(booking.start, 'HH:mm'));
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold">{booking.studentName}</div>
                                            <div className="text-sm opacity-90">ID: {booking.studentId}</div>
                                            <div className="text-sm mt-1">
                                                {format(booking.start, 'h:mm a')} - {format(booking.end, 'h:mm a')}
                                            </div>
                                        </div>
                                        <div className="text-xs uppercase tracking-wide opacity-90">
                                            {booking.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button 
                                className="flex-1"
                                onClick={() => {
                                    if (selectedDayForModal) {
                                        setSelectedDate(selectedDayForModal);
                                        setViewMode('day');
                                        setShowDayDetailModal(false);
                                    }
                                }}
                            >
                                View Day Schedule
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => setShowDayDetailModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Booking Detail Modal */}
                <Dialog open={showBookingDetailModal} onOpenChange={setShowBookingDetailModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Booking Details
                            </DialogTitle>
                        </DialogHeader>
                        {selectedBooking && (
                            <div className="space-y-4">
                                <div 
                                    className={cn(
                                        "p-5 rounded-xl",
                                        selectedBooking.status === 'completed' && "bg-gradient-to-br from-gray-400 to-gray-500 text-white",
                                        selectedBooking.status === 'booked' && "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
                                        selectedBooking.status === 'pending' && "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-semibold uppercase tracking-wider opacity-90 px-3 py-1 bg-white/20 rounded-full">
                                            {selectedBooking.status}
                                        </div>
                                        <div className={cn(
                                            "text-xs font-medium px-3 py-1 rounded-full",
                                            selectedBooking.bookerType === 'music_department' 
                                                ? "bg-blue-100 text-blue-700" 
                                                : "bg-purple-100 text-purple-700"
                                        )}>
                                            {selectedBooking.bookerType === 'music_department' ? '🎵 Music Dept' : '🏢 External'}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold mb-1">
                                        {selectedBooking.studentName}
                                    </div>
                                    <div className="text-sm opacity-90 flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" />
                                        {selectedBooking.studentId}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CalendarDays className="h-4 w-4 text-foreground/70" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Date</span>
                                        </div>
                                        <div className="font-semibold text-sm text-foreground">
                                            {format(selectedBooking.start, 'MMM dd, yyyy')}
                                        </div>
                                        <div className="text-xs font-semibold text-foreground/70">
                                            {format(selectedBooking.start, 'EEEE')}
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-4 w-4 text-foreground/70" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Time</span>
                                        </div>
                                        <div className="font-semibold text-sm text-foreground">
                                            {format(selectedBooking.start, 'h:mm a')} - {format(selectedBooking.end, 'h:mm a')}
                                        </div>
                                        <div className="text-xs font-semibold text-foreground/80">
                                            {(() => {
                                                const totalMinutes = Math.round((selectedBooking.end.getTime() - selectedBooking.start.getTime()) / (1000 * 60));
                                                const hours = Math.floor(totalMinutes / 60);
                                                const minutes = totalMinutes % 60;
                                                return `${hours}hr ${minutes}min`;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {selectedBooking.purpose && (
                                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                                                <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">Purpose of Booking</span>
                                        </div>
                                        <div className="pl-9 max-h-32 w-full overflow-y-auto overflow-x-hidden break-all break-words whitespace-pre-wrap text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                            {selectedBooking.purpose}
                                        </div>
                                    </div>
                                )}

                                {/* View Letter Button for External Bookings */}
                                {selectedBooking.bookerType === 'external' && selectedBooking.letterUrl && (
                                    <div className="pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => window.open(selectedBooking.letterUrl, '_blank')}
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            View Authorization Letter (PDF)
                                        </Button>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    {selectedBooking && selectedBooking.status === 'pending' && isMusicDean ? (
                                        <>
                                            <Button 
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => {
                                                    setShowBookingDetailModal(false);
                                                    setShowApproveModal(true);
                                                }}
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() => {
                                                    setShowBookingDetailModal(false);
                                                    setShowRejectModal(true);
                                                }}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    ) : canManageBookings ? (
                                        <Button 
                                            variant="destructive"
                                            onClick={() => {
                                                setShowBookingDetailModal(false);
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            Delete Booking
                                        </Button>
                                    ) : null}
                                    <div className="flex-1"></div>
                                    <Button 
                                        variant="outline"
                                        onClick={() => setShowBookingDetailModal(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Booking Modal */}
                <BookingModal
                    open={showBookingModal}
                    onOpenChange={setShowBookingModal}
                    selectedDate={bookingSlotDate}
                    selectedTime={bookingSlotTime}
                />

                {/* Rejected Bookings Modal (opened via button in controls) */}
                <Dialog open={showRejectedModal} onOpenChange={setShowRejectedModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <X className="h-5 w-5 text-red-600" />
                                Rejected Bookings
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">Archived rejected bookings for record keeping</p>
                        </DialogHeader>
                        <div className="px-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-8" onClick={() => setRejectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                                        Today
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setRejectedWeekStart(subWeeks(rejectedWeekStart, 1))}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setRejectedWeekStart(addWeeks(rejectedWeekStart, 1))}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button size="sm" variant="outline" className="h-8">
                                                {format(rejectedWeekStart, 'MMM d')} - {format(addDays(rejectedWeekStart, 6), 'MMM d, yyyy')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={rejectedWeekStart}
                                                onSelect={(d) => {
                                                    if (d) setRejectedWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
                                                }}
                                                components={{
                                                    DayButton: ({ day, modifiers, ...props }) => {
                                                        return (
                                                            <div>
                                                                <CalendarDayButton day={day} modifiers={modifiers} {...props} />
                                                            </div>
                                                        );
                                                    }
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="ml-2 text-sm font-medium text-muted-foreground flex items-center">
                                        <span className="hidden md:inline">{rejectedWeekFiltered.length}</span>
                                        <span className="ml-1">{rejectedWeekFiltered.length === 1 ? 'item' : 'items'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2">
                            {(!rejectedWeekFiltered || rejectedWeekFiltered.length === 0) ? (
                                <div className="p-6 text-center text-muted-foreground">No rejected bookings for this week.</div>
                            ) : (
                                rejectedWeekFiltered.map((booking: any) => (
                                    <div key={booking.id} className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/20 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="h-4 w-4 text-red-600" />
                                                    <span className="font-semibold text-sm">{booking.name}</span>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full",
                                                        booking.booker_type === 'music_department' 
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                    )}>
                                                        {booking.booker_type === 'music_department' ? '🎵 Music Dept' : '🏢 External'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{booking.email}</p>
                                            </div>
                                            <span className="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded">REJECTED</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{format(parseISO(booking.date), 'MMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span aria-label={`Time ${booking.start_time} to ${booking.end_time}`}>{formatBookingTime(booking)}</span>
                                            </div>
                                        </div>

                                        <div className="text-sm mb-2">
                                            <span className="text-muted-foreground">Purpose: </span>
                                            <div className="font-medium break-words break-all whitespace-pre-wrap max-h-24 overflow-y-auto text-sm text-foreground">
                                                {booking.purpose}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-red-200 dark:border-red-800">
                                            <p className="text-xs text-muted-foreground mb-1">Rejection Reason:</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 italic break-words break-all whitespace-pre-wrap max-h-28 overflow-y-auto">{booking.rejection_reason}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Rejected on: {format(parseISO(booking.rejected_at), 'MMM d, yyyy HH:mm')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <DialogFooter>
                            <div className="flex w-full">
                                <div className="flex-1" />
                                <Button variant="outline" onClick={() => setShowRejectedModal(false)}>Close</Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Approve Booking Modal */}
                <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Approve Booking</DialogTitle>
                            <DialogDescription>Confirm booking approval</DialogDescription>
                        </DialogHeader>
                        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center">
                            
                            {/* Icon */}
                            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e0f8f1] dark:bg-green-950/30">
                                <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#1abc9c]">
                                    ✓
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-[28px] font-bold text-[#1abc9c] mb-4">Approve Booking?</h2>
                            <p className="text-[16px] font-medium text-gray-500 dark:text-gray-300 mb-6">
                                Are you sure you want to approve this booking?
                            </p>

                            {/* Booking Details */}
                            {selectedBooking && (
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8 text-left">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Name:</span>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedBooking.studentName}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedBooking.date}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500 dark:text-gray-400">Time:</span>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedBooking.time}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    className="flex-1 py-4 text-lg font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 transition duration-300 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-600 hover:-translate-y-0.5"
                                    onClick={() => setShowApproveModal(false)}
                                    disabled={isSubmitting}
                                >
                                    CANCEL
                                </button>
                                <button
                                    className="flex-1 py-4 text-lg font-semibold rounded-xl text-white bg-[#1abc9c] transition duration-300 ease-in-out hover:bg-[#16a085] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleApproveBooking}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'APPROVING...' : 'APPROVE'}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Reject Booking Modal */}
                <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Reject Booking
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Please provide a reason for rejecting this booking.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedBooking && (
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Student Name</span>
                                        <span className="font-medium text-sm">{selectedBooking.studentName}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Email</span>
                                        <span className="font-medium text-sm truncate">{selectedBooking.email}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Date</span>
                                        <span className="font-medium text-sm">{selectedBooking.date}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground">Time</span>
                                        <span className="font-medium text-sm">{selectedBooking.time}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rejection-reason" className="text-sm font-medium">
                                        Reason for Rejection <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="rejection-reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="min-h-[100px] resize-none"
                                        placeholder="Please explain why this booking is being rejected..."
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This reason will be sent to the student via email.
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogFooter className="gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleRejectBooking}
                                disabled={isSubmitting || !rejectionReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isSubmitting ? 'Rejecting...' : 'Reject Booking'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Delete Booking</DialogTitle>
                            <DialogDescription>Confirm deletion of booking</DialogDescription>
                        </DialogHeader>
                        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center">
                            
                            {/* Icon */}
                            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#ffebee] dark:bg-red-950/30">
                                <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#e74c3c]">
                                    !
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-[28px] font-bold text-[#e74c3c] mb-4">Delete Booking?</h2>
                            <p className="text-[16px] font-medium text-gray-500 dark:text-gray-300 mb-6">
                                Are you sure you want to delete this booking? This action cannot be undone.
                            </p>

                            {/* Booking Details */}
                            {selectedBooking && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Name:</span>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedBooking.studentName}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{format(selectedBooking.start, 'MMM dd, yyyy')}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500 dark:text-gray-400">Time:</span>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {format(selectedBooking.start, 'h:mm a')} - {format(selectedBooking.end, 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Confirmation Input */}
                            <div className="mb-6 text-left">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    Type <span className="text-[#e74c3c] font-semibold">Delete Booking</span> to confirm:
                                </p>
                                <Input
                                    type="text"
                                    value={deleteConfirmationText}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteConfirmationText(e.target.value)}
                                    placeholder="Delete Booking"
                                    className="w-full"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteConfirmationText('');
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => selectedBooking && handleDeleteBooking(selectedBooking.id)}
                                    disabled={deleteConfirmationText !== 'Delete Booking' || isSubmitting}
                                    variant="destructive"
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete Booking'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Cancelled Booking Modal */}
                <Dialog open={showDeleteCancelledModal} onOpenChange={setShowDeleteCancelledModal}>
                    <DialogContent className="sm:max-w-md p-0">
                        <div className="p-6 space-y-4">
                            <DialogHeader className="space-y-2">
                                <DialogTitle className="text-xl font-semibold text-left">Delete Cancelled Booking</DialogTitle>
                                <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 text-left">
                                    Are you sure you want to permanently delete this cancelled booking? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>

                            <DialogFooter className="flex flex-row justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteCancelledModal(false);
                                        setBookingToDelete(null);
                                    }}
                                    disabled={isSubmitting}
                                    className="px-6"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={confirmDeleteCancelledBooking}
                                    disabled={isSubmitting}
                                    className="px-6 bg-[#FF6692] hover:bg-[#FF5280] text-white"
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete Booking'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Modal */}
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center">
                            
                            {/* Icon */}
                            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e0f8f1]">
                                <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#1abc9c]">
                                    ✓
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-[28px] font-bold text-[#343a40] dark:text-white mb-4">Success!</h2>
                            <p className="text-[16px] font-medium text-gray-500 dark:text-gray-300 mb-12">
                                {successMessage}
                            </p>

                            {/* Confirm Button */}
                            <button
                                className="w-full py-4 text-lg font-semibold rounded-xl text-white bg-[#1abc9c] transition duration-300 ease-in-out hover:bg-[#16a085] hover:-translate-y-0.5"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    window.location.reload();
                                }}
                            >
                                CONFIRM
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
