import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import SuccessModal from '@/components/SuccessModal';
import ErrorModal from '@/components/ErrorModal';
import { Eye, EyeOff } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'Student Assistant', // Default role
    phone: '',
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [newUserDetails, setNewUserDetails] = useState<{ name: string; email: string; } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/users', {
      onSuccess: (page) => {
        setSuccessMessage(page.props.flash?.success || 'User added successfully!');
        setNewUserDetails({ name: data.name, email: data.email });
        setShowSuccessModal(true);
        reset();
        onClose(); // Close the AddUserModal
      },
      onError: (errors) => {
        setErrorMessage(errors.message || 'Failed to add user. Please check the form for errors.');
        setShowErrorModal(true);
      },
    });
  };

  const handleCloseFeedbackModals = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setSuccessMessage('');
    setErrorMessage('');
    setNewUserDetails(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
              <InputError message={errors.name} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
              <InputError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={data.password} onChange={e => setData('password', e.target.value)} className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <InputError message={errors.password} />
            </div>
            <div>
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <div className="relative">
                <Input id="password_confirmation" type={showConfirmPassword ? "text" : "password"} value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <InputError message={errors.password_confirmation} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={value => setData('role', value)} value={data.role}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Music Dean">Music Dean</SelectItem>
                  <SelectItem value="Student Assistant">Student Assistant</SelectItem>
                  <SelectItem value="Student Panel">Student Panel</SelectItem>
                </SelectContent>
              </Select>
              <InputError message={errors.role} />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} />
              <InputError message={errors.phone} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={processing}>Add User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseFeedbackModals}
        message={successMessage}
        title="Successfully Created"
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={handleCloseFeedbackModals}
        title="Failed to Add User"
        message={errorMessage}
      />
    </>
  );
};

export default AddUserModal;
