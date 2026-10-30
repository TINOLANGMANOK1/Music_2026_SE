import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Square, Clock, CreditCard } from 'lucide-react';
import RfidValidationFailureModal from './RfidValidationFailureModal';
import StudentActivityLogModal from './StudentActivityLogModal';

interface Cubicle {
  cubicle_id: number;
  cubicle_type: string;
  cubicle_no: number;
}

interface AvailableCubicles {
  Guitar: Cubicle[];
  Piano: Cubicle[];
}

interface StudentInfo {
  student_id: string;
  first_name: string;
  last_name: string;
  rfid_uid: string;
  mtl_time_remaining: number;
  year: number;
  sec: string;
}

interface BookCubicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (details: any) => void;
  onBookingFailure: (details: any) => void;
  preFilledStudent?: StudentInfo;
  onBackToChoices?: () => void;
}

const BookCubicleModal = ({ isOpen, onClose, onBookingSuccess, onBookingFailure, preFilledStudent, onBackToChoices }: BookCubicleModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availableCubicles, setAvailableCubicles] = useState<AvailableCubicles>({ Guitar: [], Piano: [] });
  const [selectedCubicleType, setSelectedCubicleType] = useState<string>('');
  const [selectedCubicleNumber, setSelectedCubicleNumber] = useState<number | string>('');
  const [searchResults, setSearchResults] = useState<StudentInfo[]>([]);
  const [showRfidFailure, setShowRfidFailure] = useState(false);
  const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
  const [rfidAction, setRfidAction] = useState<'booking' | 'activity' | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const page = usePage<any>();
  const shownErrorRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  
  // Check if user is Student Panel
  const isStudentPanel = page.props.auth?.user?.role === 'Student Panel';

  // Handle RFID scan for Student Panel users
  useEffect(() => {
    if (!isStudentPanel || !isWaitingForRfid || !isOpen) return;

    const handleRfidScan = async (rfidCode: string) => {
      try {
        // Make API call to validate RFID and get student info
        const response = await fetch('/rfid-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement).content,
          },
          body: JSON.stringify({ rfid: rfidCode }),
        });

        const data = await response.json();

        // Check if student data exists (status can be 'error' for "no existing booking" but still valid)
        if (!response.ok || data.error || (data.status === 'error' && !data.student)) {
          // RFID not validated or no student data
          setShowRfidFailure(true);
          setIsWaitingForRfid(false);
          setRfidAction(null);
          return;
        }

        // RFID validated successfully (student data exists)
        if (rfidAction === 'booking' && data.student) {
          // Set student info and move to next step
          const studentData: StudentInfo = {
            student_id: data.student.student_id || '',
            first_name: data.student.first_name || data.student.name?.split(' ')[0] || '',
            last_name: data.student.last_name || data.student.name?.split(' ').slice(1).join(' ') || '',
            rfid_uid: rfidCode,
            mtl_time_remaining: Number(data.student.mtl_time_remaining) || 480,
            year: Number(data.student.year) || 0,
            sec: String(data.student.sec || ''),
          };
          setStudentInfo(studentData);
          setIsWaitingForRfid(false);
          setRfidAction(null);
          setCurrentStep(2);
        } else if (rfidAction === 'activity' && data.student) {
          // Create student data object for activity log
          const studentData: StudentInfo = {
            student_id: data.student.student_id || '',
            first_name: data.student.first_name || data.student.name?.split(' ')[0] || '',
            last_name: data.student.last_name || data.student.name?.split(' ').slice(1).join(' ') || '',
            rfid_uid: rfidCode,
            mtl_time_remaining: data.student.mtl_time_remaining ?? 480,
            year: data.student.year || 0,
            sec: data.student.sec || '',
          };
          
          // Fetch student's activity logs and show modal
          try {
            const logsResponse = await fetch(`/api/student-activity-log?student_id=${data.student.student_id}`);
            const logsData = await logsResponse.json();
            
            setActivityLogs(logsData.logs || []);
            setStudentInfo(studentData); // Store student info for the modal
            setIsWaitingForRfid(false);
            setRfidAction(null);
            setShowActivityLog(true);
          } catch (error) {
            console.error('Error fetching activity logs:', error);
            setIsWaitingForRfid(false);
            setRfidAction(null);
          }
        }
      } catch (error) {
        console.error('RFID scan error:', error);
        setShowRfidFailure(true);
        setIsWaitingForRfid(false);
        setRfidAction(null);
      }
    };

    let rfidBuffer = '';
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only capture when waiting for RFID
      if (!isWaitingForRfid) return;

      if (event.key === 'Enter') {
        if (rfidBuffer.length > 0) {
          handleRfidScan(rfidBuffer);
          rfidBuffer = '';
        }
      } else if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
        rfidBuffer += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStudentPanel, isWaitingForRfid, isOpen, rfidAction, onClose]);

  // Check for page errors (from booking failure redirect)
  useEffect(() => {
    const currentError = page.props.errors?.booking;
    
    // Only show error if:
    // 1. Modal is open
    // 2. There's an error
    // 3. We haven't shown this exact error yet
    // 4. This error appeared after a submission (not a stale error)
    if (isOpen && currentError && shownErrorRef.current !== currentError && isSubmittingRef.current) {
      shownErrorRef.current = currentError;
      isSubmittingRef.current = false; // Reset submission flag
      
      const selectedCubicleDetails = selectedCubicleType && selectedCubicleNumber
        ? availableCubicles[selectedCubicleType as keyof AvailableCubicles]?.find(
            (cubicle) => cubicle.cubicle_id === Number(selectedCubicleNumber)
          )
        : null;

      onBookingFailure({
        errorMessage: currentError,
        studentDetails: {
          studentId: studentInfo?.student_id || 'N/A',
          name: studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : 'N/A',
          availableTime: studentInfo?.mtl_time_remaining !== undefined ? `${Math.floor(studentInfo.mtl_time_remaining / 60)} hr ${studentInfo.mtl_time_remaining % 60} min remaining` : 'N/A',
        }
      });

      // Clear errors after showing the modal
      setTimeout(() => {
        router.get(window.location.href, {}, { preserveState: true, replace: true });
      }, 50);
    }
  }, [page.props.errors, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // If pre-filled student is provided, skip to step 2
      if (preFilledStudent) {
        setStudentInfo(preFilledStudent);
        setCurrentStep(2);
        return; // Early return to avoid resetting below
      } else {
        // Reset to step 1 for manual search
        setCurrentStep(1);
        setSearchQuery('');
        setStudentInfo(null);
        setValidationError(null);
        setAvailableCubicles({ Guitar: [], Piano: [] });
        setSelectedCubicleType('');
        setSelectedCubicleNumber('');
        setSearchResults([]);
      }
    } else {
      // Reset state when modal closes
      setCurrentStep(1);
      setSearchQuery('');
      setStudentInfo(null);
      setValidationError(null);
      setAvailableCubicles({ Guitar: [], Piano: [] });
      setSelectedCubicleType('');
      setSelectedCubicleNumber('');
      setSearchResults([]);
      shownErrorRef.current = null; // Reset error tracking when modal closes
      isSubmittingRef.current = false; // Reset submission flag
    }
  }, [isOpen, preFilledStudent]);

  useEffect(() => {
    const fetchAvailableCubicles = async () => {
      try {
        const response = await fetch('/api/available-cubicles');
        const data = await response.json();
        setAvailableCubicles(data);
      } catch (error) {
        console.error('Error fetching available cubicles:', error);
      }
    };

    if (isOpen && currentStep === 2) { // Fetch only when modal is open and on step 2
      fetchAvailableCubicles();
    }
  }, [isOpen, currentStep]);

  const handleSearchStudents = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/students?search=' + query);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error fetching students:', error);
        setSearchResults([]);
      }
    }, 300);
  };

  const handleSelectStudent = (student: StudentInfo) => {
    setStudentInfo(student);
    setValidationError(null);
    setCurrentStep(2); // Move to booking details step
  };

   const handleSubmitBooking = async () => {
    setValidationError(null); // Clear previous validation errors
    if (!studentInfo || !selectedCubicleNumber) {
      setValidationError('Please complete all booking details.');
      return;
    }

    const selectedCubicleDetails = selectedCubicleType && selectedCubicleNumber
      ? availableCubicles[selectedCubicleType as keyof AvailableCubicles]?.find(
          (cubicle) => cubicle.cubicle_id === Number(selectedCubicleNumber)
        )
      : null;

    isSubmittingRef.current = true; // Mark that we're submitting a booking
    
    router.post('/bookings/cubicle', {
      cubicle_id: selectedCubicleNumber,
      student_id: studentInfo.student_id,
    }, {
      onSuccess: () => {
        isSubmittingRef.current = false; // Reset submission flag
        const bookingResult = {
          reference: 'N/A', // Backend should return booking_id
          name: `${studentInfo.first_name} ${studentInfo.last_name}`,
          idNumber: studentInfo.student_id,
          cubicleType: selectedCubicleType,
          cubicleNo: selectedCubicleDetails?.cubicle_no,
        };
        onBookingSuccess(bookingResult);
      },
      onError: (errors) => {
        onBookingFailure({
          errorMessage: errors.booking || 'Unknown error',
          studentDetails: {
            studentId: studentInfo?.student_id || 'N/A',
            name: studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : 'N/A',
            availableTime: studentInfo?.mtl_time_remaining !== undefined ? `${studentInfo.mtl_time_remaining} mins remaining` : 'N/A',
          }
        });
      }
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // This step is now handled by handleSelectStudent
      // If no student is selected, prevent moving forward
      if (!studentInfo) {
        setValidationError('Please select a student to proceed.');
        return;
      }
      setValidationError(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedCubicleType || !selectedCubicleNumber) {
        setValidationError('Please select both room type and room number.');
        return;
      }
      setValidationError(null);
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    // If on step 2 with prefilled student (RFID booking), go back to choices
    if (currentStep === 2 && preFilledStudent && onBackToChoices) {
      onBackToChoices();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Student Panel sees 2 large buttons instead of search
        if (isStudentPanel) {
          if (isWaitingForRfid) {
            return (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Waiting for RFID Tap...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Please tap your RFID card on the reader</p>
                <Button variant="outline" onClick={() => { setIsWaitingForRfid(false); setRfidAction(null); }}>
                  Cancel
                </Button>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select an Action</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose what you want to do</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => { setRfidAction('booking'); setIsWaitingForRfid(true); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/40">
                    <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Book a Cubicle</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tap RFID to start</span>
                </div>

                <div
                  onClick={() => { setRfidAction('activity'); setIsWaitingForRfid(true); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Check Activity Log</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">View your history</span>
                </div>
              </div>
            </div>
          );
        }

        // Default: Manual search for non-Student Panel users
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="form-group">
                <Label htmlFor="student-search">Student ID/Name</Label>
                <Input
                  type="text"
                  id="student-search"
                  placeholder="Enter ID or Name to search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearchStudents(e.target.value);
                  }}
                  className="dark:bg-gray-700 dark:text-white"
                />
                {validationError && <InputError message={validationError} />}
              </div>
              <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Year & Sec</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.length > 0 ? (
                      searchResults.map((student) => (
                        <TableRow key={student.student_id}>
                          <TableCell>{student.student_id}</TableCell>
                          <TableCell>{`${student.last_name}, ${student.first_name}`}</TableCell>
                          <TableCell>{`${student.year}-${student.sec}`}</TableCell>
                          <TableCell>
                            <Button onClick={() => handleSelectStudent(student)}>Select</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No students found. Type to search.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Student Information Display */}
            {studentInfo && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium">
                      {studentInfo.first_name && studentInfo.last_name 
                        ? `${studentInfo.first_name} ${studentInfo.last_name}` 
                        : studentInfo.first_name || studentInfo.last_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Student ID</p>
                    <p className="font-medium">{studentInfo.student_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Year & Section</p>
                    <p className="font-medium">
                      {(studentInfo.year !== undefined && studentInfo.year !== null && studentInfo.sec) 
                        ? `${studentInfo.year}-${studentInfo.sec}` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">MTL Time Remaining</p>
                    <p className="font-medium">
                      {studentInfo.mtl_time_remaining !== undefined 
                        ? `${Math.floor(studentInfo.mtl_time_remaining / 60)}hr ${studentInfo.mtl_time_remaining % 60}min`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <Label htmlFor="room-type">Select Room Type</Label>
              <Select
                value={selectedCubicleType}
                onValueChange={(value) => {
                  setSelectedCubicleType(value);
                  setSelectedCubicleNumber(''); // Reset room number when type changes
                }}
              >
                <SelectTrigger id="room-type" className="dark:bg-gray-800">
                  <SelectValue placeholder="Choose Practice Room Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(availableCubicles).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} Cubicle
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationError && !selectedCubicleType && <InputError message={validationError} />}
            </div>
            <div className="form-group">
              <Label htmlFor="room-no">Select Room No.</Label>
              <Select
                value={selectedCubicleNumber.toString()}
                onValueChange={(value) => setSelectedCubicleNumber(Number(value))}
                disabled={!selectedCubicleType}
              >
                <SelectTrigger id="room-no" className="dark:bg-gray-800">
                  <SelectValue placeholder="Choose Room No." />
                </SelectTrigger>
                <SelectContent>
                  {selectedCubicleType &&
                    availableCubicles[selectedCubicleType as keyof AvailableCubicles]?.map((cubicle) => (
                      <SelectItem key={cubicle.cubicle_id} value={cubicle.cubicle_id.toString()}>
                        {cubicle.cubicle_no}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {validationError && !selectedCubicleNumber && <InputError message={validationError} />}
            </div>
          </div>
        );
      case 3:
        const selectedCubicleDetails = selectedCubicleType && selectedCubicleNumber
          ? availableCubicles[selectedCubicleType as keyof AvailableCubicles]?.find(
              (cubicle) => cubicle.cubicle_id === Number(selectedCubicleNumber)
            )
          : null;

        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b pb-2 mb-2">BOOKING INFORMATION:</h4>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="font-medium">Name:</span></p><p><span className="text-right">{studentInfo?.first_name} {studentInfo?.last_name}</span></p>
              <p><span className="font-medium">Room Type:</span></p><p><span className="text-right">{selectedCubicleDetails?.cubicle_type || 'N/A'}</span></p>
              <p><span className="font-medium">Room Number:</span></p><p><span className="text-right">{selectedCubicleDetails?.cubicle_no || 'N/A'}</span></p>
              <p><span className="font-medium">Student ID:</span></p><p><span className="text-right">{studentInfo?.student_id}</span></p>
              <p><span className="font-medium">MTL Time Remaining:</span></p><p><span className="text-right">{studentInfo?.mtl_time_remaining !== undefined ? `${Math.floor(studentInfo.mtl_time_remaining / 60)}hr ${studentInfo.mtl_time_remaining % 60}min` : 'N/A'}</span></p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getProgressWidth = () => {
    const totalSteps = 3;
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-6 border-b flex-shrink-0">
              <DialogTitle className="text-2xl font-bold">Book Cubicle</DialogTitle>
            </div>

            <div className="p-6 border-b flex-shrink-0">
              <div className="relative flex justify-between items-start gap-4">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-10 -translate-y-1/2">
                  <div className="h-full bg-pink-500 transition-all duration-400 ease-in-out" style={{ width: `${getProgressWidth()}%` }}></div>
                </div>
                
                <div className="flex flex-col items-center flex-1 text-center z-20 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-gray-500 transition-all duration-300", currentStep === 1 && "border-pink-500", currentStep > 1 && "bg-pink-500 border-pink-500 text-white text-xl")}>
                    {currentStep > 1 ? '✓' : '1'}
                  </div>
                  <div className={cn("mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300", currentStep === 1 && "text-pink-500")}>Scan Identification</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400">Enter the student's RFID code and Student ID.</div>
                </div>

                <div className="flex flex-col items-center flex-1 text-center z-20 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-gray-500 transition-all duration-300", currentStep === 2 && "border-pink-500", currentStep > 2 && "bg-pink-500 border-pink-500 text-white text-xl")}>
                    {currentStep > 2 ? '✓' : '2'}
                  </div>
                  <div className={cn("mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300", currentStep === 2 && "text-pink-500")}>Booking Details</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400">Choose Room Type and Number to continue.</div>
                </div>

                <div className="flex flex-col items-center flex-1 text-center z-20 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-gray-500 transition-all duration-300", currentStep === 3 && "border-pink-500")}>
                    3
                  </div>
                  <div className={cn("mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300", currentStep === 3 && "text-pink-500")}>Review Student Info</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400">Confirm all details before adding the student to the music system.</div>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto min-h-0">
              {renderStepContent()}
            </div>

            <DialogFooter className="p-4 border-t flex justify-end space-x-2 flex-shrink-0">
              <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1 || isWaitingForRfid}>Prev</Button>
              {currentStep < 3 && (
                <Button 
                  onClick={handleNext} 
                  disabled={
                    (currentStep === 1 && !studentInfo) || 
                    (currentStep === 2 && (!selectedCubicleType || !selectedCubicleNumber)) ||
                    isWaitingForRfid
                  }
                >
                  Next
                </Button>
              )}
              {currentStep === 3 && <Button onClick={handleSubmitBooking}>Done</Button>}
            </DialogFooter>
          </div>
      </DialogContent>
      
      {/* RFID Validation Failure Modal */}
      <RfidValidationFailureModal
        isOpen={showRfidFailure}
        onClose={() => {
          setShowRfidFailure(false);
          setIsWaitingForRfid(false);
          setRfidAction(null);
        }}
      />

      {/* Student Activity Log Modal */}
      <StudentActivityLogModal
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
        studentName={studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : ''}
        studentId={studentInfo?.student_id || ''}
        yearSection={studentInfo && studentInfo.year > 0 && studentInfo.sec ? `${studentInfo.year}-${studentInfo.sec}` : undefined}
        mtlTimeRemaining={studentInfo?.mtl_time_remaining}
        logs={activityLogs}
      />
    </Dialog>
  );
};

export default BookCubicleModal;