import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SimpleTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimpleTimeoutModal: React.FC<SimpleTimeoutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center opacity-0 animate-fadeInUp">
          
          {/* Icon */}
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e0f8f1] animate-popIn">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#1abc9c]">
              ✓
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Successfully Timed Out!</h1>

          {/* Confirm Button */}
          <button onClick={onClose} className="w-full py-4 text-lg font-semibold rounded-xl text-white bg-[#1abc9c] transition duration-300 ease-in-out hover:bg-[#16a085] hover:-translate-y-0.5 mt-8">
            CONFIRM
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleTimeoutModal;
