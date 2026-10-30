import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate?: Date;
    selectedTime?: string;
}

export function BookingModal({ open, onOpenChange, selectedDate, selectedTime }: BookingModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bookerType: 'music_department' as 'music_department' | 'external',
        date: selectedDate || new Date(),
        startTime: selectedTime || '',
        endTime: '',
        purpose: '',
    });
    const [letterFile, setLetterFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type (PDF only)
            if (file.type !== 'application/pdf') {
                setErrorMessage('Please upload a PDF file only');
                setShowErrorModal(true);
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMessage('File size must be less than 5MB');
                setShowErrorModal(true);
                return;
            }
            setLetterFile(file);
        }
    };

    const removeFile = () => {
        setLetterFile(null);
        const fileInput = document.getElementById('letter-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name || !formData.email || !formData.startTime || !formData.endTime || !formData.purpose) {
            alert('Please fill in all required fields');
            return;
        }

        // Check if external booker needs to upload letter
        if (formData.bookerType === 'external' && !letterFile) {
            alert('External bookers must upload an authorization letter (PDF)');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('booker_type', formData.bookerType);
            formDataToSend.append('date', format(formData.date, 'yyyy-MM-dd'));
            formDataToSend.append('start_time', formData.startTime);
            formDataToSend.append('end_time', formData.endTime);
            formDataToSend.append('purpose', formData.purpose);
            if (letterFile) {
                formDataToSend.append('letter', letterFile);
            }

            // Submit to backend
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page and try again.');
            }

            const response = await fetch('/cecilia-hall/bookings', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: formDataToSend,
                credentials: 'same-origin',
            });

            if (!response.ok) {
                // Handle 419 (CSRF token mismatch / session expired)
                if (response.status === 419) {
                    throw new Error('Your session has expired. Please refresh the page and try again.');
                }

                // Check if response is JSON before parsing
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    
                    // Handle Laravel validation errors
                    if (errorData.errors) {
                        const errorMessages = Object.values(errorData.errors).flat().join('\n');
                        throw new Error(errorMessages);
                    } else if (errorData.error) {
                        throw new Error(errorData.error);
                    } else if (errorData.message) {
                        throw new Error(errorData.message);
                    }
                } else {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                }
                throw new Error('Failed to submit booking request. Please check your inputs and try again.');
            }

            // Show success modal
            onOpenChange(false);
            setShowSuccessModal(true);
            
            // Reset form
            setFormData({
                name: '',
                email: '',
                bookerType: 'music_department',
                date: new Date(),
                startTime: '',
                endTime: '',
                purpose: '',
            });
            setLetterFile(null);
            
            // Reload after a short delay to show the modal
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        } catch (error) {
            console.error('Error submitting booking:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to submit booking request. Please try again.');
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Book Cecilia Hall</DialogTitle>
                        <DialogDescription>
                            Submit your booking request. The Dean will review and approve your request.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Booker Type - MOVED TO TOP */}
                        <div className="space-y-3">
                            <Label>
                                Booker Type <span className="text-red-500">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, bookerType: 'music_department' })}
                                    className={cn(
                                        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                                        formData.bookerType === 'music_department'
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                                    )}
                                >
                                    {formData.bookerType === 'music_department' && (
                                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className={cn(
                                        "text-3xl",
                                        formData.bookerType === 'music_department' ? "text-blue-600" : "text-gray-400"
                                    )}>
                                        🎵
                                    </div>
                                    <div className="text-center">
                                        <div className={cn(
                                            "font-semibold",
                                            formData.bookerType === 'music_department' ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                                        )}>
                                            Internal
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            No letter required
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, bookerType: 'external' })}
                                    className={cn(
                                        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                                        formData.bookerType === 'external'
                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                                    )}
                                >
                                    {formData.bookerType === 'external' && (
                                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className={cn(
                                        "text-3xl",
                                        formData.bookerType === 'external' ? "text-purple-600" : "text-gray-400"
                                    )}>
                                        🏢
                                    </div>
                                    <div className="text-center">
                                        <div className={cn(
                                            "font-semibold",
                                            formData.bookerType === 'external' ? "text-purple-700 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"
                                        )}>
                                            External
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Letter required
                                        </div>
                                    </div>
                                </button>
                            </div>
                            {formData.bookerType === 'external' && (
                                <div className="flex items-start gap-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 border border-purple-200 dark:border-purple-800">
                                    <svg className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        External bookers must upload an authorization letter (PDF) for Dean approval.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label>
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
                                                    </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.date}
                                    onSelect={(date) => date && setFormData({ ...formData, date })}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-time">
                                Start Time <span className="text-red-500">*</span>
                            </Label>
                            <Popover open={showStartTimePicker} onOpenChange={setShowStartTimePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.startTime && "text-muted-foreground"
                                        )}
                                    >
                                        <Clock className="mr-2 h-4 w-4" />
                                        {formData.startTime ? (
                                            <span>
                                                {(() => {
                                                    const [hours, minutes] = formData.startTime.split(':');
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
                                        value={formData.startTime}
                                        onChange={(time) => setFormData({ ...formData, startTime: time })}
                                        onClose={() => setShowStartTimePicker(false)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-time">
                                End Time <span className="text-red-500">*</span>
                            </Label>
                            <Popover open={showEndTimePicker} onOpenChange={setShowEndTimePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.endTime && "text-muted-foreground"
                                        )}
                                    >
                                        <Clock className="mr-2 h-4 w-4" />
                                        {formData.endTime ? (
                                            <span>
                                                {(() => {
                                                    const [hours, minutes] = formData.endTime.split(':');
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
                                        value={formData.endTime}
                                        onChange={(time) => setFormData({ ...formData, endTime: time })}
                                        onClose={() => setShowEndTimePicker(false)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Purpose/Description */}
                    <div className="space-y-2">
                        <Label htmlFor="purpose">
                            Purpose of Usage <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="purpose"
                            placeholder="Describe the purpose of your event or activity..."
                            value={formData.purpose}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, purpose: e.target.value })}
                            rows={4}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Please provide details about your event, expected number of attendees, and any special requirements.
                        </p>
                    </div>

                    {/* File Upload - Only for External Bookers */}
                    {formData.bookerType === 'external' && (
                        <div className="space-y-2">
                            <Label htmlFor="letter-upload">
                                Authorization Letter (PDF) <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2">
                                {!letterFile ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="letter-upload"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('letter-upload')?.click()}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Authorization Letter (PDF)                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{letterFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(letterFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={removeFile}
                                    >
                                        <X className="h-4 w-4" />                        </Button>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload a formal letter requesting approval for the event. Maximum file size: 5MB
                            </p>
                        </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-[#FF6692] hover:bg-[#FF5280] text-white"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Booking Request Submitted!
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            Your booking request has been successfully submitted for approval.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            <strong>What happens next?</strong>
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>The Music Dean will review your request</li>
                            <li>You'll receive a notification once approved or if any changes are needed</li>
                            <li>Your booking will appear on the calendar once approved</li>
                        </ul>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button onClick={() => setShowSuccessModal(false)}>
                            Got it!                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Error Modal */}
        <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center">
                    
                    {/* Icon */}
                    <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#fce8e6]">
                        <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#e74c3c]">
                            !
                        </div>
                    </div>

                    {/* Title */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>Booking submission error</DialogDescription>
                    </DialogHeader>
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
    </>
    );
}
