import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string; // Make message optional
  type?: 'booking' | 'timeout'; // Add type prop to distinguish between booking and timeout
  title?: string; // Custom title prop
  bookingDetails?: {
    reference: string;
    name: string;
    idNumber: string;
    cubicleType?: string;
    cubicleNo?: number | string;
    instrumentType?: string;
    instrumentNo?: number | string;
    toolType?: string;
    toolNo?: number | string;
    instruments?: Array<{ category: string; code: string }>;
    tools?: Array<{ category: string; code: string }>;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message, type = 'booking', title, bookingDetails }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden rounded-[24px]">
        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-6 sm:p-10 text-center opacity-0 animate-fadeInUp overflow-y-auto max-h-[90vh]">
          
          {/* Icon */}
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e0f8f1] animate-popIn flex-shrink-0">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#1abc9c]">
              ✓
            </div>
          </div>

          {/* Reference */}
          <DialogTitle asChild>
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#343a40] dark:text-white break-words">
              {title || (bookingDetails ? (type === 'timeout' ? 'Successfully Timed Out!' : 'Successfully Booked') : 'Success!')}
            </h2>
          </DialogTitle>
          {bookingDetails?.name && <p className="text-[14px] sm:text-[16px] font-medium text-gray-500 dark:text-gray-300 mt-4 break-words">
            {bookingDetails.name}
          </p>}

          {/* Only show hr line for booking/timeout types with details */}
          {bookingDetails && (type === 'booking' || type === 'timeout') && (
            <hr className="border-t border-gray-200 dark:border-gray-600 my-6 sm:my-8" />
          )}

          {/* Message for simple success modals */}
          {!bookingDetails && message && (
            <p className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 mt-4 mb-6 sm:mb-8 whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </p>
          )}

          {/* Details */}
          {bookingDetails && type === 'booking' && (
            <div className="space-y-3 text-left mb-6 sm:mb-8 max-h-[400px] overflow-y-auto pr-2">
              <div className="flex justify-between items-start py-2 gap-4">
                <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Name</span>
                <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-start py-2 gap-4">
                <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Id Number</span>
                <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails?.idNumber || 'N/A'}</span>
              </div>
              {bookingDetails?.cubicleType && (
                <div className="flex justify-between items-start py-2 gap-4">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Cubicle Type</span>
                  <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails.cubicleType}</span>
                </div>
              )}
              {bookingDetails?.cubicleNo && (
                <div className="flex justify-between items-start py-2 gap-4">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Cubicle No.</span>
                  <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails.cubicleNo}</span>
                </div>
              )}
              {bookingDetails?.instruments && bookingDetails.instruments.length > 0 && (
                <div className="py-2">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 block mb-2">Instruments ({bookingDetails.instruments.length})</span>
                  <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-gray-50 dark:bg-gray-700">
                    <ul className="space-y-2">
                      {bookingDetails.instruments.map((item, index) => (
                        <li key={index} className="py-2 px-2 border-b last:border-b-0 dark:border-gray-600">
                          <div className="text-[13px] sm:text-[14px] font-semibold text-[#343a40] dark:text-white break-words">{item.category}</div>
                          <div className="text-[12px] sm:text-[13px] text-gray-600 dark:text-gray-400 break-all">{item.code}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {bookingDetails?.tools && bookingDetails.tools.length > 0 && (
                <div className="py-2">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 block mb-2">Tools ({bookingDetails.tools.length})</span>
                  <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-gray-50 dark:bg-gray-700">
                    <ul className="space-y-2">
                      {bookingDetails.tools.map((item, index) => (
                        <li key={index} className="py-2 px-2 border-b last:border-b-0 dark:border-gray-600">
                          <div className="text-[13px] sm:text-[14px] font-semibold text-[#343a40] dark:text-white break-words">{item.category}</div>
                          <div className="text-[12px] sm:text-[13px] text-gray-600 dark:text-gray-400 break-all">{item.code}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {bookingDetails?.instrumentType && (
                <div className="flex justify-between items-start py-2 gap-4">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Instrument Type</span>
                  <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails.instrumentType}</span>
                </div>
              )}
              {bookingDetails?.instrumentNo && (
                <div className="flex justify-between items-start py-2 gap-4">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Instrument No.</span>
                  <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails.instrumentNo}</span>
                </div>
              )}
              {bookingDetails?.toolType && (
                <div className="flex justify-between items-start py-2 gap-4">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Tool Type</span>
                  <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails.toolType}</span>
                </div>
              )}
              {bookingDetails?.toolNo && (
                <div className="flex justify-between items-start py-2 gap-4">
                  <span className="text-[14px] sm:text-[16px] text-gray-500 dark:text-gray-300 flex-shrink-0">Tool No.</span>
                  <span className="text-[14px] sm:text-[16px] font-semibold text-[#343a40] dark:text-white text-right break-words">{bookingDetails.toolNo}</span>
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <button onClick={onClose} className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl text-white bg-[#1abc9c] transition duration-300 ease-in-out hover:bg-[#16a085] hover:-translate-y-0.5 flex-shrink-0">
            CONFIRM
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;