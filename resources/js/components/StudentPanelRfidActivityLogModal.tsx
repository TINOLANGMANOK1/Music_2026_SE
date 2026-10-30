import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import RfidValidationFailureModal from './RfidValidationFailureModal';

interface StudentPanelRfidActivityLogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StudentPanelRfidActivityLogModal({ isOpen, onClose }: StudentPanelRfidActivityLogModalProps) {
    const [showFailure, setShowFailure] = useState(false);
    const [isWaitingForRfid, setIsWaitingForRfid] = useState(false);

    const handleRfidScan = () => {
        setIsWaitingForRfid(true);
        // This will be handled by the RFID scanner context
        // For now, we'll show a message
    };

    const handleUnrecognizedRfid = () => {
        setIsWaitingForRfid(false);
        setShowFailure(true);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Check Activity Log</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center py-8 space-y-6">
                        {!isWaitingForRfid ? (
                            <>
                                <CreditCard className="h-24 w-24 text-blue-500" />
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">View Your Activity</h3>
                                    <p className="text-muted-foreground">
                                        Please tap your RFID card to view your personal activity log
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full max-w-xs"
                                    onClick={handleRfidScan}
                                >
                                    Tap RFID Card
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="animate-pulse">
                                    <CreditCard className="h-24 w-24 text-blue-500" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Waiting for RFID...</h3>
                                    <p className="text-muted-foreground">
                                        Please tap your RFID card on the scanner
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsWaitingForRfid(false)}
                                >
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <RfidValidationFailureModal
                isOpen={showFailure}
                onClose={() => {
                    setShowFailure(false);
                    onClose();
                }}
            />
        </>
    );
}
