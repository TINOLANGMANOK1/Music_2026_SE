import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Mail,
    User,
    FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MTLBooking {
    id: number;
    name: string;
    email: string;
    date: string;
    start_time: string;
    end_time: string;
    purpose?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    created_at: string;
}

interface MTLApprovalsProps {
    pendingBookings: MTLBooking[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
}

export default function MTLApprovals({ pendingBookings, auth }: MTLApprovalsProps) {
    const [selectedBooking, setSelectedBooking] = useState<MTLBooking | null>(null);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = async (bookingId: number) => {
        try {
            const response = await fetch(`/mtl-booking/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    status: 'approved'
                })
            });

            const result = await response.json();

            if (response.ok) {
                router.reload();
            } else {
                alert(result.error || 'Failed to approve booking');
            }
        } catch (error) {
            console.error('Error approving booking:', error);
            alert('Failed to approve booking');
        }
    };

    const handleReject = async () => {
        if (!selectedBooking || !rejectionReason.trim()) return;

        try {
            const response = await fetch(`/mtl-booking/bookings/${selectedBooking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason
                })
            });

            const result = await response.json();

            if (response.ok) {
                setShowRejectionModal(false);
                setRejectionReason('');
                setSelectedBooking(null);
                router.reload();
            } else {
                alert(result.error || 'Failed to reject booking');
            }
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert('Failed to reject booking');
        }
    };

    const openRejectionModal = (booking: MTLBooking) => {
        setSelectedBooking(booking);
        setShowRejectionModal(true);
    };

    return (
        <AppLayout
            header={
                <div>
                    <h1 className="text-3xl font-bold mb-2">MTL Booking Approvals</h1>
                    <p className="text-gray-600">
                        Review and manage pending MTL booking requests
                    </p>
                </div>
            }
        >
            <Head title="MTL Booking Approvals" />

            <div className="space-y-6">
                {pendingBookings.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                All caught up!
                            </h3>
                            <p className="text-gray-500 text-center">
                                There are no pending MTL booking requests at the moment.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                    Pending Requests ({pendingBookings.length})
                                </CardTitle>
                                <CardDescription>
                                    MTL booking requests awaiting your approval
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pendingBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="p-6 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                                {booking.name}
                                                            </h3>
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Mail className="h-4 w-4" />
                                                                    <span>{booking.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>{format(parseISO(booking.date), 'MMM d, yyyy')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span>{booking.start_time} - {booking.end_time}</span>
                                                                </div>
                                                            </div>

                                                            {booking.purpose && (
                                                                <div className="mb-4">
                                                                    <div className="flex items-start gap-2 text-sm">
                                                                        <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                                                        <div>
                                                                            <span className="font-medium text-gray-700">Purpose:</span>
                                                                            <p className="text-gray-600 mt-1">{booking.purpose}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="text-xs text-gray-500">
                                                                Submitted: {booking.created_at}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-yellow-200">
                                                <Button
                                                    onClick={() => handleApprove(booking.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => openRejectionModal(booking)}
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject MTL Booking</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p><strong>Name:</strong> {selectedBooking.name}</p>
                                    <p><strong>Date:</strong> {format(parseISO(selectedBooking.date), 'MMM d, yyyy')}</p>
                                    <p><strong>Time:</strong> {selectedBooking.start_time} - {selectedBooking.end_time}</p>
                                    {selectedBooking.purpose && (
                                        <p><strong>Purpose:</strong> {selectedBooking.purpose}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="rejection_reason">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="rejection_reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a clear reason for rejecting this booking request..."
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-gray-500">
                                    This reason will be sent to the requester via email.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowRejectionModal(false);
                                setRejectionReason('');
                                setSelectedBooking(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim()}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}