import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type BookingFailureResult } from '@/types';
import React from 'react';

interface FailureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackToChoices?: () => void;
    errorMessage: string;
    studentDetails: BookingFailureResult['studentDetails'];
}

const FailureModal: React.FC<FailureModalProps> = ({ isOpen, onClose, onBackToChoices, errorMessage }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-hidden rounded-[24px] p-0 sm:max-w-[425px]">
                <div className="animate-fadeInUp w-full bg-white p-10 text-center opacity-0 shadow-2xl dark:bg-gray-800">
                    {/* Icon */}
                    <div className="animate-shake mx-auto mb-5 flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#ffebee]">
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#e74c3c] text-[28px] font-bold text-white">
                            !
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="mb-4 text-[28px] font-bold text-[#e74c3c]">Booking Failed!</h2>
                    <p className="mb-12 text-[16px] font-medium text-gray-500 dark:text-gray-300">{errorMessage}</p>

                    {onBackToChoices && (
                        <button
                            className="mb-3 w-full rounded-xl border border-gray-300 py-3 text-base font-semibold text-gray-700 transition duration-300 ease-in-out hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={onBackToChoices}
                        >
                            RETURN TO BOOKING OPTIONS
                        </button>
                    )}

                    {/* Details */}
                    {/* Removed studentDetails display as it's not relevant for generic failure */}

                    {/* Confirm Button */}
                    <button
                        className="w-full rounded-xl bg-[#e74c3c] py-4 text-lg font-semibold text-white transition duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-[#c0392b]"
                        onClick={onClose}
                    >
                        CONFIRM
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FailureModal;
