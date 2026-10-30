import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface RfidValidationFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RfidValidationFailureModal: React.FC<RfidValidationFailureModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[24px]">
        <div className="bg-white dark:bg-gray-800 shadow-2xl w-full p-10 text-center opacity-0 animate-fadeInUp">
          
          {/* Icon */}
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mx-auto mb-5 bg-[#fff3cd] animate-shake">
            <AlertCircle className="h-10 w-10 text-[#ff9800]" />
          </div>

          {/* Title */}
          <h2 className="text-[28px] font-bold text-[#ff9800] mb-4">RFID Not Validated</h2>

          {/* Message */}
          <p className="text-[16px] text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Your RFID card is not yet validated in the system. Please validate your student ID on the MIS (Management Information System) first.
          </p>

          {/* Button */}
          <Button
            onClick={onClose}
            className="w-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RfidValidationFailureModal;
