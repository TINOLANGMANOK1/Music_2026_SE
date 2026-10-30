import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface SuccessTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeoutDetails: {
    name: string;
    itemType: string;
    itemNo: number | string;
    timeIn: string;
    timeOut: string;
    duration: string;
  } | null;
}

const SuccessTimeoutModal: React.FC<SuccessTimeoutModalProps> = ({ isOpen, onClose, timeoutDetails }) => {
  if (!timeoutDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center opacity-0 animate-fadeInUp">
          
          {/* Icon - Using SuccessModal's icon design for consistency */}
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e0f8f1] animate-popIn">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#1abc9c]">
              ✓
            </div>
          </div>

          {/* Title Text */}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Successfully Timed Out!</h1>
          <p className="text-gray-500 dark:text-gray-300 text-lg mt-1">{timeoutDetails.name}</p>

          {/* Divider */}
          <hr className="my-8 border-gray-200 dark:border-gray-600" />

          {/* Details Section */}
          <div className="space-y-5 text-lg mb-10">
            <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-300">{timeoutDetails.itemType}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{timeoutDetails.itemNo}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-300">Time In</span>
                <span className="font-semibold text-gray-800 dark:text-white">{timeoutDetails.timeIn}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-300">Time Out</span>
                <span className="font-semibold text-gray-800 dark:text-white">{timeoutDetails.timeOut}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-300">Duration</span>
                <span className="font-semibold text-gray-800 dark:text-white">{timeoutDetails.duration}</span>
            </div>
          </div>

          {/* Confirm Button */}
          <button onClick={onClose} className="w-full py-4 text-lg font-semibold rounded-xl text-white bg-[#1abc9c] transition duration-300 ease-in-out hover:bg-[#16a085] hover:-translate-y-0.5">
            CONFIRM
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessTimeoutModal;
