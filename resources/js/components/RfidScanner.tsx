import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { router } from '@inertiajs/react';
import { useModalContext } from '@/contexts/ModalContext';
import BookCubicleModal from '@/components/BookCubicleModal';
import BorrowInstrumentModal from '@/components/BorrowInstrumentModal';
import BorrowToolModal from '@/components/BorrowToolModal';
import SuccessModal from '@/components/SuccessModal';
import SuccessTimeoutModal from '@/components/SuccessTimeoutModal';
import SimpleTimeoutModal from '@/components/SimpleTimeoutModal';
import FailureModal from '@/components/FailureModal';
import StudentActivityLogModal from '@/components/StudentActivityLogModal';
import UnrecognizedStudentModal from '@/components/UnrecognizedStudentModal';
import { Square, Guitar, Wrench } from 'lucide-react';

// Define a more specific type for a booking
interface Booking {
    id: number; // This is the booking_id
    type: 'cubicle' | 'instrument' | 'tool';
    details: string;
    resource_id: number; // This is the actual ID of the cubicle, instrument, or tool
    time_in: string; // ISO datetime string
}

interface Student {
    name: string;
    student_id: string;
    year?: number;
    sec?: string;
    mtl_time_remaining?: number;
}

const RfidScanner: React.FC = () => {
    const { isAnyBorrowModalOpen } = useModalContext();
    const [rfid, setRfid] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);
    const [isNoBookingModalOpen, setIsNoBookingModalOpen] = useState(false);
    const [isNoBookingError, setIsNoBookingError] = useState(false);
    const [bookingTypeToCreate, setBookingTypeToCreate] = useState<'cubicle' | 'instrument' | 'tool' | null>(null);
    const [isBookCubicleModalOpen, setIsBookCubicleModalOpen] = useState(false);
    const [isBorrowInstrumentModalOpen, setIsBorrowInstrumentModalOpen] = useState(false);
    const [isBorrowToolModalOpen, setIsBorrowToolModalOpen] = useState(false);
    const [isRfidBooking, setIsRfidBooking] = useState(false);
    const [bookingSuccessDetails, setBookingSuccessDetails] = useState<any>(null);
    const [successType, setSuccessType] = useState<'booking' | 'timeout'>('booking');
    const [timeoutDetails, setTimeoutDetails] = useState<{
        name: string;
        itemType: string;
        itemNo: number | string;
        timeIn: string;
        timeOut: string;
        duration: string;
    } | null>(null);
    const [isSimpleTimeoutModalOpen, setIsSimpleTimeoutModalOpen] = useState(false);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [failureDetails, setFailureDetails] = useState<any>(null);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [isUnrecognizedStudentModalOpen, setIsUnrecognizedStudentModalOpen] = useState(false);
    const [unrecognizedStudentId, setUnrecognizedStudentId] = useState<string>('');
    
    // Shared state for combined booking
    const [sharedStudentInfo, setSharedStudentInfo] = useState<any>(null);
    const [sharedInstrumentIds, setSharedInstrumentIds] = useState<number[]>([]);
    const [sharedToolIds, setSharedToolIds] = useState<number[]>([]);

    const resetState = () => {
        setRfid('');
        setBookings([]);
        setStudent(null);
        setSelectedBookings([]);
        setSelectionModalOpen(false);
        setIsNoBookingModalOpen(false);
        setIsNoBookingError(false);
        setBookingTypeToCreate(null);
        setIsBookCubicleModalOpen(false);
        setIsBorrowInstrumentModalOpen(false);
        setIsBorrowToolModalOpen(false);
        setIsRfidBooking(false);
        setBookingSuccessDetails(null);
        setSuccessType('booking');
        setTimeoutDetails(null);
        setIsSimpleTimeoutModalOpen(false);
        setIsFailureModalOpen(false);
        setFailureDetails(null);
        setShowActivityLog(false);
        setActivityLogs([]);
        setSharedStudentInfo(null);
        setSharedInstrumentIds([]);
        setSharedToolIds([]);
        setIsUnrecognizedStudentModalOpen(false);
        setUnrecognizedStudentId('');
    };

    const handleScanSubmit = React.useCallback(async (scannedRfid: string) => {
        if (!scannedRfid) return;

        setIsProcessing(true);
        try {
            // Get CSRF token from meta tag
            const csrfMetaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
            const csrfToken = csrfMetaTag?.content;
            
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page and try again.');
            }

            const response = await fetch('/rfid-scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ rfid: scannedRfid }),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                throw new Error('Session expired or authentication required. Please refresh the page.');
            }

            const data = await response.json();

            // Check for CSRF token mismatch (419 status)
            if (response.status === 419) {
                throw new Error('CSRF token mismatch. Refreshing page...');
            }

            // Handle unrecognized student error (404 with specific error type)
            if (!response.ok && data.error_type === 'unrecognized_student') {
                setUnrecognizedStudentId(data.scanned_id || scannedRfid);
                setIsUnrecognizedStudentModalOpen(true);
                return;
            }

            // Handle other non-OK responses
            if (!response.ok) {
                throw new Error(data.message || `Server responded with status: ${response.status}`);
            }

            if (data.status === 'error') {
                // Check if it's the "no booking" error
                if (data.message === "The student doesn't have existing booking") {
                    setStudent(data.student);
                    setIsNoBookingError(true);
                } else {
                    setError(data.message);
                }
                return;
            }

            if (data.student && data.bookings !== undefined) {
                setStudent(data.student);
                setBookings(data.bookings);
                
                // If no bookings, show the "no booking" modal
                if (data.bookings.length === 0) {
                    setIsNoBookingModalOpen(true);
                } else {
                    setSelectionModalOpen(true);
                }
            } else {
                setError('Received invalid data from server.');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            
            // Auto-refresh on CSRF token mismatch
            if (err.message && err.message.includes('CSRF token mismatch')) {
                setError('Session expired. Refreshing page...');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                return;
            }
            
            setError(err.message || 'An error occurred while scanning the RFID.');
        } finally {
            setIsProcessing(false);
            setRfid(''); // Clear RFID input after every scan attempt
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if the user is focused on an input, textarea, or select element
            const target = event.target as HTMLElement;
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
            
            // Disable RFID when ANY booking-related modal is open (RFID or manual)
            if (
                isAnyBorrowModalOpen || 
                isSelectionModalOpen || 
                isSuccessModalOpen || 
                isNoBookingModalOpen || 
                isNoBookingError || 
                error || 
                isTextInput ||
                isBookCubicleModalOpen ||
                isBorrowInstrumentModalOpen ||
                isBorrowToolModalOpen ||
                isSimpleTimeoutModalOpen ||
                bookingTypeToCreate !== null ||
                isProcessing ||
                isUnrecognizedStudentModalOpen
            ) return;

            if (event.key === 'Enter') {
                handleScanSubmit(rfid);
            } else if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
                setRfid(prev => prev + event.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        rfid, 
        handleScanSubmit, 
        isAnyBorrowModalOpen, 
        isSelectionModalOpen, 
        isSuccessModalOpen, 
        isNoBookingModalOpen, 
        isNoBookingError, 
        error,
        isBookCubicleModalOpen,
        isBorrowInstrumentModalOpen,
        isBorrowToolModalOpen,
        isSimpleTimeoutModalOpen,
        bookingTypeToCreate,
        isProcessing,
        isUnrecognizedStudentModalOpen
    ]);

    const handleConfirmTimeout = async () => {
        if (selectedBookings.length === 0) {
            setError('Please select at least one booking to time out.');
            return;
        }

        setIsProcessing(true);
        const timeoutPromises = selectedBookings.map(booking => {
            let endpoint = '';
            const payload: Record<string, number> = {};

            if (booking.type === 'cubicle') {
                endpoint = '/timeouts/cubicle';
                payload.cubicle_id = booking.resource_id;
            } else if (booking.type === 'instrument') {
                endpoint = '/timeouts/instrument';
                payload.instrument_id = booking.resource_id;
            } else if (booking.type === 'tool') {
                endpoint = '/timeouts/tool';
                payload.tool_id = booking.resource_id;
            }

            return fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement).content,
                },
                body: JSON.stringify(payload),
            });
        });

        try {
            const results = await Promise.all(timeoutPromises);
            const hasErrors = results.some(res => !res.ok);

            if (hasErrors) {
                throw new Error('One or more bookings could not be timed out.');
            }

            // Only show detailed timeout modal if exactly 1 booking is timed out
            if (selectedBookings.length === 1 && student) {
                const firstBooking = selectedBookings[0];
                const timeIn = new Date(firstBooking.time_in);
                const timeOut = new Date();
                const durationInMinutes = Math.round((timeOut.getTime() - timeIn.getTime()) / 60000);
                const hours = Math.floor(durationInMinutes / 60);
                const minutes = durationInMinutes % 60;
                const duration = `${hours}hr ${minutes}min`;

                // Determine item type label (Cubicle -> Room, etc.)
                const itemTypeLabel = firstBooking.type === 'cubicle' ? 'Room' : firstBooking.type === 'instrument' ? 'Instrument' : 'Tool';
                
                // Use the details as-is (already includes type and number, e.g., "MTL 1", "Guitar 2", "Piano")
                const itemNo = firstBooking.details;

                setTimeoutDetails({
                    name: student.name,
                    itemType: itemTypeLabel,
                    itemNo: itemNo,
                    timeIn: timeIn.toLocaleTimeString(),
                    timeOut: timeOut.toLocaleTimeString(),
                    duration: duration,
                });
                setSuccessType('timeout');
                setSelectionModalOpen(false);
                setSuccessModalOpen(true);
            } else if (selectedBookings.length > 1) {
                // For multiple bookings, show simple timeout modal
                setSelectionModalOpen(false);
                setIsSimpleTimeoutModalOpen(true);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while timing out bookings.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        setSelectedBookings(checked ? bookings : []);
    };

    const handleSelectBooking = (checked: boolean | 'indeterminate', booking: Booking) => {
        setSelectedBookings(prev =>
            checked ? [...prev, booking] : prev.filter(b => b.id !== booking.id)
        );
    };

    const getBookingTypesAvailable = () => {
        const bookedTypes: Set<string> = new Set();
        bookings.forEach(booking => {
            bookedTypes.add(booking.type);
        });
        return bookedTypes;
    };

    return (
        <div>
            <input type="hidden" value={rfid} readOnly />

            {/* Error Modal */}
            <Dialog open={!!error} onOpenChange={() => setError(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Error</DialogTitle>
                        <DialogDescription>
                            An error occurred while processing your request
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground">
                        {error}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setError(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unrecognized Student Modal */}
            <UnrecognizedStudentModal
                isOpen={isUnrecognizedStudentModalOpen}
                onClose={resetState}
                studentId={unrecognizedStudentId}
            />

            {/* No Booking Error Modal - Choose what to book */}
            <Dialog open={isNoBookingError} onOpenChange={() => !isProcessing && setIsNoBookingError(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Ready to Book?</DialogTitle>
                        <DialogDescription>
                            Choose what type of resource you'd like to book
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground">
                        It looks like you don't have any active booking. Select an option below to book your spot.
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={resetState}>Cancel</Button>
                        <Button onClick={() => {
                            setIsNoBookingError(false);
                            setBookingTypeToCreate('cubicle');
                        }}>Book Now</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Choose What to Book Modal */}
            <Dialog open={bookingTypeToCreate !== null} onOpenChange={() => !isProcessing && setBookingTypeToCreate(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">What would you like to do?</DialogTitle>
                        <DialogDescription>
                            Select an option below to book a resource or check your activity log
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {(() => {
                            const bookedTypes = getBookingTypesAvailable();
                            const isCubicleBooked = bookedTypes.has('cubicle');
                            const isInstrumentBooked = bookedTypes.has('instrument');
                            const isToolBooked = bookedTypes.has('tool');

                            return (
                                <>
                                    <button
                                        onClick={() => {
                                            if (!isCubicleBooked) {
                                                setIsRfidBooking(true);
                                                setBookingTypeToCreate(null);
                                                setIsNoBookingError(false);
                                                setIsBookCubicleModalOpen(true);
                                            }
                                        }}
                                        disabled={isCubicleBooked}
                                        className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-all duration-200 group ${
                                            isCubicleBooked
                                                ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700/30 opacity-50 cursor-not-allowed'
                                                : 'border-gray-300 hover:border-pink-500 hover:bg-pink-50 dark:border-gray-600 dark:hover:border-pink-500 dark:hover:bg-pink-950'
                                        }`}
                                    >
                                        <Square className={`w-8 h-8 mb-2 ${
                                            isCubicleBooked
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-600 group-hover:text-pink-500 dark:text-gray-400 dark:group-hover:text-pink-400'
                                        }`} />
                                        <span className={`text-center text-sm font-medium ${
                                            isCubicleBooked
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                                        }`}>Book a Cubicle</span>
                                        {isCubicleBooked && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Already Booked</span>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!isInstrumentBooked) {
                                                // Don't set isRfidBooking to true - open in manual mode
                                                setBookingTypeToCreate(null);
                                                setIsNoBookingError(false);
                                                setIsBorrowInstrumentModalOpen(true);
                                            }
                                        }}
                                        disabled={isInstrumentBooked}
                                        className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-all duration-200 group ${
                                            isInstrumentBooked
                                                ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700/30 opacity-50 cursor-not-allowed'
                                                : 'border-gray-300 hover:border-pink-500 hover:bg-pink-50 dark:border-gray-600 dark:hover:border-pink-500 dark:hover:bg-pink-950'
                                        }`}
                                    >
                                        <Guitar className={`w-8 h-8 mb-2 ${
                                            isInstrumentBooked
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-600 group-hover:text-pink-500 dark:text-gray-400 dark:group-hover:text-pink-400'
                                        }`} />
                                        <span className={`text-center text-sm font-medium ${
                                            isInstrumentBooked
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                                        }`}>Borrow an Instrument</span>
                                        {isInstrumentBooked && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Already Booked</span>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!isToolBooked) {
                                                // Don't set isRfidBooking to true - open in manual mode
                                                setBookingTypeToCreate(null);
                                                setIsNoBookingError(false);
                                                setIsBorrowToolModalOpen(true);
                                            }
                                        }}
                                        disabled={isToolBooked}
                                        className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-all duration-200 group ${
                                            isToolBooked
                                                ? 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700/30 opacity-50 cursor-not-allowed'
                                                : 'border-gray-300 hover:border-pink-500 hover:bg-pink-50 dark:border-gray-600 dark:hover:border-pink-500 dark:hover:bg-pink-950'
                                        }`}
                                    >
                                        <Wrench className={`w-8 h-8 mb-2 ${
                                            isToolBooked
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-600 group-hover:text-pink-500 dark:text-gray-400 dark:group-hover:text-pink-400'
                                        }`} />
                                        <span className={`text-center text-sm font-medium ${
                                            isToolBooked
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-700 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400'
                                        }`}>Borrow a Tool</span>
                                        {isToolBooked && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Already Booked</span>}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (student) {
                                                // Don't close the choice modal
                                                // Fetch activity logs and show modal
                                                try {
                                                    const logsResponse = await fetch(`/api/student-activity-log?student_id=${student.student_id}`);
                                                    const logsData = await logsResponse.json();
                                                    setActivityLogs(logsData.logs || []);
                                                    setShowActivityLog(true);
                                                } catch (error) {
                                                    console.error('Error fetching activity logs:', error);
                                                }
                                            }
                                        }}
                                        className="flex flex-col items-center justify-center p-6 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all duration-200 group"
                                    >
                                        <svg className="w-8 h-8 mb-2 text-gray-600 group-hover:text-purple-500 dark:text-gray-400 dark:group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">Check Activity Log</span>
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetState}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Booking Selection Modal */}
            <Dialog open={isSelectionModalOpen} onOpenChange={() => !isProcessing && setSelectionModalOpen(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Select Bookings to Time Out</DialogTitle>
                        <DialogDescription>
                            Choose which active bookings you'd like to time out
                        </DialogDescription>
                    </DialogHeader>
                    {student && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600 dark:text-gray-300">Name:</span>
                                    <span className="text-gray-900 dark:text-white">{student.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600 dark:text-gray-300">Student ID:</span>
                                    <span className="text-gray-900 dark:text-white">{student.student_id}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
                            <Checkbox
                                id="select-all"
                                className="h-5 w-5"
                                onCheckedChange={handleSelectAll}
                                checked={bookings.length > 0 && selectedBookings.length === bookings.length}
                            />
                            <label htmlFor="select-all" className="text-base font-semibold text-gray-900 dark:text-white cursor-pointer">Select All</label>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {bookings.map(booking => (
                                <div key={booking.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <Checkbox
                                        id={`booking-${booking.id}`}
                                        className="h-5 w-5"
                                        checked={selectedBookings.some(b => b.id === booking.id)}
                                        onCheckedChange={(checked) => handleSelectBooking(checked, booking)}
                                    />
                                    <label htmlFor={`booking-${booking.id}`} className="text-base font-medium text-gray-800 dark:text-gray-200 cursor-pointer flex-1">{booking.details}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-2 flex flex-col-reverse sm:flex-row">
                        <Button variant="outline" onClick={resetState} disabled={isProcessing}>Cancel</Button>
                        <Button 
                            onClick={() => {
                                setSelectionModalOpen(false);
                                setBookingTypeToCreate('cubicle');
                            }} 
                            variant="outline"
                            disabled={isProcessing || getBookingTypesAvailable().size === 3}
                        >
                            Book Now
                        </Button>
                        <Button onClick={handleConfirmTimeout} disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Modal - Booking */}
            {successType === 'booking' && (
                <SuccessModal
                    isOpen={isSuccessModalOpen}
                    onClose={() => {
                        setSuccessModalOpen(false);
                        if (bookingSuccessDetails) {
                            resetState();
                        }
                    }}
                    type={successType}
                    bookingDetails={bookingSuccessDetails}
                />
            )}

            {/* Success Modal - Timeout */}
            {successType === 'timeout' && (
                <SuccessTimeoutModal
                    isOpen={isSuccessModalOpen}
                    onClose={() => {
                        setSuccessModalOpen(false);
                        resetState();
                        router.reload();
                    }}
                    timeoutDetails={timeoutDetails}
                />
            )}

            {/* Simple Timeout Modal - for multiple timeouts */}
            <SimpleTimeoutModal
                isOpen={isSimpleTimeoutModalOpen}
                onClose={() => {
                    setIsSimpleTimeoutModalOpen(false);
                    resetState();
                    router.reload();
                }}
            />

            {/* Failure Modal */}
            {failureDetails && (
                <FailureModal
                    isOpen={isFailureModalOpen}
                    onClose={() => {
                        setIsFailureModalOpen(false);
                        setFailureDetails(null);
                        resetState();
                    }}
                    errorMessage={failureDetails.errorMessage}
                    studentDetails={failureDetails.studentDetails}
                />
            )}

            {/* Booking Modals */}
            <BookCubicleModal
                isOpen={isBookCubicleModalOpen}
                onClose={() => {
                    setIsBookCubicleModalOpen(false);
                    setIsRfidBooking(false);
                }}
                onBookingSuccess={(details) => {
                    setIsBookCubicleModalOpen(false);
                    setBookingSuccessDetails(details);
                    setSuccessModalOpen(true);
                }}
                onBookingFailure={(details) => {
                    setIsBookCubicleModalOpen(false);
                    setIsRfidBooking(false);
                    setFailureDetails(details);
                    setIsFailureModalOpen(true);
                }}
                preFilledStudent={isRfidBooking && student ? {
                    student_id: student.student_id,
                    first_name: student.name.split(' ')[0],
                    last_name: student.name.split(' ').slice(1).join(' '),
                    rfid_uid: '',
                    mtl_time_remaining: student.mtl_time_remaining || 0,
                    year: student.year || 0,
                    sec: student.sec || ''
                } : undefined}
                onBackToChoices={() => {
                    setIsBookCubicleModalOpen(false);
                    setBookingTypeToCreate('cubicle');
                }}
            />
            <BorrowInstrumentModal
                isOpen={isBorrowInstrumentModalOpen}
                onClose={() => {
                    setIsBorrowInstrumentModalOpen(false);
                    setIsRfidBooking(false);
                    setSharedStudentInfo(null);
                    setSharedInstrumentIds([]);
                    setSharedToolIds([]);
                }}
                onBookingSuccess={(details) => {
                    setIsBorrowInstrumentModalOpen(false);
                    setBookingSuccessDetails(details);
                    setSuccessModalOpen(true);
                }}
                onBookingFailure={(details) => {
                    setIsBorrowInstrumentModalOpen(false);
                    setIsRfidBooking(false);
                    setFailureDetails(details);
                    setIsFailureModalOpen(true);
                }}
                preFilledStudent={sharedStudentInfo || (student ? {
                    student_id: student.student_id,
                    first_name: student.name.split(' ')[0],
                    last_name: student.name.split(' ').slice(1).join(' '),
                    rfid_uid: '',
                    mtl_time_remaining: student.mtl_time_remaining || 0,
                    year: student.year || 0,
                    sec: student.sec || ''
                } : undefined)}
                onStudentInfoChange={setSharedStudentInfo}
                preFilledInstrumentIds={sharedInstrumentIds}
                preFilledToolIds={sharedToolIds}
                onInstrumentSelectionChange={(ids) => {
                    setSharedInstrumentIds(ids);
                }}
                onSwitchToTool={() => {
                    // Switch modals - state has already been updated by onInstrumentSelectionChange
                    setIsBorrowInstrumentModalOpen(false);
                    setIsBorrowToolModalOpen(true);
                }}
            />
            <BorrowToolModal
                isOpen={isBorrowToolModalOpen}
                onClose={() => {
                    setIsBorrowToolModalOpen(false);
                    setIsRfidBooking(false);
                    setSharedStudentInfo(null);
                    setSharedInstrumentIds([]);
                    setSharedToolIds([]);
                }}
                onBookingSuccess={(details) => {
                    setIsBorrowToolModalOpen(false);
                    setBookingSuccessDetails(details);
                    setSuccessModalOpen(true);
                }}
                onBookingFailure={(details) => {
                    setIsBorrowToolModalOpen(false);
                    setIsRfidBooking(false);
                    setFailureDetails(details);
                    setIsFailureModalOpen(true);
                }}
                preFilledStudent={sharedStudentInfo || (student ? {
                    student_id: student.student_id,
                    first_name: student.name.split(' ')[0],
                    last_name: student.name.split(' ').slice(1).join(' '),
                    rfid_uid: '',
                    mtl_time_remaining: student.mtl_time_remaining || 0,
                    year: student.year || 0,
                    sec: student.sec || ''
                } : undefined)}
                onStudentInfoChange={setSharedStudentInfo}
                preFilledInstrumentIds={sharedInstrumentIds}
                preFilledToolIds={sharedToolIds}
                onToolSelectionChange={(ids) => {
                    setSharedToolIds(ids);
                }}
                onSwitchToInstrument={() => {
                    // Switch modals - state has already been updated by onToolSelectionChange
                    setIsBorrowToolModalOpen(false);
                    setIsBorrowInstrumentModalOpen(true);
                }}
            />

            {/* Student Activity Log Modal */}
            <StudentActivityLogModal
                isOpen={showActivityLog}
                onClose={() => setShowActivityLog(false)}
                studentName={student ? student.name : ''}
                studentId={student?.student_id || ''}
                yearSection={student && student.year && student.sec ? `${student.year}-${student.sec}` : undefined}
                mtlTimeRemaining={student?.mtl_time_remaining}
                logs={activityLogs}
            />
        </div>
    );
};

export default RfidScanner;
