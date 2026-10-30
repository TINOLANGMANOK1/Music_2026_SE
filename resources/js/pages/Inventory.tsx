import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationFirst, PaginationLast } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Info, Filter, Home, Wrench, Clock, Package, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import SuccessModal from '@/components/SuccessModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import RepairModal from '@/components/RepairModal';
import DecommissionModal from '@/components/DecommissionModal';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface Asset {
    id: number;
    asset_code: string;
    name: string;
    category: string;
    office: string;
    description: string | null;
    date_acquired: string;
    value: number | null;
    is_borrowable: boolean;
    status: string;
    repair_description?: string | null;
    repair_image?: string | null;
}

interface PaginatedAssets {
    current_page: number;
    data: Asset[];
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    last_page: number;
}

interface Disposal {
    id: number;
    asset_id: number;
    asset_code: string;
    asset_name: string;
    asset_category: string;
    asset_office: string;
    disposal_reason: string;
    disposal_document: string | null;
    disposed_at: string;
    disposed_by_name: string;
}

interface InventoryProps {
    assets: PaginatedAssets;
    disposals: Disposal[];
    filters: { search?: string, category?: string, status?: string, office?: string, is_borrowable?: string };
    categories: string[];
    statuses: string[];
    offices: string[];
    openId?: string | null;
}

const PIE_COLORS = {
    'In Stock': '#2E8B57',
    Borrowed: '#B22222',
    'Under Repair': '#DAA520',
    Disposed: '#808080',
};

// Helper function to convert database status to display name
const getDisplayStatus = (dbStatus: string): string => {
    const statusMap: Record<string, string> = {
        'available': 'In Stock',
        'borrowed': 'Borrowed',
        'maintenance': 'Under Repair',
        'disposed': 'Disposed',
    };
    return statusMap[dbStatus.toLowerCase()] || dbStatus;
};

// Helper function to convert display name to database status
const getDbStatus = (displayStatus: string): string => {
    const statusMap: Record<string, string> = {
        'In Stock': 'available',
        'Borrowed': 'borrowed',
        'Under Repair': 'maintenance',
        'Disposed': 'disposed',
    };
    return statusMap[displayStatus] || displayStatus.toLowerCase();
};

