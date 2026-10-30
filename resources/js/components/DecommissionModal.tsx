import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Upload, X, FileText, Calendar } from 'lucide-react';
import ErrorModal from '@/components/ErrorModal';

interface DecommissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, documentFile: File | null) => void;
    assetName: string;
}

export default function DecommissionModal({ isOpen, onClose, onConfirm, assetName }: DecommissionModalProps) {
    const [reason, setReason] = useState('');
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentPreview, setDocumentPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: ''
    });

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                setErrorModal({
                    isOpen: true,
                    message: 'File size should be less than 10MB. Please choose a smaller file.'
                });
                return;
            }

            // Check file type (PDF or images)
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setErrorModal({
                    isOpen: true,
                    message: 'Please upload only PDF or image files (JPEG, JPG, PNG).'
                });
                return;
            }

            setDocumentFile(file);
            setFileName(file.name);

            // If it's an image, show preview
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setDocumentPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setDocumentPreview(null); // For PDFs, we'll just show the filename
            }
        }
    };

    const handleRemoveDocument = () => {
        setDocumentFile(null);
        setDocumentPreview(null);
        setFileName(null);
    };

    const handleSubmit = () => {
        if (!reason.trim()) {
            setErrorModal({
                isOpen: true,
                message: 'Please provide a reason for disposing this item. This information is required for record-keeping purposes.'
            });
            return;
        }
        if (!documentFile) {
            setErrorModal({
                isOpen: true,
                message: 'Please upload the disposal form document. A signed disposal form from the Property Custodian is required to complete this process.'
            });
            return;
        }
        onConfirm(reason, documentFile);
        // Reset form
        setReason('');
        setDocumentFile(null);
        setDocumentPreview(null);
        setFileName(null);
    };

    const handleCancel = () => {
        setReason('');
        setDocumentFile(null);
        setDocumentPreview(null);
        setFileName(null);
        onClose();
    };

    const currentDateTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleCancel}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Dispose Item</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            This item will be moved to disposal history and removed from active inventory
                        </p>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Asset Info */}
                        <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium">Item: <span className="font-semibold">{assetName}</span></p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Disposal Date: {currentDateTime}</span>
                            </div>
                        </div>

                        {/* Reason Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="reason">
                                Reason for Disposal <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Describe why this item is being disposed (e.g., damaged beyond repair, obsolete, end of service life)..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Provide detailed information about the disposal decision
                            </p>
                        </div>

                        {/* Document Upload */}
                        <div className="grid gap-2">
                            <Label htmlFor="document">
                                Disposal Form <span className="text-red-500">*</span>
                            </Label>
                            {!documentFile ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="document"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleDocumentChange}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById('document')?.click()}
                                        className="w-full"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Document
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {documentPreview ? (
                                        // Image preview
                                        <div className="relative">
                                            <img
                                                src={documentPreview}
                                                alt="Document Preview"
                                                className="w-full h-48 object-cover rounded-md border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={handleRemoveDocument}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        // PDF file display
                                        <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-red-600" />
                                                <span className="text-sm font-medium">{fileName}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleRemoveDocument}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload the signed disposal form from Property Custodian (PDF or image, max 10MB)
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            className="bg-gray-600 hover:bg-gray-700 text-white"
                        >
                            Dispose Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ isOpen: false, message: '' })}
                title="Validation Error"
                message={errorModal.message}
            />
        </>
    );
}
