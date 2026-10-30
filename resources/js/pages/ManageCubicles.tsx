import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationFirst, PaginationLast } from '@/components/ui/pagination';
import AddCubicleModal from '@/components/AddCubicleModal';
import EditCubicleModal from '@/components/EditCubicleModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import { cn } from '@/lib/utils';

interface Cubicle {
    cubicle_id: number;
    cubicle_type_id: number;
    cubicle_type: string;
    cubicle_no: number;
    status: string;
}

interface PaginatedCubicles {
    current_page: number;
    data: Cubicle[];
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    last_page: number;
}

interface ManageCubiclesProps {
    cubicles: PaginatedCubicles;
    allCubicles: Cubicle[];
    filters: {
        search: string;
        type: string;
        status: string;
    };
    openId?: string | null;
}

const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'available':
            return 'bg-green-500';
        case 'occupied':
            return 'bg-red-500';
        case 'maintenance':
            return 'bg-yellow-500';
        case 'under repair':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

export default function ManageCubicles({ cubicles, allCubicles, filters, openId }: ManageCubiclesProps) {
    const { flash } = usePage().props as any;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedCubicle, setSelectedCubicle] = useState<Cubicle | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search);
    const [filterType, setFilterType] = useState<string>(filters.type);
    const [filterStatus, setFilterStatus] = useState<string>(filters.status);

    // Handle opening cubicle from dashboard via backend openId prop
    useEffect(() => {
        if (openId) {
            const cubicle = cubicles.data.find(c => c.cubicle_id === parseInt(openId));
            if (cubicle) {
                setTimeout(() => {
                    handleEdit(cubicle);
                    // Clear openId from URL to prevent it from persisting
                    const currentParams = new URLSearchParams(window.location.search);
                    currentParams.delete('openId');
                    const newUrl = currentParams.toString() 
                        ? `${window.location.pathname}?${currentParams.toString()}`
                        : window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                }, 100);
            }
        }
    }, [openId]);

    // Custom pagination handler to ensure openId is never included
    const handlePagination = (url: string | null) => {
        if (!url) return;
        
        const urlObj = new URL(url);
        urlObj.searchParams.delete('openId');
        
        router.get(urlObj.pathname + urlObj.search);
    };

    // Apply filters to backend when they change
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get('/manage-cubicles', {
                search: searchQuery,
                type: filterType,
                status: filterStatus,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300); // Debounce search input by 300ms

        return () => clearTimeout(timer);
    }, [searchQuery, filterType, filterStatus]);

    // Show success/error messages
    useEffect(() => {
        if (flash?.success) {
            setShowSuccessModal(true);
        }
        if (flash?.error) {
            console.log('Error:', flash.error);
        }
    }, [flash]);

    const handleEdit = (cubicle: Cubicle) => {
        setSelectedCubicle(cubicle);
        setIsEditModalOpen(true);
    };

    const handleDelete = (cubicle: Cubicle) => {
        setSelectedCubicle(cubicle);
        setDeleteConfirmationText('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedCubicle && deleteConfirmationText === 'Delete Cubicle') {
            setIsDeleting(true);
            router.delete(`/manage-cubicles/${selectedCubicle.cubicle_id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setSelectedCubicle(null);
                    setDeleteConfirmationText('');
                    setIsDeleting(false);
                },
                onError: () => {
                    setIsDeleting(false);
                }
            });
        }
    };

    // Get unique types and statuses for filters
    const types = ['All', ...new Set(cubicles.data.map(c => c.cubicle_type))];
    const statuses = ['All', ...new Set(cubicles.data.map(c => c.status))];

    return (
        <AppLayout>
            <Head title="Manage Cubicles" />
            
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-2">Manage Cubicles</h1>
                <p className="text-muted-foreground mb-4">
                    Manage all cubicles, track their types and status, and oversee their availability.
                </p>

                <div className="flex items-center justify-end mb-6">
                </div>

                {/* Filter Card */}
                <Card className="mb-6 pt-1 pb-7 gap-1">
                    <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-pink-500" />
                            <CardTitle className="text-lg font-semibold">Filters:</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Type:</span>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Guitar">Guitar</SelectItem>
                                        <SelectItem value="Piano">Piano</SelectItem>
                                        <SelectItem value="MTL">MTL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Status:</span>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        <SelectItem value="Instrument Under Repair">Instrument Under Repair</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Input
                                type="text"
                                placeholder="Search by number or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-sm flex-grow dark:bg-gray-700 dark:text-white"
                            />
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    setFilterType('All');
                                    setFilterStatus('All');
                                    setSearchQuery('');
                                    router.get('/manage-cubicles', {
                                        search: '',
                                        type: 'All',
                                        status: 'All',
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Cubicle List Section */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2 flex items-center justify-between">
                        <span>Cubicle List</span>
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            Add Cubicle
                        </Button>
                    </h2>
                </div>

                {/* Cubicles Table */}
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cubicle No.</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cubicles.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                                            No cubicles found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cubicles.data.map((cubicle) => (
                                        <TableRow 
                                            key={cubicle.cubicle_id}
                                            id={`cubicle-row-${cubicle.cubicle_id}`}
                                        >
                                            <TableCell className="font-medium">
                                                {cubicle.cubicle_no}
                                            </TableCell>
                                            <TableCell>{cubicle.cubicle_type}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-3 w-3 rounded-full ${getStatusColor(cubicle.status)}`} />
                                                    {cubicle.status}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(cubicle)}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="flex justify-center items-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationFirst 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (cubicles.current_page !== 1) {
                                                    router.get('/manage-cubicles', {
                                                        page: 1,
                                                        search: searchQuery,
                                                        type: filterType,
                                                        status: filterStatus,
                                                    }, {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (cubicles.current_page !== 1) {
                                                    router.get('/manage-cubicles', {
                                                        page: cubicles.current_page - 1,
                                                        search: searchQuery,
                                                        type: filterType,
                                                        status: filterStatus,
                                                    }, {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-2">{cubicles.current_page} of {cubicles.last_page}</span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (cubicles.current_page !== cubicles.last_page) {
                                                    router.get('/manage-cubicles', {
                                                        page: cubicles.current_page + 1,
                                                        search: searchQuery,
                                                        type: filterType,
                                                        status: filterStatus,
                                                    }, {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLast 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (cubicles.current_page !== cubicles.last_page) {
                                                    router.get('/manage-cubicles', {
                                                        page: cubicles.last_page,
                                                        search: searchQuery,
                                                        type: filterType,
                                                        status: filterStatus,
                                                    }, {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AddCubicleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                cubicles={allCubicles}
            />

            {selectedCubicle && (
                <EditCubicleModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedCubicle(null);
                    }}
                    cubicle={selectedCubicle}
                    onDelete={() => {
                        setIsEditModalOpen(false);
                        handleDelete(selectedCubicle);
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCubicle(null);
                    setDeleteConfirmationText('');
                }}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message={
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex gap-2">
                                <svg className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-yellow-800">Warning: This action cannot be undone!</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        You are about to delete <strong>Cubicle {selectedCubicle?.cubicle_no} ({selectedCubicle?.cubicle_type})</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm">
                                Type <span className="text-pink-600 font-semibold">Delete Cubicle</span> to confirm:
                            </p>
                            <Input
                                type="text"
                                value={deleteConfirmationText}
                                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                placeholder="Delete Cubicle"
                                className="w-full"
                            />
                        </div>
                    </div>
                }
                confirmDisabled={deleteConfirmationText !== 'Delete Cubicle' || isDeleting}
                isLoading={isDeleting}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Success!"
                message={flash?.success || "Operation completed successfully."}
            />
        </AppLayout>
    );
}
