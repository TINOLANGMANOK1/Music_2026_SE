import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface UnrecognizedStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId?: string;
}

const UnrecognizedStudentModal: React.FC<UnrecognizedStudentModalProps> = ({
    isOpen,
    onClose,
    studentId
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <DialogTitle className="text-xl">Student ID Not Recognized</DialogTitle>
                    </div>
                    <DialogDescription>
                        We couldn't find your student information in our system
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            This could mean:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                                <span>You are a Music student, but your ID is not validated yet</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                                <span>You are not a Music student</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            What to do:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            If you're a Music student, please visit the Music Department office to have your ID validated and registered in the system.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UnrecognizedStudentModal;
