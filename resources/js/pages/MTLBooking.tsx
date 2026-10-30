import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Mail,
    ChevronDown,
    X
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, startOfDay, endOfWeek, addMinutes, isWithinInterval, endOfDay } from 'date-fns';
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
    status: 'available' | 'booked' | 'pending' | 'completed';
    rejection_reason?: string;
}

interface MTLBookingProps {
    bookings?: any[];
    rejectedBookings?: any[];
    canBook: boolean;
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
}

export default function MTLBooking({ bookings = [], rejectedBookings = [], canBook, auth }: MTLBookingProps) {
    const isMusicDean = auth?.user?.role === 'Music Dean';
    const canManageBookings = auth?.user?.role === 'Music Dean' || auth?.user?.role === 'Administrator';
    const canCreateBooking = auth?.user?.role === 'Music Dean' || auth?.user?.role === 'Administrator' || auth?.user?.role === 'Student Assistant';
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
    );
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingSlotDate, setBookingSlotDate] = useState<Date | undefined>(undefined);
    const [bookingSlotTime, setBookingSlotTime] = useState<string | undefined>(undefined);
    
    // Approval/Rejection states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showRejectedModal, setShowRejectedModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectedWeekStart, setRejectedWeekStart] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);

    const [activeTab, setActiveTab] = useState<'calendar' | 'pending'>('calendar');
    
    // Booking form state
    const [bookingForm, setBookingForm] = useState({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        date: bookingSlotDate || new Date(),
        start_time: '',
        end_time: '',
        purpose: ''
    });
    
    // Time picker and date picker state
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // Student search state
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [studentSearchTimeout, setStudentSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    
    // Convert backend bookings to TimeSlot format for MTL priority display
    const [mockBookings, setMockBookings] = useState<TimeSlot[]>([]);

    // Convert bookings from backend to TimeSlot format
    useEffect(() => {
        if (bookings && bookings.length > 0) {
            const converted = bookings.map((booking: any) => {
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
                let status: 'booked' | 'pending' | 'completed';
                
                if (isPast && booking.status === 'approved') {
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
                    status: status,
                    rejection_reason: booking.rejection_reason
                };
            });
            setMockBookings(converted);
        }
    }, [bookings]);

    // Cleanup student search when modal closes
    useEffect(() => {
        if (!showBookingModal) {
            setStudentSearchResults([]);
            setShowStudentDropdown(false);
            setSelectedStudent(null);
            if (studentSearchTimeout) {
                clearTimeout(studentSearchTimeout);
            }
        }
    }, [showBookingModal]);

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

    // Generate week days for calendar display
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

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

    // Current bookings based on view mode
    const currentBookings = viewMode === 'week' ? weekBookings : dayBookings;

    const currentPendingBookings = useMemo(() => {
        const start = viewMode === 'week' ? startOfDay(currentWeekStart) : startOfDay(selectedDate || new Date());
        const end = viewMode === 'week' ? endOfDay(addDays(currentWeekStart, 6)) : endOfDay(selectedDate || new Date());

        return mockBookings.filter(booking =>
            booking.status === 'pending' &&
            isWithinInterval(startOfDay(booking.start), { start, end })
        );
    }, [mockBookings, viewMode, currentWeekStart, selectedDate]);

    // Stats for the current view
    const weekStats = useMemo(() => {
        return {
            total: currentBookings.length,
            booked: currentBookings.filter(b => b.status === 'booked').length,
            pending: currentPendingBookings.length,
        };
    }, [currentBookings, currentPendingBookings]);

    // Get all pending bookings across all dates
    const allPendingBookings = useMemo(() => {
        return mockBookings.filter(b => b.status === 'pending');
    }, [mockBookings]);

    // Navigation functions
    const goToPreviousWeek = () => {
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
        setSelectedDate(today);
    };

    // Handle date selection from calendar picker
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
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
            handleBookingClick(booking);
        } else {
            // Open booking modal with blank form
            setBookingSlotDate(day);
            setBookingSlotTime(timeSlot);
            // Clear the form
            setBookingForm({
                name: '',
                email: '',
                date: day,
                start_time: '',
                end_time: '',
                purpose: ''
            });
            setSelectedStudent(null);
            setShowBookingModal(true);
        }
    };

    const handleBookingClick = (booking: TimeSlot) => {
        setSelectedBooking({
            id: parseInt(booking.id),
            name: booking.studentName,
            email: booking.email,
            date: booking.date,
            start_time: format(booking.start, 'HH:mm'),
            end_time: format(booking.end, 'HH:mm'),
            purpose: booking.purpose,
            status: booking.status === 'booked' ? 'approved' : booking.status,
            rejection_reason: booking.rejection_reason
        });
        setShowBookingDetailModal(true);
    };

    // Confirm delete booking function for MTL
    const confirmDeleteBooking = (booking: TimeSlot) => {
        handleBookingClick(booking);
    };

    // Student search functionality
    const searchStudent = async (query: string) => {
        if (query.trim().length < 2) {
            setStudentSearchResults([]);
            setShowStudentDropdown(false);
            setSelectedStudent(null);
            return;
        }

        try {
            const response = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            setStudentSearchResults(data);
            setShowStudentDropdown(data.length > 0);
        } catch (error) {
            console.error('Error searching students:', error);
            setStudentSearchResults([]);
            setShowStudentDropdown(false);
        }
    };

    const handleNameChange = (value: string) => {
        setBookingForm(prev => ({ ...prev, name: value }));
        
        // Clear previous timeout
        if (studentSearchTimeout) {
            clearTimeout(studentSearchTimeout);
        }
        
        // Set new timeout for search
        const timeout = setTimeout(() => {
            searchStudent(value);
        }, 300);
        
        setStudentSearchTimeout(timeout);
        
        // If user clears the name, reset student selection
        if (!value.trim()) {
            setSelectedStudent(null);
            setShowStudentDropdown(false);
        }
    };

    const handleStudentSelect = (student: any) => {
        // Construct name with middle initial if available
        const middlePart = student.middle_initial ? ` ${student.middle_initial}. ` : ' ';
        const fullName = `${student.first_name}${middlePart}${student.last_name}`;
        setBookingForm(prev => ({ ...prev, name: fullName, email: student.email || bookingForm.email }));
        setSelectedStudent(student);
        setShowStudentDropdown(false);
        setStudentSearchResults([]);
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that student is verified
        if (!selectedStudent) {
            setErrorMessage('Please select a verified student from the dropdown.');
            setShowErrorModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/mtl-booking/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    ...bookingForm,
                    date: format(bookingForm.date, 'yyyy-MM-dd'),
                    student_id: selectedStudent.student_id
                })
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            const isJSON = contentType && contentType.includes('application/json');

            if (response.ok) {
                const result = isJSON ? await response.json() : {};
                setSuccessMessage('MTL booking submitted successfully! Awaiting approval.');
                setShowSuccessModal(true);
                setShowBookingModal(false);
                setBookingForm({
                    name: auth?.user?.name || '',
                    email: auth?.user?.email || '',
                    date: new Date(),
                    start_time: '',
                    end_time: '',
                    purpose: ''
                });
                setSelectedStudent(null);
                router.reload();
            } else {
                // Handle error response
                let errorMsg = 'Failed to submit booking';

                if (isJSON) {
                    try {
                        const result = await response.json();
                        errorMsg = result.error || result.message || errorMsg;
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                } else {
                    // Server returned HTML or non-JSON (likely a 500 error page)
                    errorMsg = `Server error (${response.status}). Please check if all required fields are filled correctly and try again.`;
                    console.error('Server returned non-JSON response:', await response.text());
                }

                setErrorMessage(errorMsg);
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            setErrorMessage('Failed to submit booking. Please check your internet connection and try again.');
            setShowErrorModal(true);
        }
        setIsSubmitting(false);
    };

    const handleApprove = async (bookingId: number) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/mtl-booking/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ status: 'approved' })
            });

            if (response.ok) {
                setSuccessMessage('MTL booking approved successfully!');
                setShowSuccessModal(true);
                setShowBookingDetailModal(false);
                router.reload();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to approve booking');
            }
        } catch (error) {
            console.error('Error approving booking:', error);
            alert('Failed to approve booking');
        }
        setIsSubmitting(false);
    };

    const handleReject = async () => {
        if (!selectedBooking || !rejectionReason.trim()) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`/mtl-booking/bookings/${selectedBooking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ 
                    status: 'rejected',
                    rejection_reason: rejectionReason
                })
            });

            if (response.ok) {
                setSuccessMessage('MTL booking rejected successfully.');
                setShowSuccessModal(true);
                setShowRejectModal(false);
                setShowBookingDetailModal(false);
                setRejectionReason('');
                router.reload();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to reject booking');
            }
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert('Failed to reject booking');
        }
        setIsSubmitting(false);
    };

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'booked':
            case 'approved':
                return (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                        Unknown
                    </Badge>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="MTL Booking - Music Technology Lab" />
            <div className="p-4 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">MTL Booking</h1>
                    <p className="text-muted-foreground">
                        Book the Music Technology Lab for your sessions - Priority booking system
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

                {/* CALENDAR & BOOKINGS TAB */}
                {activeTab === 'calendar' && (
                    <>
                        {/* Controls Card */}
                        <Card className="shadow-sm mb-6">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-pink-500" />
                                    Calendar Controls
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Navigate through dates and manage your MTL bookings
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
                                                    onClick={goToPreviousWeek} 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-9 w-9"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    onClick={goToNextWeek} 
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
                                                            {`${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`}
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
                                                        Week
                                                        <ChevronDown className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setViewMode('week')}>
                                                        Week
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
                                                    onClick={() => {
                                                        setBookingForm({
                                                            name: '',
                                                            email: '',
                                                            date: new Date(),
                                                            start_time: '',
                                                            end_time: '',
                                                            purpose: ''
                                                        });
                                                        setSelectedStudent(null);
                                                        setBookingSlotDate(undefined);
                                                        setShowBookingModal(true);
                                                    }}
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

                        {/* Week Calendar Grid - Identical to Cecilia Hall */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <div className={cn("overflow-x-auto", viewMode === 'week' ? "min-w-[900px]" : "min-w-[600px]")}>
                                        {/* Header Row - Days */}
                                        <div className={cn("border-b bg-muted/50 sticky top-0 z-10", viewMode === 'week' ? "flex" : "flex")}>
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
                                                                                    title="View MTL booking"
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
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* PENDING REQUESTS TAB */}
                {activeTab === 'pending' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                                Pending MTL Booking Requests
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Review and manage pending MTL booking requests
                            </p>
                        </CardHeader>
                        <CardContent>
                            {allPendingBookings.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                                    <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                                    <p>All MTL booking requests have been processed.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {allPendingBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-100/50 dark:hover:bg-orange-950/50 cursor-pointer transition-colors"
                                            onClick={() => handleBookingClick(booking)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-foreground">
                                                            {booking.studentName}
                                                        </h3>
                                                        <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Pending MTL Approval
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="h-4 w-4" />
                                                            {format(booking.start, 'EEEE, MMMM d, yyyy')}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {booking.time}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                                                </div>
                                                {canManageBookings && (
                                                    <div className="flex gap-2 ml-4">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleApprove(parseInt(booking.id));
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
                                                                setSelectedBooking({
                                                                    id: parseInt(booking.id),
                                                                    name: booking.studentName,
                                                                    email: booking.email,
                                                                    date: booking.date,
                                                                    start_time: format(booking.start, 'HH:mm'),
                                                                    end_time: format(booking.end, 'HH:mm'),
                                                                    purpose: booking.purpose,
                                                                    status: 'pending',
                                                                    rejection_reason: booking.rejection_reason
                                                                });
                                                                setShowRejectModal(true);
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Booking Detail Modal */}
            <Dialog open={showBookingDetailModal} onOpenChange={setShowBookingDetailModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>MTL Booking Details</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                                    <p className="mt-1 font-medium">{selectedBooking.name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                                    <p className="mt-1 text-sm">{selectedBooking.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Date</Label>
                                    <p className="mt-1">{format(parseISO(selectedBooking.date), 'MMM d, yyyy')}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Start Time</Label>
                                    <p className="mt-1">{selectedBooking.start_time}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">End Time</Label>
                                    <p className="mt-1">{selectedBooking.end_time}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                <div className="mt-1">
                                    {getStatusBadge(selectedBooking.status)}
                                </div>
                            </div>

                            {selectedBooking.purpose && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedBooking.purpose}</p>
                                </div>
                            )}

                            {selectedBooking.rejection_reason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <Label className="text-sm font-medium text-red-800">Rejection Reason</Label>
                                    <p className="mt-1 text-sm text-red-700">{selectedBooking.rejection_reason}</p>
                                </div>
                            )}

                            <DialogFooter className="space-x-2">
                                {canManageBookings && selectedBooking.status === 'pending' && (
                                    <>
                                        <Button
                                            onClick={() => handleApprove(selectedBooking.id)}
                                            disabled={isSubmitting}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve MTL Booking
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={isSubmitting}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                                
                                <Button variant="outline" onClick={() => setShowBookingDetailModal(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Booking Creation Modal */}
            <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create New MTL Booking</DialogTitle>
                        <DialogDescription>
                            Book the Music Technology Lab for your session
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <Label htmlFor="name">Name</Label>
                                <div className="relative">
                                    <Input
                                        ref={nameInputRef}
                                        id="name"
                                        value={bookingForm.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="Search student name..."
                                        required
                                        className={cn(
                                            selectedStudent && "border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-600",
                                            !selectedStudent && bookingForm.name && "border-red-500 bg-red-50 dark:bg-red-950/30 dark:border-red-600"
                                        )}
                                    />
                                    {selectedStudent && (
                                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                                    )}
                                    {!selectedStudent && bookingForm.name && (
                                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600" />
                                    )}
                                </div>
                                
                                {/* Student Search Dropdown */}
                                {showStudentDropdown && studentSearchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {studentSearchResults.map((student) => (
                                            <button
                                                key={student.student_id}
                                                type="button"
                                                onClick={() => handleStudentSelect(student)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                            >
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                    {student.first_name} {student.last_name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {student.student_id} • Year {student.year} - {student.sec}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {selectedStudent && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Student verified: {selectedStudent.student_id}
                                    </p>
                                )}
                                {!selectedStudent && bookingForm.name && (
                                    <p className="text-xs text-red-600 mt-1">
                                        ✗ Student not verified. Please select from the dropdown.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={bookingForm.email}
                                    onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        
                        {/* Date */}
                        <div className="space-y-2">
                            <Label>
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !bookingForm.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {bookingForm.date ? format(bookingForm.date, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={bookingForm.date}
                                        onSelect={(date) => {
                                            if (date) {
                                                setBookingForm(prev => ({ ...prev, date }));
                                                setShowDatePicker(false);
                                            }
                                        }}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">
                                    Start Time <span className="text-red-500">*</span>
                                </Label>
                                <Popover open={showStartTimePicker} onOpenChange={setShowStartTimePicker}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !bookingForm.start_time && "text-muted-foreground"
                                            )}
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            {bookingForm.start_time ? (
                                                <span>
                                                    {(() => {
                                                        const [hours, minutes] = bookingForm.start_time.split(':');
                                                        const hour = parseInt(hours);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        return `${displayHour}:${minutes} ${ampm}`;
                                                    })()}
                                                </span>
                                            ) : (
                                                <span>Select start time</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <TimePicker
                                            value={bookingForm.start_time}
                                            onChange={(time) => setBookingForm(prev => ({ ...prev, start_time: time }))}
                                            onClose={() => setShowStartTimePicker(false)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">
                                    End Time <span className="text-red-500">*</span>
                                </Label>
                                <Popover open={showEndTimePicker} onOpenChange={setShowEndTimePicker}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !bookingForm.end_time && "text-muted-foreground"
                                            )}
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            {bookingForm.end_time ? (
                                                <span>
                                                    {(() => {
                                                        const [hours, minutes] = bookingForm.end_time.split(':');
                                                        const hour = parseInt(hours);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        return `${displayHour}:${minutes} ${ampm}`;
                                                    })()}
                                                </span>
                                            ) : (
                                                <span>Select end time</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <TimePicker
                                            value={bookingForm.end_time}
                                            onChange={(time) => setBookingForm(prev => ({ ...prev, end_time: time }))}
                                            onClose={() => setShowEndTimePicker(false)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose (Optional)</Label>
                            <Textarea
                                id="purpose"
                                value={bookingForm.purpose}
                                onChange={(e) => setBookingForm(prev => ({ ...prev, purpose: e.target.value }))}
                                placeholder="Describe the purpose of your MTL session..."
                                rows={3}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowBookingModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-[#FF6692] hover:bg-[#FF5280] text-white" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit MTL Booking'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject MTL Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this MTL booking request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejection_reason">Rejection Reason</Label>
                            <Textarea
                                id="rejection_reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please provide a clear reason for rejecting this MTL booking..."
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || isSubmitting}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject MTL Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Success</DialogTitle>
                        <DialogDescription>{successMessage}</DialogDescription>
                    </DialogHeader>
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

            {/* Error Modal */}
            <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>{errorMessage}</DialogDescription>
                    </DialogHeader>
                    <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center">

                        {/* Icon */}
                        <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#fce8e6]">
                            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#e74c3c]">
                                !
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-[28px] font-bold text-[#e74c3c] mb-4">Error!</h2>
                        <p className="text-[16px] font-medium text-gray-500 dark:text-gray-300 mb-12">
                            {errorMessage}
                        </p>

                        {/* OK Button */}
                        <button
                            className="w-full py-4 text-lg font-semibold rounded-xl text-white bg-[#e74c3c] transition duration-300 ease-in-out hover:bg-[#c0392b] hover:-translate-y-0.5"
                            onClick={() => {
                                setShowErrorModal(false);
                                setErrorMessage('');
                            }}
                        >
                            OK
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rejected Bookings Modal */}
            <Dialog open={showRejectedModal} onOpenChange={setShowRejectedModal}>
                <DialogContent className="sm:max-w-[800px] max-h-[600px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Rejected MTL Bookings
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectedWeekStart(subWeeks(rejectedWeekStart, 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {format(rejectedWeekStart, 'MMM d')} - {format(endOfWeek(rejectedWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectedWeekStart(addWeeks(rejectedWeekStart, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    {rejectedWeekFiltered.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold mb-2">No Rejected Bookings</h3>
                            <p>No MTL bookings were rejected during this week.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rejectedWeekFiltered.map((booking: any) => (
                                <div key={booking.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-red-900">{booking.name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-red-700 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {formatBookingTime(booking)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                                                <User className="h-4 w-4" />
                                                {booking.email}
                                            </div>
                                            {booking.purpose && (
                                                <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                                                    <span className="font-medium">Purpose:</span> {booking.purpose}
                                                </div>
                                            )}
                                            {booking.rejection_reason && (
                                                <div className="mt-2 p-3 bg-red-200/50 rounded border border-red-300">
                                                    <p className="text-sm text-red-900">
                                                        <span className="font-medium">Rejection Reason:</span> {booking.rejection_reason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="destructive">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Rejected
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectedModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}