export default function Inventory({ assets, disposals, filters, categories, statuses, offices, openId }: InventoryProps) {
    const { auth } = usePage().props;
    const user = auth.user;
    const canManageInventory = user?.role === 'Music Dean' || user?.role === 'Administrator';
    
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [successTitle, setSuccessTitle] = useState('Success!');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isEditingInDetailsModal, setIsEditingInDetailsModal] = useState(false);
    
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [confirmationTitle, setConfirmationTitle] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [confirmationButtonText, setConfirmationButtonText] = useState('Confirm');
    const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
    
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [showDecommissionModal, setShowDecommissionModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'inventory' | 'disposal'>('inventory');

    const [activeCategory, setActiveCategory] = useState(filters.category || 'All');
    const [activeStatus, setActiveStatus] = useState(filters.status || 'All');
    const [activeOffice, setActiveOffice] = useState(filters.office || 'All');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    // Handle opening asset from dashboard via backend openId prop
    useEffect(() => {
        if (openId) {
            const asset = assets.data.find(a => a.id === parseInt(openId));
            if (asset) {
                setTimeout(() => {
                    openDetailsModal(asset);
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

    // Disposal filters
    const [disposalSearchQuery, setDisposalSearchQuery] = useState('');
    const [disposalCategory, setDisposalCategory] = useState('All');
    const [disposalOffice, setDisposalOffice] = useState('All');
    const [disposalDateRange, setDisposalDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
    
    // Disposal detail modal
    const [showDisposalDetailModal, setShowDisposalDetailModal] = useState(false);
    const [selectedDisposal, setSelectedDisposal] = useState<Disposal | null>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: 0,
        asset_code: '',
        name: '',
        category: '',
        office: '',
        description: '',
        date_acquired: '',
        value: 0,
        is_borrowable: true,
        status: 'available',
    });

    const getCurrentUrlParams = () => {
        const url = new URL(window.location.href);
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params;
    };

    const handleFilterChange = (key: string, value: string) => {
        const currentParams = getCurrentUrlParams();
        const newParams = {
            ...currentParams,
            [key]: value,
            page: '1'
        };

        if (key === 'search') {
            setSearchQuery(value);
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                Object.keys(newParams).forEach(k => newParams[k] === '' && delete newParams[k]);
                router.get('/inventory', newParams, { replace: true });
            }, 300);
        } else {
            if (key === 'category') {
                setActiveCategory(value);
            } else if (key === 'office') {
                setActiveOffice(value);
            } else if (key === 'status') {
                setActiveStatus(value);
            }
            Object.keys(newParams).forEach(k => newParams[k] === '' && delete newParams[k]);
            router.get('/inventory', newParams, { replace: true });
        }
    };

    const resetFilters = () => {
        setActiveCategory('All');
        setActiveStatus('All');
        setActiveOffice('All');
        setSearchQuery('');
        router.get('/inventory', {}, { replace: true });
    };

    const openAddEditModal = (asset: Asset | null = null) => {
        clearErrors();
        if (asset) {
            setSelectedAsset(asset);
            setData({
                id: asset.id,
                asset_code: asset.asset_code,
                name: asset.name,
                category: asset.category,
                office: asset.office,
                description: asset.description || '',
                date_acquired: asset.date_acquired,
                value: asset.value || 0,
                is_borrowable: asset.is_borrowable,
                status: asset.status,
            });
        } else {
            setSelectedAsset(null);
            reset();
        }
        setIsAddEditModalOpen(true);
    };

    const handleAddEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAsset) {
            put(`/inventory/${selectedAsset.id}`, {
                onSuccess: () => {
                    setIsAddEditModalOpen(false);
                    setSuccessMessage('Asset updated successfully!');
                    setSuccessTitle('Updated Successfully!');
                    setShowSuccessModal(true);
                },
            });
        } else {
            post('/inventory', {
                onSuccess: () => {
                    setIsAddEditModalOpen(false);
                    setSuccessMessage('Asset added successfully!');
                    setSuccessTitle('Asset Added!');
                    setShowSuccessModal(true);
                },
            });
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        setSuccessMessage('');
    };

    const openDetailsModal = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setSelectedAsset(null);
        setIsDetailsModalOpen(false);
        setIsEditingInDetailsModal(false);
    };

    // Filter disposals based on search and filters
    const filteredDisposals = useMemo(() => {
        if (!disposals) return [];
        
        return disposals.filter((disposal) => {
            const matchesSearch = disposalSearchQuery === '' || 
                disposal.asset_code.toLowerCase().includes(disposalSearchQuery.toLowerCase()) ||
                disposal.asset_name.toLowerCase().includes(disposalSearchQuery.toLowerCase()) ||
                disposal.disposal_reason.toLowerCase().includes(disposalSearchQuery.toLowerCase()) ||
                disposal.disposed_by_name.toLowerCase().includes(disposalSearchQuery.toLowerCase());
            
            const matchesCategory = disposalCategory === 'All' || disposal.asset_category === disposalCategory;
            const matchesOffice = disposalOffice === 'All' || disposal.asset_office === disposalOffice;
            
            // Date range filter
            let matchesDateRange = true;
            if (disposalDateRange.from || disposalDateRange.to) {
                const disposalDate = new Date(disposal.disposed_at);
                if (disposalDateRange.from && disposalDateRange.to) {
                    matchesDateRange = disposalDate >= disposalDateRange.from && disposalDate <= disposalDateRange.to;
                } else if (disposalDateRange.from) {
                    matchesDateRange = disposalDate >= disposalDateRange.from;
                } else if (disposalDateRange.to) {
                    matchesDateRange = disposalDate <= disposalDateRange.to;
                }
            }
            
            return matchesSearch && matchesCategory && matchesOffice && matchesDateRange;
        });
    }, [disposals, disposalSearchQuery, disposalCategory, disposalOffice, disposalDateRange]);

    const resetDisposalFilters = () => {
        setDisposalSearchQuery('');
        setDisposalCategory('All');
        setDisposalOffice('All');
        setDisposalDateRange({ from: undefined, to: undefined });
    };

    const handleViewDisposalDetails = (disposal: Disposal) => {
        setSelectedDisposal(disposal);
        setShowDisposalDetailModal(true);
    };

    const handleEditInDetailsModal = () => {
        setConfirmationTitle('Confirm Edit');
        setConfirmationMessage('Are you sure you want to edit this asset?');
        setOnConfirmAction(() => () => {
            if (selectedAsset) {
                setData({
                    id: selectedAsset.id,
                    asset_code: selectedAsset.asset_code,
                    name: selectedAsset.name,
                    category: selectedAsset.category,
                    office: selectedAsset.office,
                    description: selectedAsset.description || '',
                    date_acquired: selectedAsset.date_acquired,
                    value: selectedAsset.value || 0,
                    is_borrowable: selectedAsset.is_borrowable,
                    status: selectedAsset.status,
                });
                setIsEditingInDetailsModal(true);
                setShowConfirmationModal(false);
            }
        });
        setShowConfirmationModal(true);
    };

    const handleSaveDetailsModal = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAsset) {
            put(`/inventory/${selectedAsset.id}`, {
                onSuccess: () => {
                    setIsEditingInDetailsModal(false);
                    setIsDetailsModalOpen(false);
                    setSuccessMessage(`${selectedAsset.name} has been successfully updated!`);
                    setSuccessTitle('Updated Successfully!');
                    setShowSuccessModal(true);
                },
            });
        }
    };

    const handleStatusChange = (newStatus: string) => {
        if (selectedAsset) {
            // If sending for repair, show the repair modal first
            if (newStatus === 'Under Repair') {
                setShowRepairModal(true);
                return;
            }
            
            // If disposing, show the disposal modal
            if (newStatus === 'Disposed') {
                setShowDecommissionModal(true);
                return;
            }
            
            // Map display names to database ENUM values
            let dbStatus = newStatus;
            let message = '';
            let title = 'Success!';
            let confirmMessage = '';
            let buttonText = 'Confirm';
            
            if (newStatus === 'In Stock') {
                dbStatus = 'available';
                message = `${selectedAsset.name} has been returned from repair and is now in stock.`;
                title = 'Returned from Repair!';
                confirmMessage = 'Are you sure you want to mark this item as returned from repair and in stock?';
                buttonText = 'Return from Repair';
            } else if (newStatus === 'Recommission') {
                dbStatus = 'available';
                message = `${selectedAsset.name} has been recommissioned and is now in stock.`;
                title = 'Recommissioned!';
                confirmMessage = 'Are you sure you want to recommission this item? This will make it available for use again.';
                buttonText = 'Recommission';
            } else if (newStatus === 'Borrowed') {
                dbStatus = 'borrowed';
                message = `${selectedAsset.name} status changed to Borrowed.`;
                title = 'Status Updated!';
                confirmMessage = 'Are you sure you want to change the status to Borrowed?';
                buttonText = 'Update Status';
            } else {
                message = `${selectedAsset.name} status changed to ${newStatus}.`;
                title = 'Status Updated!';
                confirmMessage = `Are you sure you want to change the status to ${newStatus}?`;
                buttonText = 'Confirm';
            }

            setConfirmationTitle('Confirm Action');
            setConfirmationMessage(confirmMessage);
            setConfirmationButtonText(buttonText);
            setOnConfirmAction(() => () => {
                // When returning from repair, clear repair fields
                const updateData = newStatus === 'In Stock' 
                    ? {
                        ...selectedAsset,
                        status: dbStatus,
                        repair_description: null,
                        repair_image: null,
                    }
                    : {
                        ...selectedAsset,
                        status: dbStatus,
                    };
                
                router.put(`/inventory/${selectedAsset.id}`, updateData, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsDetailsModalOpen(false);
                        setSuccessMessage(message);
                        setSuccessTitle(title);
                        setShowSuccessModal(true);
                        setShowConfirmationModal(false);
                    },
                });
            });
            setShowConfirmationModal(true);
        }
    };

    const handleRepairConfirm = (description: string, imageFile: File | null) => {
        if (selectedAsset) {
            const formData = new FormData();
            
            // Add required fields for asset update
            formData.append('asset_code', selectedAsset.asset_code);
            formData.append('name', selectedAsset.name);
            formData.append('category', selectedAsset.category);
            formData.append('office', selectedAsset.office);
            formData.append('is_borrowable', selectedAsset.is_borrowable ? '1' : '0');
            
            // Add optional fields if they exist
            if (selectedAsset.description) {
                formData.append('description', selectedAsset.description);
            }
            if (selectedAsset.date_acquired) {
                formData.append('date_acquired', selectedAsset.date_acquired);
            }
            if (selectedAsset.value) {
                formData.append('value', String(selectedAsset.value));
            }
            
            // Add repair-specific fields
            formData.append('status', 'maintenance');
            formData.append('repair_description', description);
            if (imageFile) {
                formData.append('repair_image', imageFile);
            }

            router.post(`/inventory/${selectedAsset.id}?_method=PUT`, formData, {
                preserveState: true,
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setShowRepairModal(false);
                    setIsDetailsModalOpen(false);
                    setSuccessMessage(`${selectedAsset.name} has been sent for repair.`);
                    setSuccessTitle('Sent for Repair!');
                    setShowSuccessModal(true);
                },
                onError: (errors) => {
                    console.error('Error sending for repair:', errors);
                    alert('Failed to send item for repair. Please try again.');
                }
            });
        }
    };

    const handleDecommissionConfirm = (reason: string, documentFile: File | null) => {
        if (selectedAsset && documentFile) {
            const formData = new FormData();
            
            formData.append('asset_id', String(selectedAsset.id));
            formData.append('disposal_reason', reason);
            formData.append('disposal_document', documentFile);

            router.post('/inventory/dispose', formData, {
                preserveState: true,
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setShowDecommissionModal(false);
                    setIsDetailsModalOpen(false);
                    setSuccessMessage(`${selectedAsset.name} has been disposed and moved to disposal history.`);
                    setSuccessTitle('Item Disposed!');
                    setShowSuccessModal(true);
                },
                onError: (errors) => {
                    console.error('Error disposing item:', errors);
                    alert('Failed to dispose item. Please try again.');
                }
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Inventory" />
            <div className="p-4 md:p-10">
                <div className="mb-2">
                    <h1 className="text-3xl font-bold">Inventory Assets</h1>
                    <p className="text-muted-foreground mt-2">Manage all assets, track their status, and oversee their availability.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 mt-6 border-b">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2",
                            activeTab === 'inventory'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Package className="h-5 w-5" />
                        In Stock Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('disposal')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2",
                            activeTab === 'disposal'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Clock className="h-5 w-5" />
                        Disposal History
                    </button>
                </div>

                {activeTab === 'inventory' && (
                    <>
                <Card className="mb-6 pt-1 pb-7 gap-1">
                    <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-pink-500" />
                            <CardTitle className="text-lg font-semibold">Filters:</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                        <div className="flex items-center gap-4">
                            <Label>Category:</Label>
                            <Select onValueChange={(value) => handleFilterChange('category', value)} value={activeCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Categories</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Label>Status:</Label>
                            <Select onValueChange={(value) => handleFilterChange('status', value)} value={activeStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Label>Office:</Label>
                            <Select onValueChange={(value) => handleFilterChange('office', value)} value={activeOffice}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Offices" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Offices</SelectItem>
                                    {offices.map(office => (
                                        <SelectItem key={office} value={office}>{office}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <Input
                                type="text"
                                placeholder="Search by name or asset code..."
                                value={searchQuery}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="max-w-sm"
                            />
                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                            </div>
                        </div>
                        {/* Active filter chips */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {activeCategory !== 'All' && <Button variant="ghost" onClick={() => handleFilterChange('category', 'All')}>Category: {activeCategory} ✕</Button>}
                            {activeStatus !== 'All' && <Button variant="ghost" onClick={() => handleFilterChange('status', 'All')}>Status: {activeStatus} ✕</Button>}
                            {activeOffice !== 'All' && <Button variant="ghost" onClick={() => handleFilterChange('office', 'All')}>Office: {activeOffice} ✕</Button>}
                        </div>
                    </CardContent>
                </Card>

                {/* Asset List Section */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2 flex items-center justify-between">
                        <span>Asset List</span>
                        {canManageInventory && (
                            <Button onClick={() => openAddEditModal()}>
                                Add Asset
                            </Button>
                        )}
                    </h2>
                </div>

                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Office</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.data.map((asset) => (
                                    <TableRow 
                                        key={asset.id}
                                        id={`asset-row-${asset.id}`}
                                    >
                                        <TableCell>{asset.asset_code}</TableCell>
                                        <TableCell>{asset.name}</TableCell>
                                        <TableCell>{asset.category}</TableCell>
                                        <TableCell>{asset.office}</TableCell>
                                        <TableCell>
                                            <span className={cn("inline-block size-3 rounded-full mr-2", {
                                                'bg-red-500': asset.status === 'borrowed',
                                                'bg-yellow-500': asset.status === 'maintenance',
                                                'bg-gray-500': asset.status === 'disposed',
                                                'bg-green-500': asset.status === 'available',
                                            })}></span>
                                            {getDisplayStatus(asset.status)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="outline" onClick={() => openDetailsModal(asset)}>View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-center items-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationFirst 
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); if (assets.current_page > 1) handlePagination(`${assets.path}?page=1`); }} 
                                            disabled={assets.current_page === 1} 
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); if (assets.prev_page_url) handlePagination(assets.prev_page_url); }} 
                                            disabled={assets.current_page === 1} 
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-2">{assets.current_page} of {assets.last_page}</span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext 
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); if (assets.next_page_url) handlePagination(assets.next_page_url); }} 
                                            disabled={assets.current_page === assets.last_page} 
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLast 
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); if (assets.current_page < assets.last_page) handlePagination(`${assets.path}?page=${assets.last_page}`); }} 
                                            disabled={assets.current_page === assets.last_page} 
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
                </>
                )}

                {activeTab === 'disposal' && (
                    <>
                        <Card className="mb-6 pt-1 pb-7 gap-1">
                            <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-pink-500" />
                                    <CardTitle className="text-lg font-semibold">Filters:</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col space-y-4">
                                <div className="flex items-center gap-4">
                                    <Label>Category:</Label>
                                    <Select onValueChange={(value) => setDisposalCategory(value)} value={disposalCategory}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Categories</SelectItem>
                                            {categories.map(category => (
                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Label>Office:</Label>
                                    <Select onValueChange={(value) => setDisposalOffice(value)} value={disposalOffice}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="All Offices" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Offices</SelectItem>
                                            {offices.map(office => (
                                                <SelectItem key={office} value={office}>{office}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Label>Date Range:</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-[280px] justify-start text-left font-normal",
                                                    !disposalDateRange.from && !disposalDateRange.to && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {disposalDateRange.from ? (
                                                    disposalDateRange.to ? (
                                                        <>
                                                            {format(disposalDateRange.from, "LLL dd, y")} -{" "}
                                                            {format(disposalDateRange.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(disposalDateRange.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pick a date range</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={disposalDateRange.from}
                                                selected={{ from: disposalDateRange.from, to: disposalDateRange.to }}
                                                onSelect={(range) => setDisposalDateRange({ from: range?.from, to: range?.to })}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="text"
                                        placeholder="Search by asset code, name, reason, or disposed by..."
                                        value={disposalSearchQuery}
                                        onChange={(e) => setDisposalSearchQuery(e.target.value)}
                                        className="max-w-md"
                                    />
                                    <div className="ml-auto flex items-center gap-2">
                                        <Button variant="outline" onClick={resetDisposalFilters}>Reset Filters</Button>
                                    </div>
                                </div>
                                {/* Active filter chips */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {disposalCategory !== 'All' && <Button variant="ghost" onClick={() => setDisposalCategory('All')}>Category: {disposalCategory} ✕</Button>}
                                    {disposalOffice !== 'All' && <Button variant="ghost" onClick={() => setDisposalOffice('All')}>Office: {disposalOffice} ✕</Button>}
                                    {(disposalDateRange.from || disposalDateRange.to) && (
                                        <Button variant="ghost" onClick={() => setDisposalDateRange({ from: undefined, to: undefined })}>
                                            Date: {disposalDateRange.from && format(disposalDateRange.from, "MMM dd, yyyy")}
                                            {disposalDateRange.from && disposalDateRange.to && " - "}
                                            {disposalDateRange.to && format(disposalDateRange.to, "MMM dd, yyyy")} ✕
                                        </Button>
                                    )}
                                    {disposalSearchQuery && <Button variant="ghost" onClick={() => setDisposalSearchQuery('')}>Search: "{disposalSearchQuery}" ✕</Button>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Disposal History Section */}
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2">
                                <span>Disposal History</span>
                            </h2>
                        </div>

                        <Card>
                            <CardContent className="p-6">
                                {filteredDisposals && filteredDisposals.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asset Code</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Office</TableHead>
                                            <TableHead>Disposal Reason</TableHead>
                                            <TableHead>Disposed By</TableHead>
                                            <TableHead>Disposal Date</TableHead>
                                            <TableHead>Document</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDisposals.map((disposal) => (
                                            <TableRow key={disposal.id}>
                                                <TableCell className="font-medium">{disposal.asset_code}</TableCell>
                                                <TableCell>{disposal.asset_name}</TableCell>
                                                <TableCell>{disposal.asset_category}</TableCell>
                                                <TableCell>{disposal.asset_office}</TableCell>
                                                <TableCell className="max-w-[400px]">
                                                    <button
                                                        onClick={() => handleViewDisposalDetails(disposal)}
                                                        className="text-left hover:underline cursor-pointer text-blue-600 line-clamp-2"
                                                        title="Click to view full details"
                                                    >
                                                        {disposal.disposal_reason}
                                                    </button>
                                                </TableCell>
                                                <TableCell>{disposal.disposed_by_name}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {new Date(disposal.disposed_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    {disposal.disposal_document && (
                                                        <a
                                                            href={`/storage/${disposal.disposal_document}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            View
                                                        </a>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No Disposal History</h3>
                                    <p>Items that have been disposed will appear here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    </>
                )}

                <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedAsset ? 'Edit' : 'Add'} Asset</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddEditSubmit} className="space-y-4 p-4">
                            <div>
                                <Label htmlFor="asset_code">Asset Code</Label>
                                <Input id="asset_code" value={data.asset_code} onChange={e => setData('asset_code', e.target.value)} />
                                <InputError message={errors.asset_code} />
                            </div>
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" value={data.category} onChange={e => setData('category', e.target.value)} />
                                <InputError message={errors.category} />
                            </div>
                            <div>
                                <Label htmlFor="office">Office</Label>
                                <Input id="office" value={data.office} onChange={e => setData('office', e.target.value)} />
                                <InputError message={errors.office} />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" value={data.description} onChange={e => setData('description', e.target.value)} />
                                <InputError message={errors.description} />
                            </div>
                            <div>
                                <Label htmlFor="date_acquired">Date Acquired (Optional)</Label>
                                <Input id="date_acquired" type="date" value={data.date_acquired} onChange={e => setData('date_acquired', e.target.value)} />
                                <InputError message={errors.date_acquired} />
                            </div>
                            <div>
                                <Label htmlFor="value">Value</Label>
                                <Input id="value" type="number" value={data.value} onChange={e => setData('value', Number(e.target.value))} />
                                <InputError message={errors.value} />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={value => setData('status', getDbStatus(value))} value={getDisplayStatus(data.status)}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="In Stock">In Stock</SelectItem>
                                        <SelectItem value="Borrowed">Borrowed</SelectItem>
                                        <SelectItem value="Under Repair">Under Repair</SelectItem>
                                        <SelectItem value="Disposed">Disposed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                            <div className="flex items-center">
                                <input id="is_borrowable" type="checkbox" checked={data.is_borrowable} onChange={e => setData('is_borrowable', e.target.checked)} className="mr-2" />
                                <Label htmlFor="is_borrowable">Is Borrowable?</Label>
                                <InputError message={errors.is_borrowable} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={processing}>{selectedAsset ? 'Update' : 'Create'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEditingInDetailsModal ? 'Edit Asset' : 'Asset Details'}</DialogTitle>
                        </DialogHeader>
                        {selectedAsset && !isEditingInDetailsModal && (
                            <div className="space-y-4 p-4">
                                <p><strong>Asset Code:</strong> {selectedAsset.asset_code}</p>
                                <p><strong>Name:</strong> {selectedAsset.name}</p>
                                <p><strong>Category:</strong> {selectedAsset.category}</p>
                                <p><strong>Office:</strong> {selectedAsset.office}</p>
                                <p><strong>Description:</strong> {selectedAsset.description || 'N/A'}</p>
                                <p><strong>Date Acquired:</strong> {selectedAsset.date_acquired ? new Date(selectedAsset.date_acquired).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Value:</strong> {selectedAsset.value ? `$${selectedAsset.value}` : 'N/A'}</p>
                                <p><strong>Status:</strong> {getDisplayStatus(selectedAsset.status)}</p>
                                <p><strong>Is Borrowable:</strong> {selectedAsset.is_borrowable ? 'Yes' : 'No'}</p>
                            </div>
                        )}
                        {selectedAsset && isEditingInDetailsModal && (
                            <form onSubmit={handleSaveDetailsModal} className="space-y-4 p-4">
                                <div>
                                    <Label htmlFor="detail_asset_code">Asset Code</Label>
                                    <Input id="detail_asset_code" value={data.asset_code} onChange={e => setData('asset_code', e.target.value)} />
                                    <InputError message={errors.asset_code} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_name">Name</Label>
                                    <Input id="detail_name" value={data.name} onChange={e => setData('name', e.target.value)} />
                                    <InputError message={errors.name} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_category">Category</Label>
                                    <Input id="detail_category" value={data.category} onChange={e => setData('category', e.target.value)} />
                                    <InputError message={errors.category} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_office">Office</Label>
                                    <Input id="detail_office" value={data.office} onChange={e => setData('office', e.target.value)} />
                                    <InputError message={errors.office} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_description">Description</Label>
                                    <Input id="detail_description" value={data.description} onChange={e => setData('description', e.target.value)} />
                                    <InputError message={errors.description} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_date_acquired">Date Acquired (Optional)</Label>
                                    <Input id="detail_date_acquired" type="date" value={data.date_acquired} onChange={e => setData('date_acquired', e.target.value)} />
                                    <InputError message={errors.date_acquired} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_value">Value</Label>
                                    <Input id="detail_value" type="number" value={data.value} onChange={e => setData('value', Number(e.target.value))} />
                                    <InputError message={errors.value} />
                                </div>
                                <div>
                                    <Label htmlFor="detail_status">Status</Label>
                                    <Select onValueChange={value => setData('status', getDbStatus(value))} value={getDisplayStatus(data.status)}>
                                        <SelectTrigger id="detail_status">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="In Stock">In Stock</SelectItem>
                                            <SelectItem value="Borrowed">Borrowed</SelectItem>
                                            <SelectItem value="Under Repair">Under Repair</SelectItem>
                                            <SelectItem value="Disposed">Disposed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                                <div className="flex items-center">
                                    <input id="detail_is_borrowable" type="checkbox" checked={data.is_borrowable} onChange={e => setData('is_borrowable', e.target.checked)} className="mr-2" />
                                    <Label htmlFor="detail_is_borrowable">Is Borrowable?</Label>
                                    <InputError message={errors.is_borrowable} />
                                </div>
                            </form>
                        )}
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            {!isEditingInDetailsModal ? (
                                <>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleEditInDetailsModal}
                                        disabled={!canManageInventory}
                                    >
                                        Edit
                                    </Button>
                                    {selectedAsset?.status === 'maintenance' ? (
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => handleStatusChange('In Stock')}
                                            disabled={!canManageInventory}
                                        >
                                            Return from Repair
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                            onClick={() => handleStatusChange('Under Repair')}
                                            disabled={user?.role === 'Student Assistant'}
                                        >
                                            Send for Repair
                                        </Button>
                                    )}
                                    {selectedAsset?.status === 'disposed' ? (
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            className="bg-blue-500 hover:bg-blue-600 text-white"
                                            onClick={() => handleStatusChange('Recommission')}
                                            disabled={user?.role === 'Student Assistant'}
                                        >
                                            Recommission
                                        </Button>
                                    ) : (
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            className="bg-gray-500 hover:bg-gray-600 text-white"
                                            onClick={() => handleStatusChange('Disposed')}
                                            disabled={selectedAsset?.status === 'disposed' || !canManageInventory}
                                        >
                                            Dispose
                                        </Button>
                                    )}
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Close</Button>
                                    </DialogClose>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsEditingInDetailsModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        onClick={handleSaveDetailsModal}
                                        disabled={processing}
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={handleCloseSuccessModal}
                    message={successMessage}
                    title={successTitle}
                />
                
                <ConfirmationModal
                    isOpen={showConfirmationModal}
                    onClose={() => setShowConfirmationModal(false)}
                    onConfirm={onConfirmAction || (() => {})}
                    title={confirmationTitle}
                    message={confirmationMessage}
                    confirmText={confirmationButtonText}
                />

                <RepairModal
                    isOpen={showRepairModal}
                    onClose={() => setShowRepairModal(false)}
                    onConfirm={handleRepairConfirm}
                    assetName={selectedAsset?.name || ''}
                />

                <DecommissionModal
                    isOpen={showDecommissionModal}
                    onClose={() => setShowDecommissionModal(false)}
                    onConfirm={handleDecommissionConfirm}
                    assetName={selectedAsset?.name || ''}
                />

                {/* Disposal Detail Modal */}
                <Dialog open={showDisposalDetailModal} onOpenChange={setShowDisposalDetailModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Disposal Details</DialogTitle>
                        </DialogHeader>
                        {selectedDisposal && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Asset Code</Label>
                                        <p className="font-semibold">{selectedDisposal.asset_code}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Asset Name</Label>
                                        <p className="font-semibold">{selectedDisposal.asset_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Category</Label>
                                        <p>{selectedDisposal.asset_category}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Office</Label>
                                        <p>{selectedDisposal.asset_office}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Disposed By</Label>
                                        <p>{selectedDisposal.disposed_by_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Disposal Date</Label>
                                        <p>{new Date(selectedDisposal.disposed_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Disposal Reason</Label>
                                    <p className="mt-2 p-3 bg-muted rounded-md whitespace-pre-wrap">{selectedDisposal.disposal_reason}</p>
                                </div>
                                {selectedDisposal.disposal_document && (
                                    <div>
                                        <Label className="text-muted-foreground">Disposal Document</Label>
                                        <div className="mt-2">
                                            <a
                                                href={`/storage/${selectedDisposal.disposal_document}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                View Document
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDisposalDetailModal(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}