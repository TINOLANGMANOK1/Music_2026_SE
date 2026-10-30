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
import StudentActivityLogModal from './StudentActivityLogModal';

interface Instrument {
  id: number;
  asset_code: string;
  name: string;
  category: string;
  office?: string;
  status: string;
  is_borrowable?: boolean;
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

interface BorrowInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (details: any) => void;
  onBookingFailure: (details: any) => void;
  preFilledStudent?: StudentInfo;
  onSwitchToTool?: () => void;
  onStudentInfoChange?: (studentInfo: StudentInfo | null) => void;
  preFilledInstrumentIds?: number[];
  preFilledToolIds?: number[];
  onInstrumentSelectionChange?: (instrumentIds: number[]) => void;
}

const BorrowInstrumentModal = ({ isOpen, onClose, onBookingSuccess, onBookingFailure, preFilledStudent, onSwitchToTool, onStudentInfoChange, preFilledInstrumentIds = [], preFilledToolIds = [], onInstrumentSelectionChange }: BorrowInstrumentModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availableInstruments, setAvailableInstruments] = useState<Instrument[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [instrumentTypeFilter, setInstrumentTypeFilter] = useState<string>('All');
  const [assetSearch, setAssetSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StudentInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const page = usePage<any>();
  const shownErrorRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const isStudentPanel = page.props.auth?.user?.role === 'Student Panel';

  // Student Panel RFID states
  const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);
  const [rfidAction, setRfidAction] = useState<'booking' | 'activity' | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

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

  // Define fetch function before using it in useEffect
  const fetchAvailableInstruments = React.useCallback(async () => {
    try {
      // backend: get available assets where is_borrowable = 1 and status = 'Available'
      const response = await fetch('/api/available-instruments');
      const data = await response.json();
      // normalize to Instrument[] (assets)
      setAvailableInstruments(data);
    } catch (error) {
      console.error('Error fetching available instruments:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // If pre-filled student is provided, skip to step 2
      if (preFilledStudent) {
        setStudentInfo(preFilledStudent);
        // Only update selected IDs if they actually changed
        const newIds = preFilledInstrumentIds || [];
        setSelectedAssetIds(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newIds)) {
            return newIds;
          }
          return prev;
        });
        setCurrentStep(2);
        // Trigger data fetch immediately
        fetchAvailableInstruments();
        return; // Early return to avoid resetting below
      } else {
        // Reset to step 1 for manual search
        setCurrentStep(1);
        setSearchQuery('');
        setStudentInfo(null);
        setValidationError(null);
        setAvailableInstruments([]);
        setSelectedAssetId(null);
        setSelectedAssetIds([]);
        setInstrumentTypeFilter('All');
        setAssetSearch('');
        setSearchResults([]);
      }
    } else {
      // Reset state when modal closes
      setCurrentStep(1);
      setSearchQuery('');
      setStudentInfo(null);
      setValidationError(null);
      setAvailableInstruments([]);
      setSelectedAssetId(null);
      setSelectedAssetIds([]);
      setInstrumentTypeFilter('All');
      setAssetSearch('');
      setSearchResults([]);
      shownErrorRef.current = null; // Reset error tracking when modal closes
      isSubmittingRef.current = false; // Reset submission flag
    }
  }, [isOpen, preFilledStudent, fetchAvailableInstruments]); // Don't include array props that change on every render

  // Notify parent when student info changes
  useEffect(() => {
    // Only notify if student info was manually changed (not from preFilledStudent initialization)
    if (onStudentInfoChange && studentInfo && isOpen) {
      // Check if this is different from preFilledStudent to avoid infinite loops
      const isDifferent = !preFilledStudent || 
        studentInfo.student_id !== preFilledStudent.student_id ||
        studentInfo.first_name !== preFilledStudent.first_name ||
        studentInfo.last_name !== preFilledStudent.last_name;
      
      if (isDifferent) {
        onStudentInfoChange(studentInfo);
      }
    }
  }, [studentInfo, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent when instrument selection changes (but not during initialization)
  const isInitializingRef = useRef(false);
  
  useEffect(() => {
    // Mark as initializing when modal opens with pre-filled data
    if (isOpen && preFilledStudent) {
      isInitializingRef.current = true;
      // Clear the flag after a short delay to allow initialization to complete
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [isOpen, preFilledStudent]);

  useEffect(() => {
    // Only notify parent when modal is open and NOT during initialization
    if (onInstrumentSelectionChange && isOpen && !isInitializingRef.current) {
      onInstrumentSelectionChange(selectedAssetIds);
    }
  }, [selectedAssetIds, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && currentStep === 2) { // Fetch only when modal is open and on step 2
      fetchAvailableInstruments();
    }
  }, [isOpen, currentStep, fetchAvailableInstruments]);

  // RFID Keyboard Handler for Student Panel
  useEffect(() => {
    if (!isOpen || !isStudentPanel || !isWaitingForRfid) return;

    const handleRfidScan = async (rfidCode: string) => {
      try {
        const response = await fetch('/rfid-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          },
          body: JSON.stringify({ rfid: rfidCode }),
        });
        const data = await response.json();

        if (rfidAction === 'booking' && data.student) {
          const studentData: StudentInfo = {
            student_id: data.student.student_id || '',
            first_name: data.student.first_name || data.student.name?.split(' ')[0] || '',
            last_name: data.student.last_name || data.student.name?.split(' ').slice(1).join(' ') || '',
            rfid_uid: rfidCode,
            mtl_time_remaining: data.student.mtl_time_remaining ?? 480,
            year: data.student.year || 0,
            sec: data.student.sec || '',
          };
          setStudentInfo(studentData);
          setIsWaitingForRfid(false);
          setRfidAction(null);
          setCurrentStep(2);
        } else if (rfidAction === 'activity' && data.student) {
          const studentData: StudentInfo = {
            student_id: data.student.student_id || '',
            first_name: data.student.first_name || data.student.name?.split(' ')[0] || '',
            last_name: data.student.last_name || data.student.name?.split(' ').slice(1).join(' ') || '',
            rfid_uid: rfidCode,
            mtl_time_remaining: data.student.mtl_time_remaining ?? 480,
            year: data.student.year || 0,
            sec: data.student.sec || '',
          };
          
          try {
            const logsResponse = await fetch(`/api/student-activity-log?student_id=${data.student.student_id}`);
            const logsData = await logsResponse.json();
            
            setActivityLogs(logsData.logs || []);
            setStudentInfo(studentData);
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
        setIsWaitingForRfid(false);
        setRfidAction(null);
      }
    };

    let rfidBuffer = '';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (rfidBuffer.length > 0) {
          handleRfidScan(rfidBuffer);
          rfidBuffer = '';
        }
      } else if (event.key.length === 1) {
        rfidBuffer += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isStudentPanel, isWaitingForRfid, rfidAction]);

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
    
    // Check if there are any items selected (instruments OR tools)
    const hasInstruments = selectedAssetIds.length > 0;
    const hasTools = (preFilledToolIds || []).length > 0;
    
    if (!studentInfo || (!hasInstruments && !hasTools)) {
      setValidationError('Please select at least one item to borrow.');
      return;
    }

    const selectedAssetDetails = availableInstruments.filter(a => selectedAssetIds.includes(a.id));

    setSubmitting(true);
    isSubmittingRef.current = true;

    // Fetch tool details upfront before booking
    let toolDetailsMap: Map<number, any> = new Map();
    if (preFilledToolIds && preFilledToolIds.length > 0) {
      try {
        const response = await fetch('/api/available-tools');
        const allTools = await response.json();
        preFilledToolIds.forEach(id => {
          const tool = allTools.find((t: any) => t.id === id);
          if (tool) {
            toolDetailsMap.set(id, tool);
          }
        });
      } catch (error) {
        console.error('Error fetching tool details:', error);
      }
    }

    // Book all items (instruments + tools) sequentially
    try {
      let successCount = 0;
      const allBookingDetails: any[] = [];

      // Book all instruments first
      for (const instrumentId of selectedAssetIds) {
        await new Promise<void>((resolve, reject) => {
          router.post('/bookings/instrument', {
            instrument_id: instrumentId,
            student_id: studentInfo.student_id,
          }, {
            onSuccess: () => {
              successCount++;
              const instrument = availableInstruments.find(i => i.id === instrumentId);
              if (instrument) {
                allBookingDetails.push({
                  type: 'instrument',
                  category: instrument.category,
                  code: instrument.asset_code,
                });
              }
              resolve();
            },
            onError: (errors) => {
              reject(errors);
            },
            preserveState: true,
            preserveScroll: true,
          });
        });
      }

      // Book all tools
      for (const toolId of (preFilledToolIds || [])) {
        await new Promise<void>((resolve, reject) => {
          router.post('/bookings/tool', {
            tool_ids: [toolId], // Send as array to match backend expectation
            student_id: studentInfo.student_id,
          }, {
            onSuccess: () => {
              successCount++;
              const tool = toolDetailsMap.get(toolId);
              if (tool) {
                allBookingDetails.push({
                  type: 'tool',
                  category: tool.category,
                  code: tool.asset_code,
                });
              } else {
                console.warn('🎸 Instrument Modal: Tool details not found for ID:', toolId);
              }
              resolve();
            },
            onError: (errors) => {
              reject(errors);
            },
            preserveState: true,
            preserveScroll: true,
          });
        });
      }

      // All succeeded - now reload the page to get fresh data
      isSubmittingRef.current = false;
      
      const instrumentDetails = allBookingDetails.filter(d => d.type === 'instrument');
      const toolDetails = allBookingDetails.filter(d => d.type === 'tool');
      
      const bookingResult = {
        reference: 'N/A',
        name: `${studentInfo.first_name} ${studentInfo.last_name}`,
        idNumber: studentInfo.student_id,
        instruments: instrumentDetails.length > 0 ? instrumentDetails.map((s:any) => ({
          category: s.category,
          code: s.code
        })) : undefined,
        tools: toolDetails.length > 0 ? toolDetails.map((s:any) => ({
          category: s.category,
          code: s.code
        })) : undefined,
      };
      
      // Reload the page data to reflect all bookings
      router.reload({ only: ['instruments', 'tools'] });
      
      onBookingSuccess(bookingResult);
      setSubmitting(false);
    } catch (errors: any) {
      isSubmittingRef.current = false;
      const errMsg = errors?.booking || errors?.message || 'Failed to complete booking. Please try again.';
      setValidationError(errMsg);
      setSubmitting(false);
      onBookingFailure({
        errorMessage: errMsg,
        studentDetails: {
          studentId: studentInfo?.student_id || 'N/A',
          name: studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : 'N/A',
          availableTime: studentInfo?.mtl_time_remaining !== undefined ? `${studentInfo.mtl_time_remaining} mins remaining` : 'N/A',
        }
      });
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!studentInfo) {
        setValidationError('Please select a student to proceed.');
        return;
      }
      setValidationError(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedAssetIds.length === 0) {
        setValidationError('Please select at least one instrument to continue.');
        return;
      }
      setValidationError(null);
      setCurrentStep(3);
    }
  };

  const toggleAssetSelection = (id: number) => {
    setSelectedAssetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    // Clear single selection state to avoid confusion
    setSelectedAssetId(null);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Student Panel: Show RFID buttons
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
                    <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C12 2 10 4 10 8C10 9.5 10.5 10.5 11 11.5L4 18.5C3.5 19 3 19.5 3 20.5C3 21.5 3.5 22 4.5 22C5.5 22 6 21.5 6.5 21L13.5 14C14.5 14.5 15.5 15 17 15C21 15 23 13 23 13L12 2Z" />
                      <circle cx="17" cy="7" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Borrow Instrument</span>
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

        // Default: Manual search
        return (
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Student ID</TableHead>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead className="min-w-[100px]">Year & Sec</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.length > 0 ? (
                      searchResults.map((student) => (
                        <TableRow key={student.student_id}>
                          <TableCell className="min-w-[120px]">{student.student_id}</TableCell>
                          <TableCell className="min-w-[200px] truncate">{`${student.last_name}, ${student.first_name}`}</TableCell>
                          <TableCell className="min-w-[100px]">{`${student.year}-${student.sec}`}</TableCell>
                          <TableCell className="min-w-[100px]">
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
          // Show searchable list of available assets filtered by office
          const officeList = Array.from(new Set(
            availableInstruments
              .map(a => a.office)
              .filter(Boolean)
          )).sort() as string[];
          
          const filteredAssets = availableInstruments.filter(a => {
            // Match by office
            let matchesOffice = instrumentTypeFilter === 'All';
            if (!matchesOffice && a.office) {
              matchesOffice = a.office === instrumentTypeFilter;
            }
            const q = assetSearch.trim().toLowerCase();
            const matchesSearch = q === '' || (a.name && a.name.toLowerCase().includes(q)) || (a.asset_code && a.asset_code.toLowerCase().includes(q));
            return matchesOffice && matchesSearch;
          });

          return (
            <div className="space-y-4">
              {/* Student Information Display */}
              {studentInfo && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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

              <div className="flex items-center gap-2">
                <Label>Office:</Label>
                <Select value={instrumentTypeFilter} onValueChange={(v) => setInstrumentTypeFilter(v)}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All"/></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="All">All Offices</SelectItem>
                    {officeList.map(office => (
                      <SelectItem key={office} value={office}>
                        {office}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Search asset code or name" value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} className="ml-2" />
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Asset Code</TableHead>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[120px]">Category</TableHead>
                        <TableHead className="min-w-[180px]">Office</TableHead>
                        <TableHead className="min-w-[80px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map(asset => (
                          <TableRow key={asset.id}>
                            <TableCell className="min-w-[120px]">{asset.asset_code}</TableCell>
                            <TableCell className="min-w-[150px]">{asset.name}</TableCell>
                            <TableCell className="min-w-[120px]">{asset.category}</TableCell>
                            <TableCell className="min-w-[180px]">{asset.office}</TableCell>
                            <TableCell className="min-w-[80px]">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedAssetIds.includes(asset.id)}
                                onChange={() => { toggleAssetSelection(asset.id); setValidationError(null); }}
                                className="sr-only"
                                />
                              <span className={"w-6 h-6 inline-flex items-center justify-center rounded-md border " + (selectedAssetIds.includes(asset.id) ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-300') }>
                                {selectedAssetIds.includes(asset.id) ? '✓' : ''}
                              </span>
                            </label>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No available instruments found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
              {validationError && <InputError message={validationError} />}
            </div>
          );
      case 3:
          const selectedInstrumentDetails = selectedAssetIds.length > 0 ? availableInstruments.filter(a => selectedAssetIds.includes(a.id)) : [];

          return (
            <div className="space-y-4">
              {/* Student Information Display */}
              {studentInfo && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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

              <h4 className="text-lg font-semibold border-b pb-2 mb-2">BOOKING SUMMARY:</h4>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">Total Items: {selectedInstrumentDetails.length}</p>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Selected Instrument(s):</p>
                  {selectedInstrumentDetails.length > 0 ? (
                    <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-gray-50 dark:bg-gray-800 mr-2">
                      <ul className="space-y-2">
                        {selectedInstrumentDetails.map((item, index) => (
                          <li key={item.id} className="py-2 border-b last:border-b-0 dark:border-gray-700">
                            <div className="font-medium text-sm">{item.category}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{item.asset_code} ({item.name})</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : 'N/A'}
                </div>
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
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh]">
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-6 pr-12 border-b flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Borrow Instrument</DialogTitle>
              {onSwitchToTool && (
                <Button variant="outline" onClick={() => {
                  // Save instrument selections before switching
                  if (onInstrumentSelectionChange) {
                    onInstrumentSelectionChange(selectedAssetIds);
                  }
                  // Use setTimeout to ensure state update completes
                  setTimeout(() => {
                    onSwitchToTool();
                  }, 0);
                }} className="flex items-center gap-2 mr-2">
                  <span>Switch to Tools</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Button>
              )}
            </div>

            <div className="p-6 border-b">
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
                  <div className="text-xs text-gray-400 dark:text-gray-400">Choose Instrument Type and Number to continue.</div>
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

            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              {renderStepContent()}
            </div>

            <DialogFooter className="p-4 border-t flex justify-end space-x-2 flex-shrink-0">
              <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>Prev</Button>
              {currentStep < 3 && <Button onClick={handleNext} disabled={currentStep === 1 && !studentInfo}>Next</Button>}
              {currentStep === 3 && <Button onClick={handleSubmitBooking} disabled={submitting}>{submitting ? 'Processing...' : 'Done'}</Button>}
            </DialogFooter>
          </div>
      </DialogContent>

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

export default BorrowInstrumentModal;
