import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { type BookingResult } from '@/types';
import React from 'react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue?: () => void;
    message?: string; // Make message optional
    type?: 'booking' | 'timeout'; // Add type prop to distinguish between booking and timeout
    title?: string; // Custom title prop
    bookingDetails?: BookingResult;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onContinue, message, type = 'booking', title, bookingDetails }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-hidden rounded-[24px] p-0 sm:max-w-[500px]">
                <div className="animate-fadeInUp max-h-[90vh] w-full overflow-y-auto bg-white p-6 text-center opacity-0 shadow-2xl sm:p-10 dark:bg-gray-800">
                    {/* Icon */}
                    <div className="animate-popIn mx-auto mb-5 flex h-[70px] w-[70px] flex-shrink-0 items-center justify-center rounded-full bg-[#e0f8f1]">
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#1abc9c] text-[28px] font-bold text-white">
                            ✓
                        </div>
                    </div>

                    {/* Reference */}
                    <DialogTitle asChild>
                        <h2 className="text-[24px] font-bold break-words text-[#343a40] sm:text-[28px] dark:text-white">
                            {title || (bookingDetails ? (type === 'timeout' ? 'Successfully Timed Out!' : 'Successfully Booked') : 'Success!')}
                        </h2>
                    </DialogTitle>
                    {bookingDetails?.name && (
                        <p className="mt-4 text-[14px] font-medium break-words text-gray-500 sm:text-[16px] dark:text-gray-300">
                            {bookingDetails.name}
                        </p>
                    )}

                    {/* Only show hr line for booking/timeout types with details */}
                    {bookingDetails && (type === 'booking' || type === 'timeout') && (
                        <hr className="my-6 border-t border-gray-200 sm:my-8 dark:border-gray-600" />
                    )}

                    {/* Message for simple success modals */}
                    {!bookingDetails && message && (
                        <p className="mt-4 mb-6 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-gray-500 sm:mb-8 sm:text-[16px] dark:text-gray-300">
                            {message}
                        </p>
                    )}

                    {/* Details */}
                    {bookingDetails && type === 'booking' && (
                        <div className="mb-6 max-h-[400px] space-y-3 overflow-y-auto pr-2 text-left sm:mb-8">
                            <div className="flex items-start justify-between gap-4 py-2">
                                <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Name</span>
                                <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                    {bookingDetails?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-4 py-2">
                                <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Id Number</span>
                                <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                    {bookingDetails?.idNumber || 'N/A'}
                                </span>
                            </div>
                            {bookingDetails?.cubicleType && (
                                <div className="flex items-start justify-between gap-4 py-2">
                                    <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Cubicle Type</span>
                                    <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                        {bookingDetails.cubicleType}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.cubicleNo && (
                                <div className="flex items-start justify-between gap-4 py-2">
                                    <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Cubicle No.</span>
                                    <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                        {bookingDetails.cubicleNo}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.instruments && bookingDetails.instruments.length > 0 && (
                                <div className="py-2">
                                    <span className="mb-2 block text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">
                                        Instruments ({bookingDetails.instruments.length})
                                    </span>
                                    <div className="max-h-[200px] overflow-y-auto rounded-md border bg-gray-50 p-3 dark:bg-gray-700">
                                        <ul className="space-y-2">
                                            {bookingDetails.instruments.map((item, index) => (
                                                <li key={index} className="border-b px-2 py-2 last:border-b-0 dark:border-gray-600">
                                                    <div className="text-[13px] font-semibold break-words text-[#343a40] sm:text-[14px] dark:text-white">
                                                        {item.category}
                                                    </div>
                                                    <div className="text-[12px] break-all text-gray-600 sm:text-[13px] dark:text-gray-400">
                                                        {item.code}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {bookingDetails?.tools && bookingDetails.tools.length > 0 && (
                                <div className="py-2">
                                    <span className="mb-2 block text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">
                                        Tools ({bookingDetails.tools.length})
                                    </span>
                                    <div className="max-h-[200px] overflow-y-auto rounded-md border bg-gray-50 p-3 dark:bg-gray-700">
                                        <ul className="space-y-2">
                                            {bookingDetails.tools.map((item, index) => (
                                                <li key={index} className="border-b px-2 py-2 last:border-b-0 dark:border-gray-600">
                                                    <div className="text-[13px] font-semibold break-words text-[#343a40] sm:text-[14px] dark:text-white">
                                                        {item.category}
                                                    </div>
                                                    <div className="text-[12px] break-all text-gray-600 sm:text-[13px] dark:text-gray-400">
                                                        {item.code}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {bookingDetails?.instrumentType && (
                                <div className="flex items-start justify-between gap-4 py-2">
                                    <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Instrument Type</span>
                                    <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                        {bookingDetails.instrumentType}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.instrumentNo && (
                                <div className="flex items-start justify-between gap-4 py-2">
                                    <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Instrument No.</span>
                                    <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                        {bookingDetails.instrumentNo}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.toolType && (
                                <div className="flex items-start justify-between gap-4 py-2">
                                    <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Tool Type</span>
                                    <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                        {bookingDetails.toolType}
                                    </span>
                                </div>
                            )}
                            {bookingDetails?.toolNo && (
                                <div className="flex items-start justify-between gap-4 py-2">
                                    <span className="flex-shrink-0 text-[14px] text-gray-500 sm:text-[16px] dark:text-gray-300">Tool No.</span>
                                    <span className="text-right text-[14px] font-semibold break-words text-[#343a40] sm:text-[16px] dark:text-white">
                                        {bookingDetails.toolNo}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {onContinue && (
                        <button
                            onClick={onContinue}
                            className="mb-3 w-full flex-shrink-0 rounded-xl border border-[#1abc9c] py-3 text-base font-semibold text-[#16a085] transition duration-300 ease-in-out hover:bg-[#e0f8f1] sm:py-4 sm:text-lg dark:hover:bg-gray-700"
                        >
                            ADD ANOTHER ACTION
                        </button>
                    )}

                    {/* Confirm Button */}
                    <button
                        onClick={onClose}
                        className="w-full flex-shrink-0 rounded-xl bg-[#1abc9c] py-3 text-base font-semibold text-white transition duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-[#16a085] sm:py-4 sm:text-lg"
                    >
                        CONFIRM
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SuccessModal;
