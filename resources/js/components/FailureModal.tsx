import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface FailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  studentDetails: {
    studentId: string;
    name: string;
    availableTime: string;
  };
}

const FailureModal: React.FC<FailureModalProps> = ({ isOpen, onClose, errorMessage, studentDetails }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center opacity-0 animate-fadeInUp">
          
          {/* Icon */}
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#ffebee] animate-shake">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#e74c3c]">
              !
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[28px] font-bold text-[#e74c3c] mb-4">Booking Failed!</h2>
          <p className="text-[16px] font-medium text-gray-500 dark:text-gray-300 mb-12">
            {errorMessage}
          </p>

          {/* Details */}
          {/* Removed studentDetails display as it's not relevant for generic failure */}

          {/* Confirm Button */}
          <button
            className="w-full py-4 text-lg font-semibold rounded-xl text-white bg-[#e74c3c] transition duration-300 ease-in-out hover:bg-[#c0392b] hover:-translate-y-0.5"
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