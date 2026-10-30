import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface LogoutSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
}

const LogoutSuccessModal: React.FC<LogoutSuccessModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const handleClose = () => {
        // Execute logout regardless of how modal is closed
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
                <DialogTitle className="sr-only">Successfully Logged Out</DialogTitle>
                <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center opacity-0 animate-fadeInUp">
                    
                    {/* Icon */}
                    <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e0f8f1] animate-popIn">
                        <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#1abc9c]">
                            ✓
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Successfully Logged Out!</h1>

                    {/* Confirm Button */}
                    <Button 
                        onClick={handleClose}
                        className="w-full py-6 px-4 text-lg font-semibold rounded-lg text-white bg-[#1abc9c] transition duration-300 ease-in-out hover:bg-[#16a085] hover:-translate-y-0.5"
                    >
                        CONFIRM
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LogoutSuccessModal;
