import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Cubicle {
    cubicle_id: number;
    cubicle_type_id: number;
    cubicle_type: string;
    cubicle_no: number;
    status: string;
}

interface EditCubicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    cubicle: Cubicle;
    onDelete: () => void;
}

export default function EditCubicleModal({ isOpen, onClose, cubicle, onDelete }: EditCubicleModalProps) {
    const [formData, setFormData] = useState({
        status: cubicle.status,
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    // Update form data when cubicle changes
    useEffect(() => {
        setFormData({
            status: cubicle.status,
        });
    }, [cubicle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.put(`/manage-cubicles/${cubicle.cubicle_id}`, formData, {
            onSuccess: () => {
                setErrors({});
                onClose();
            },
            onError: (errors) => {
                setErrors(errors);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Cubicle</DialogTitle>
                    <DialogDescription>
                        Update the details for Cubicle {cubicle.cubicle_no}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cubicle_no">Cubicle Number</Label>
                            <Input
                                id="cubicle_no"
                                type="number"
                                value={cubicle.cubicle_no}
                                disabled
                                className="bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Cubicle numbers are automatically assigned and cannot be changed.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cubicle_type">Cubicle Type</Label>
                            <Input
                                id="cubicle_type"
                                type="text"
                                value={cubicle.cubicle_type}
                                disabled
                                className="bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Cubicle type cannot be changed after creation.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Instrument Under Repair">Instrument Under Repair</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-sm text-red-500">{errors.status}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={onDelete} 
                            disabled={processing}
                        >
                            Delete
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Cubicle'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
