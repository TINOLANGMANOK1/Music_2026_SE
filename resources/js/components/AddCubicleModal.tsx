import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface Cubicle {
    cubicle_id: number;
    cubicle_type_id: number;
    cubicle_type: string;
    cubicle_no: number;
    status: string;
}

interface AddCubicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    cubicles?: Cubicle[];
}

export default function AddCubicleModal({ isOpen, onClose, cubicles = [] }: AddCubicleModalProps) {
    const [formData, setFormData] = useState({
        cubicle_type: 'Guitar',
        status: 'Available',
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    // Calculate the next cubicle number for the selected type
    const nextCubicleNumber = useMemo(() => {
        const currentCubicles = cubicles.filter(c => c.cubicle_type === formData.cubicle_type);
        if (currentCubicles.length === 0) return 1;
        const maxNumber = Math.max(...currentCubicles.map(c => c.cubicle_no));
        return maxNumber + 1;
    }, [formData.cubicle_type, cubicles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/manage-cubicles', formData, {
            onSuccess: () => {
                setFormData({
                    cubicle_type: 'Guitar',
                    status: 'Available',
                });
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
                    <DialogTitle>Add New Cubicle</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new cubicle
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cubicle_no">Cubicle Number</Label>
                            <Input
                                id="cubicle_no"
                                type="number"
                                value={nextCubicleNumber}
                                disabled
                                className="bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Automatically assigned based on cubicle type.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cubicle_type">Cubicle Type *</Label>
                            <Select
                                value={formData.cubicle_type}
                                onValueChange={(value) => setFormData({ ...formData, cubicle_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Guitar">Guitar</SelectItem>
                                    <SelectItem value="Piano">Piano</SelectItem>
                                    <SelectItem value="MTL">MTL</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.cubicle_type && (
                                <p className="text-sm text-red-500">{errors.cubicle_type}</p>
                            )}
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

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="bg-[#FF6692] hover:bg-[#FF5280] text-white"
                        >
                            {processing ? 'Adding...' : 'Add Cubicle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
