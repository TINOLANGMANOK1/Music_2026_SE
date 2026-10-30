import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import InputError from '@/components/input-error';

interface Student {
    student_id: string;
    first_name: string;
    last_name: string;
    middle_initial?: string;
    year: number;
    sec: string;
    mtl_time_remaining: number;
}

interface ResetMTLTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ResetMTLTimeModal: React.FC<ResetMTLTimeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const [resetType, setResetType] = useState<'all' | 'specific'>('all');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmationText, setConfirmationText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch students when modal opens and specific is selected
    useEffect(() => {
        if (isOpen && resetType === 'specific' && students.length === 0) {
            fetchStudents();
        }
    }, [isOpen, resetType]);

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students/all');
            const data = await response.json();
            setStudents(data);
        } catch (err) {
            setError('Failed to load students');
        }
    };

    const filteredStudents = students.filter(student => {
        const fullName = `${student.last_name}, ${student.first_name} ${student.middle_initial || ''}`.toLowerCase();
        const studentId = student.student_id.toLowerCase();
        const search = searchQuery.toLowerCase();
        return fullName.includes(search) || studentId.includes(search);
    });

    const handleStudentToggle = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.student_id));
        }
    };

    const handleNext = () => {
        if (resetType === 'specific' && selectedStudents.length === 0) {
            setError('Please select at least one student');
            return;
        }
        setError('');
        setStep('confirm');
    };

    const handleBack = () => {
        setStep('select');
        setConfirmationText('');
        setError('');
    };

    const handleConfirm = () => {
        if (confirmationText !== 'Reset MTL Time') {
            setError('Please type "Reset MTL Time" exactly to confirm');
            return;
        }

        setIsLoading(true);
        router.post('/mtl-time/reset', {
            reset_type: resetType,
            student_ids: resetType === 'specific' ? selectedStudents : [],
        }, {
            onSuccess: () => {
                setIsLoading(false);
                resetModal();
                if (onSuccess) {
                    onSuccess();
                }
            },
            onError: (errors: any) => {
                setIsLoading(false);
                setError(errors.message || 'Failed to reset MTL time');
            },
        });
    };

    const resetModal = () => {
        setStep('select');
        setResetType('all');
        setSelectedStudents([]);
        setSearchQuery('');
        setConfirmationText('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetModal}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'select' ? 'Reset MTL Time' : 'Confirm Reset'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'select' && (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-3">
                            <Label>Choose who to reset:</Label>
                            <RadioGroup value={resetType} onValueChange={(value: 'all' | 'specific') => setResetType(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="all" />
                                    <Label htmlFor="all" className="cursor-pointer font-normal">
                                        Reset All Students
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="specific" id="specific" />
                                    <Label htmlFor="specific" className="cursor-pointer font-normal">
                                        Reset Specific Students
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {resetType === 'specific' && (
                            <div className="space-y-3">
                                <div>
                                    <Input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div className="border rounded-lg p-3 max-h-[300px] overflow-y-auto">
                                    <div className="flex items-center space-x-2 pb-2 mb-2 border-b">
                                        <Checkbox
                                            id="select-all"
                                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <Label htmlFor="select-all" className="cursor-pointer font-medium">
                                            Select All ({selectedStudents.length} selected)
                                        </Label>
                                    </div>

                                    {filteredStudents.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No students found
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredStudents.map((student) => (
                                                <div key={student.student_id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                                                    <Checkbox
                                                        id={student.student_id}
                                                        checked={selectedStudents.includes(student.student_id)}
                                                        onCheckedChange={() => handleStudentToggle(student.student_id)}
                                                    />
                                                    <Label htmlFor={student.student_id} className="cursor-pointer flex-1 font-normal">
                                                        <div className="flex justify-between items-center">
                                                            <span>
                                                                {student.last_name}, {student.first_name} {student.middle_initial}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {student.student_id} | {student.year}-{student.sec}
                                                            </span>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && <InputError message={error} />}
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                                        Warning: This action cannot be undone!
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        {resetType === 'all'
                                            ? 'You are about to reset MTL time for ALL students to 480 minutes (8 hours).'
                                            : `You are about to reset MTL time for ${selectedStudents.length} selected student(s) to 480 minutes (8 hours).`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmation">
                                Type <span className="font-bold text-destructive">Reset MTL Time</span> to confirm:
                            </Label>
                            <Input
                                id="confirmation"
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                placeholder="Reset MTL Time"
                                className={confirmationText && confirmationText !== 'Reset MTL Time' ? 'border-destructive' : ''}
                            />
                            {error && <InputError message={error} />}
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {step === 'select' ? (
                        <>
                            <Button variant="outline" onClick={resetModal}>
                                Cancel
                            </Button>
                            <Button onClick={handleNext}>
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={confirmationText !== 'Reset MTL Time' || isLoading}
                                variant="destructive"
                            >
                                {isLoading ? 'Resetting...' : 'Reset MTL Time'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ResetMTLTimeModal;
