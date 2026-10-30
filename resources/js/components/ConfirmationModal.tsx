import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ReactNode } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | ReactNode;
    confirmDisabled?: boolean;
    isLoading?: boolean;
    confirmText?: string;
    loadingText?: string;
}

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmDisabled = false,
    isLoading = false,
    confirmText = 'Confirm',
    loadingText = 'Processing...'
}: ConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground" asChild>
                        <div>{message}</div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Back
                    </Button>
                    <Button 
                        type="button" 
                        onClick={onConfirm}
                        disabled={confirmDisabled || isLoading}
                        className="bg-[#FF6692] hover:bg-[#FF5280] text-white"
                    >
                        {isLoading ? loadingText : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}