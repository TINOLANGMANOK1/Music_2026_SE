import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title = 'Error!', message }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden rounded-[24px]">
        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-6 sm:p-10 text-center opacity-0 animate-fadeInUp overflow-y-auto max-h-[90vh]">
          
          {/* Icon */}
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#ffebee] animate-shake flex-shrink-0">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-[28px] font-bold bg-[#e74c3c]">
              !
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[24px] sm:text-[28px] font-bold text-[#e74c3c] mb-6 break-words">{title}</h2>
          <p className="text-[14px] sm:text-[16px] font-medium text-gray-500 dark:text-gray-300 mb-8 sm:mb-12 whitespace-pre-wrap break-words leading-relaxed">
            {message}
          </p>

          {/* Confirm Button */}
          <button
            className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl text-white bg-[#e74c3c] transition duration-300 ease-in-out hover:bg-[#c0392b] hover:-translate-y-0.5 flex-shrink-0"
            onClick={onClose}
          >
            CLOSE
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorModal;
