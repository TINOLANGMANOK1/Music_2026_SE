import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';

interface Student {
    student_id: string;
    first_name: string;
    last_name: string;
    middle_initial?: string;
    year: number;
    sec: string;
}

interface StudentSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStudent: (student: Student) => void;
}

const StudentSelectorModal: React.FC<StudentSelectorModalProps> = ({ isOpen, onClose, onSelectStudent }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setStudents([]);
            return;
        }

        if (searchQuery.length > 2) { // Only search if query is at least 3 characters
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                // This would ideally be an API call to a dedicated student search endpoint
                // For now, we'll simulate or use a direct Inertia visit if student data is always loaded
                // For a real app, you'd create a separate API route for student search
                fetch(`/api/students?search=${searchQuery}`)
                    .then(response => response.json())
                    .then(data => {
                        // Assuming data is an array of students
                        setStudents(data.data || data);
                    })
                    .catch(error => console.error('Error fetching students:', error));
            }, 300);
        } else {
            setStudents([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select Student</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        placeholder="Search student by ID or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="mt-4 max-h-60 overflow-y-auto">
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
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <TableRow key={student.student_id}>
                                            <TableCell>{student.student_id}</TableCell>
                                            <TableCell>{`${student.last_name}, ${student.first_name}`}</TableCell>
                                            <TableCell>{`${student.year}-${student.sec}`}</TableCell>
                                            <TableCell>
                                                <Button onClick={() => onSelectStudent(student)}>Select</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No students found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StudentSelectorModal;
