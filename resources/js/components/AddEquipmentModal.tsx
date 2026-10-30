import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddEquipmentModal = ({ isOpen, onClose, onSuccess }: AddEquipmentModalProps) => {
  const [itemCategory, setItemCategory] = useState('instrument');
  const [instrumentType, setInstrumentType] = useState('');
  const [instrumentNo, setInstrumentNo] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = () => {
    const data = {
      item_category: itemCategory,
      instrument_type: instrumentType,
      instrument_no: instrumentNo,
      brand,
      description,
      barcode,
      image_url: imageUrl,
      status: 'Available',
    };

    router.post('/inventory', data, {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (errors) => {
        setErrors(errors);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="form-group">
            <Label htmlFor="item-category">Category</Label>
            <Select value={itemCategory} onValueChange={setItemCategory}>
              <SelectTrigger id="item-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instrument">Instrument</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="form-group">
            <Label htmlFor="instrument-type">Type</Label>
            <Input id="instrument-type" value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)} />
            {errors.instrument_type && <InputError message={errors.instrument_type} />}
          </div>
          <div className="form-group">
            <Label htmlFor="instrument-no">Number</Label>
            <Input id="instrument-no" value={instrumentNo} onChange={(e) => setInstrumentNo(e.target.value)} />
            {errors.instrument_no && <InputError message={errors.instrument_no} />}
          </div>
          <div className="form-group">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="form-group">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </div>
          <div className="form-group">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentModal;
