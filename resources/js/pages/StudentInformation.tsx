import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationFirst, PaginationLast } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Filter, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import SuccessModal from '@/components/SuccessModal';
import FailureModal from '@/components/FailureModal';

interface Student {
    student_id: string;
    first_name: string;
    last_name: string;
    middle_initial?: string;
    year: number;
    sec: string;
    mtl_time_remaining: number;
}

interface PaginatedStudents {
    current_page: number;
    data: Student[];
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    last_page: number;
}

interface StudentInformationProps {
    students: PaginatedStudents;
    filters: { search?: string, year?: string, sec?: string };
    sections: string[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
}

export default function StudentInformation({ students, filters, sections, auth }: StudentInformationProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedYear, setSelectedYear] = useState(filters.year || 'All');
    const [selectedSec, setSelectedSec] = useState(filters.sec || 'All');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncSuccessModal, setShowSyncSuccessModal] = useState(false);
    const [showSyncErrorModal, setShowSyncErrorModal] = useState(false);
    const [syncErrorMessage, setSyncErrorMessage] = useState('');
    const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
    const [showAddErrorModal, setShowAddErrorModal] = useState(false);
    const [addErrorMessage, setAddErrorMessage] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { flash, errors: pageErrors } = usePage().props as any;
    
    // Check if user has permission to add/delete students (Music Dean or Administrator only)
    const canManageStudents = auth?.user?.role === 'Music Dean' || auth?.user?.role === 'Administrator';

    // Show success modal when flash.success exists
    useEffect(() => {
        if (flash?.success) {
            setShowAddSuccessModal(true);
        }
    }, [flash?.success]);

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        rfid_uid: '',
        first_name: '',
        last_name: '',
        middle_initial: '',
        year: 1,
        sec: 'BM1',
        mtl_time_remaining: 480,
    });

    const handleSyncExternalStudents = async () => {
        setIsSyncing(true);
        router.post('/student-information/sync', {}, {
            onSuccess: () => {
                setIsSyncing(false);
                setShowSyncSuccessModal(true);
            },
            onError: (errors: any) => {
                setIsSyncing(false);
                setSyncErrorMessage(errors.sync || 'Failed to sync student data. Please try again.');
                setShowSyncErrorModal(true);
            },
        });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchQuery = e.target.value;
        setSearchQuery(newSearchQuery);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            const params: Record<string, string> = { page: '1' };
            if (newSearchQuery) params.search = newSearchQuery;
            if (selectedYear !== 'All') params.year = selectedYear;
            if (selectedSec !== 'All') params.sec = selectedSec;
            router.get('/student-information', params, { preserveState: true, replace: true });
        }, 300);
    };

    const handleYearChange = (value: string) => {
        setSelectedYear(value);
        const params: Record<string, string> = { page: '1' };
        if (searchQuery) params.search = searchQuery;
        if (value !== 'All') params.year = value;
        if (selectedSec !== 'All') params.sec = selectedSec;
        router.get('/student-information', params, { preserveState: true, replace: true });
    };

    const handleSecChange = (value: string) => {
        setSelectedSec(value);
        const params: Record<string, string> = { page: '1' };
        if (searchQuery) params.search = searchQuery;
        if (selectedYear !== 'All') params.year = selectedYear;
        if (value !== 'All') params.sec = value;
        router.get('/student-information', params, { preserveState: true, replace: true });
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string> = { page: page.toString() };
        if (searchQuery) params.search = searchQuery;
        if (selectedYear !== 'All') params.year = selectedYear;
        if (selectedSec !== 'All') params.sec = selectedSec;
        router.get('/student-information', params, { preserveState: true, replace: true });
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student-information', {
            onSuccess: () => {
                reset();
                setAddModalOpen(false);
                // Success modal will be shown by useEffect detecting flash.success
            },
            onError: (errors: any) => {
                // Collect all error messages
                const errorMessages = Object.values(errors).flat().join(', ');
                setAddErrorMessage(errorMessages || 'Failed to add student. Please check your input.');
                setShowAddErrorModal(true);
            },
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(students.data.map(s => s.student_id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (studentId: string, checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(prev => [...prev, studentId]);
        } else {
            setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
        }
    };

    const handleDeleteClick = () => {
        if (selectedStudentIds.length === 0) return;
        setDeleteConfirmationText('');
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmationText !== 'Delete Student') {
            return;
        }

        setIsDeleting(true);
        router.post('/student-information/delete', {
            student_ids: selectedStudentIds
        }, {
            onSuccess: () => {
                setSelectedStudentIds([]);
                setDeleteModalOpen(false);
                setDeleteConfirmationText('');
                setIsDeleting(false);
            },
            onError: (errors: any) => {
                setIsDeleting(false);
                const errorMessages = Object.values(errors).flat().join(', ');
                setAddErrorMessage(errorMessages || 'Failed to delete student(s).');
                setShowAddErrorModal(true);
            },
        });
    };

    const getRowClass = (mtlTime: number) => {
        const remainingHours = mtlTime / 60;
        if (remainingHours > 5) return 'bg-green-100 dark:bg-green-900';
        if (remainingHours > 2) return 'bg-yellow-100 dark:bg-yellow-900';
        return 'bg-red-100 dark:bg-red-900';
    };

    return (
        <AppLayout>
            <Head title="Student Information" />
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-2">Student Information</h1>
                <p className="text-muted-foreground mb-4">
                    Keep all your student details—name, ID, section, year, and email—organized and accessible in one convenient place.
                </p>

                <Card className="mb-6 pt-1 pb-7 gap-1">
                    <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-pink-500" />
                            <CardTitle className="text-lg font-semibold">Filters:</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Year:</span>
                                <Select onValueChange={handleYearChange} value={selectedYear}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                        <SelectItem value="4">4</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Section:</span>
                                <Select onValueChange={handleSecChange} value={selectedSec}>
                                    <SelectTrigger className="min-w-[150px] w-auto">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        {sections.map(section => (
                                            <SelectItem key={section} value={section}>{section}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Input 
                                type="text" 
                                placeholder="Search by name or ID..." 
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="max-w-sm flex-grow dark:bg-gray-700 dark:text-white"
                            />
                            {canManageStudents && (
                                <Button
                                    onClick={handleDeleteClick}
                                    disabled={selectedStudentIds.length === 0}
                                    variant="destructive"
                                    size="default"
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete ({selectedStudentIds.length})
                                </Button>
                            )}
                            {canManageStudents && (
                            <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
                                <DialogTrigger asChild>
                                    <Button>Add Student</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[85vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Add New Student</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddStudent} className="space-y-4 p-4">
                                        <div>
                                            <Label htmlFor="student_id">Student ID *</Label>
                                            <Input 
                                                id="student_id" 
                                                value={data.student_id} 
                                                onChange={e => setData('student_id', e.target.value)} 
                                                placeholder="e.g., 230000001763"
                                                required
                                            />
                                            <InputError message={errors.student_id} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="rfid_uid">RFID UID (Optional)</Label>
                                            <Input 
                                                id="rfid_uid" 
                                                type="password"
                                                value={data.rfid_uid} 
                                                onChange={e => setData('rfid_uid', e.target.value)} 
                                                placeholder="e.g., 22452647"
                                            />
                                            <InputError message={errors.rfid_uid} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="first_name">First Name *</Label>
                                            <Input 
                                                id="first_name" 
                                                value={data.first_name} 
                                                onChange={e => setData('first_name', e.target.value)} 
                                                placeholder="e.g., Juan"
                                                required
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="last_name">Last Name *</Label>
                                            <Input 
                                                id="last_name" 
                                                value={data.last_name} 
                                                onChange={e => setData('last_name', e.target.value)} 
                                                placeholder="e.g., Dela Cruz"
                                                required
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="middle_initial">Middle Initial</Label>
                                            <Input 
                                                id="middle_initial" 
                                                value={data.middle_initial} 
                                                onChange={e => setData('middle_initial', e.target.value)} 
                                                placeholder="e.g., P"
                                                maxLength={50}
                                            />
                                            <InputError message={errors.middle_initial} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="year">Year Level *</Label>
                                            <Select 
                                                value={data.year.toString()} 
                                                onValueChange={(value) => setData('year', parseInt(value))}
                                            >
                                                <SelectTrigger id="year">
                                                    <SelectValue placeholder="Select year level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1st Year</SelectItem>
                                                    <SelectItem value="2">2nd Year</SelectItem>
                                                    <SelectItem value="3">3rd Year</SelectItem>
                                                    <SelectItem value="4">4th Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.year} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="sec">Section *</Label>
                                            <Select 
                                                value={data.sec} 
                                                onValueChange={(value) => setData('sec', value)}
                                            >
                                                <SelectTrigger id="sec">
                                                    <SelectValue placeholder="Select section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sections.map(section => (
                                                        <SelectItem key={section} value={section}>
                                                            {section}
                                                        </SelectItem>
                                                    ))}
                                                    {/* Common fallback sections if sections list is empty */}
                                                    {sections.length === 0 && (
                                                        <>
                                                            <SelectItem value="BM1">BM1</SelectItem>
                                                            <SelectItem value="BM2">BM2</SelectItem>
                                                            <SelectItem value="BM3">BM3</SelectItem>
                                                            <SelectItem value="BM4-IC">BM4-IC</SelectItem>
                                                            <SelectItem value="BM4-Req-VC-App">BM4-Req-VC-App</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.sec} />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="mtl_time_remaining">MTL Session Time (minutes)</Label>
                                            <Input 
                                                id="mtl_time_remaining" 
                                                type="number"
                                                value={480} 
                                                readOnly
                                                disabled
                                                className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Default: 480 minutes (8 hours) - This value is fixed for all new students
                                            </p>
                                            <InputError message={errors.mtl_time_remaining} />
                                        </div>
                                        
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={processing}>
                                                {processing ? 'Adding...' : 'Add Student'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Student List Section */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2 flex items-center justify-between">
                        <span>Student List</span>
                        {canManageStudents && (
                            <Button 
                                onClick={handleSyncExternalStudents}
                                disabled={isSyncing}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Syncing...' : 'Sync from API'}
                            </Button>
                        )}
                    </h2>
                </div>

                <Card>
                    <CardContent className="pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {canManageStudents && (
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedStudentIds.length === students.data.length && students.data.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead>STUDENT ID</TableHead>
                                    <TableHead>NAME</TableHead>
                                    <TableHead>YR&SEC</TableHead>
                                    <TableHead>REMAINING MTL SESSION TIME</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.data.map((student) => (
                                    <TableRow key={student.student_id} className={getRowClass(student.mtl_time_remaining)}>
                                        {canManageStudents && (
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudentIds.includes(student.student_id)}
                                                    onCheckedChange={(checked) => handleSelectStudent(student.student_id, checked as boolean)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>{student.student_id}</TableCell>
                                        <TableCell>{`${student.last_name}, ${student.first_name}${student.middle_initial ? ` ${student.middle_initial}.` : ''}`}</TableCell>
                                        <TableCell>{`${student.year}-${student.sec}`}</TableCell>
                                        <TableCell>{`${Math.floor(student.mtl_time_remaining / 60)}hr ${student.mtl_time_remaining % 60}mins`}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-center items-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationFirst onClick={() => handlePageChange(1)} disabled={students.current_page === 1} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationPrevious onClick={() => handlePageChange(students.current_page - 1)} disabled={students.current_page === 1} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-2">{students.current_page} of {students.last_page}</span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext onClick={() => handlePageChange(students.current_page + 1)} disabled={students.current_page === students.last_page} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLast onClick={() => handlePageChange(students.last_page)} disabled={students.current_page === students.last_page} />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>

                {/* Sync Success Modal */}
                <SuccessModal
                    isOpen={showSyncSuccessModal}
                    onClose={() => setShowSyncSuccessModal(false)}
                    title="Sync Successful"
                    message="Student data has been successfully synchronized from the external API."
                />

                {/* Sync Error Modal */}
                <FailureModal
                    isOpen={showSyncErrorModal}
                    onClose={() => setShowSyncErrorModal(false)}
                    errorMessage={syncErrorMessage}
                    studentDetails={{ studentId: '', name: '', availableTime: '' }}
                />

                {/* Add Student Success Modal */}
                <SuccessModal
                    isOpen={showAddSuccessModal}
                    onClose={() => setShowAddSuccessModal(false)}
                    title="Student Added Successfully"
                    message={flash?.success || "The student has been added to the system."}
                />

                {/* Add Student Error Modal */}
                <FailureModal
                    isOpen={showAddErrorModal}
                    onClose={() => setShowAddErrorModal(false)}
                    errorMessage={addErrorMessage}
                    studentDetails={{ studentId: '', name: '', availableTime: '' }}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                                <DialogTitle>Confirm Delete</DialogTitle>
                            </div>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                                    ⚠️ Warning: This action cannot be undone!
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    You are about to delete <span className="font-bold">{selectedStudentIds.length}</span> student{selectedStudentIds.length > 1 ? 's' : ''} from the system.
                                </p>
                            </div>
                            
                            <div>
                                <Label htmlFor="delete-confirmation">
                                    Type <span className="font-bold text-red-600">Delete Student</span> to confirm:
                                </Label>
                                <Input
                                    id="delete-confirmation"
                                    value={deleteConfirmationText}
                                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                    placeholder="Delete Student"
                                    className="mt-2"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isDeleting}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={deleteConfirmationText !== 'Delete Student' || isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Student(s)'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}