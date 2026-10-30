import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Fragment } from 'react';
import { Clock, Filter } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationFirst, PaginationLast } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'available':
            return 'bg-green-500';
        case 'occupied':
        case 'borrowed':
            return 'bg-red-500';
        case 'maintenance':
        case 'under repair':
            return 'bg-yellow-500';
        default:
            return 'bg-gray-500';
    }
};

const capitalizeStatus = (status: string): string => {
    // Capitalize first letter of each word
    return status
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

import ConfirmationModal from '@/components/ConfirmationModal';
import FailureModal from '@/components/FailureModal';
import SuccessTimeoutModal from '@/components/SuccessTimeoutModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CubicleData {
    cubicle_id: number;
    cubicle_no: number;
    cubicle_type: string;
    status: string;
    name: string;
    yr_sec: string;
    time_in: string;
}

interface InstrumentData {
    instrument_id: number;
    instrument_type: string;
    instrument_no: string;
    instrument_name: string;
    office: string;
    status: string;
    name: string;
    yr_sec: string;
    time_in: string;
}

interface PaginatedInstruments {
    current_page: number;
    data: InstrumentData[];
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    last_page: number;
    per_page: number;
    total: number;
}

interface ToolData {
    tool_id: number;
    tool_no: number | string;
    tool_type: string;
    tool_name?: string;
    office?: string;
    status: string;
    name: string;
    yr_sec: string;
    time_in: string;
}

type ItemDetails = CubicleData | InstrumentData | ToolData;

interface TimeoutDetails {
    name: string;
    itemType: string;
    itemNo: number | string;
    timeIn: string;
    timeOut: string;
    duration: string;
}
interface ResourcesProps {
    cubicles: CubicleData[];
    musicalInstruments: PaginatedInstruments;
    audioVisualEquipment: PaginatedInstruments;
    toolsByCategory: { [category: string]: PaginatedInstruments };
    allInstrumentsForFilter: { instrument_id: number; office: string; instrument_type: string }[];
    selectedOffice: string;
}

export default function Resources({ cubicles, musicalInstruments, audioVisualEquipment, toolsByCategory, allInstrumentsForFilter, selectedOffice }: ResourcesProps) {
    // Get filter from URL parameter, default to 'Cubicles'
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilter = urlParams.get('filter') || 'Cubicles';
    
    const [selectedFilter, setSelectedFilter] = useState(initialFilter);
    const [selectedType, setSelectedType] = useState(selectedOffice || 'All');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [itemToTimeout, setItemToTimeout] = useState<{ id: number; type: 'cubicle' | 'instrument' | 'tool' } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showFailureModal, setShowFailureModal] = useState(false);
    const [timeoutMessage, setTimeoutMessage] = useState('');
    const [timeoutDetails, setTimeoutDetails] = useState<TimeoutDetails | null>(null);

    const handleTimeOutClick = (id: number, type: 'cubicle' | 'instrument' | 'tool') => {
        setItemToTimeout({ id, type });
        setShowConfirmationModal(true);
    };

    const confirmTimeOut = () => {
        if (!itemToTimeout) return;

        const { id, type } = itemToTimeout;
        let endpoint = '';
        const payload: { cubicle_id?: number; instrument_id?: number; tool_id?: number; } = {};

        if (type === 'cubicle') {
            endpoint = '/timeouts/cubicle';
            payload.cubicle_id = id;
        } else if (type === 'instrument') {
            endpoint = '/timeouts/instrument';
            payload.instrument_id = id;
        } else if (type === 'tool') {
            endpoint = '/timeouts/tool';
            payload.tool_id = id;
        }

        setShowConfirmationModal(false);

        router.post(endpoint, payload, {
            onSuccess: (page) => {
                setTimeoutMessage((page.props.flash as any)?.success || 'Timed out successfully!');
                let itemDetails: ItemDetails | undefined = undefined;
                if (type === 'cubicle') {
                    itemDetails = cubicles.find(c => c.cubicle_id === id);
                } else if (type === 'instrument') {
                    itemDetails = allInstrumentsData.find(i => i.instrument_id === id);
                } else if (type === 'tool') {
                    // Search in allToolsData
                    itemDetails = allToolsData.find((t: ToolData) => t.tool_id === id);
                }

                if (itemDetails) {
                    const timeIn = new Date(itemDetails.time_in);
                    const timeOut = new Date();
                    const durationInMinutes = Math.round((timeOut.getTime() - timeIn.getTime()) / 60000);
                    const hours = Math.floor(durationInMinutes / 60);
                    const minutes = durationInMinutes % 60;
                    const duration = `${hours}hr ${minutes}min`;
                    // Use type guards to pick the right fields depending on item shape
                    let itemTypeVal: string = 'N/A';
                    let itemNoVal: number | string = 'N/A';
                    if ('cubicle_type' in itemDetails) {
                        itemTypeVal = itemDetails.cubicle_type;
                        itemNoVal = itemDetails.cubicle_no;
                    } else if ('instrument_type' in itemDetails) {
                        itemTypeVal = itemDetails.instrument_type;
                        itemNoVal = itemDetails.instrument_no;
                    } else if ('tool_type' in itemDetails) {
                        itemTypeVal = itemDetails.tool_type;
                        itemNoVal = itemDetails.tool_no;
                    }

                    setTimeoutDetails({
                        name: itemDetails.name,
                        itemType: itemTypeVal,
                        itemNo: itemNoVal,
                        timeIn: timeIn.toLocaleTimeString(),
                        timeOut: timeOut.toLocaleTimeString(),
                        duration: duration,
                    });
                    setShowSuccessModal(true);
                } else {
                    setTimeoutMessage('Timed out successfully, but item details not found for display.');
                    setTimeoutDetails({ name: 'N/A', itemType: 'N/A', itemNo: 'N/A', timeIn: 'N/A', timeOut: 'N/A', duration: 'N/A' });
                    setShowSuccessModal(true);
                }
            },
            onError: (errors) => {
                setTimeoutMessage(errors.timeout || 'Failed to time out.');
                setShowFailureModal(true);
            },
            onFinish: () => {
                setItemToTimeout(null);
            }
        });
    };

    const handleCloseModals = () => {
        setShowConfirmationModal(false);
        setShowSuccessModal(false);
        setShowFailureModal(false);
        setTimeoutMessage('');
        setTimeoutDetails(null);
        router.reload({ 
            only: ['cubicles', 'musicalInstruments', 'audioVisualEquipment', 'toolsByCategory', 'allInstrumentsForFilter'] 
        });
    };

    const renderCubicleTable = (cubicles: CubicleData[], title: string) => (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <Table>
                    <TableCaption>A list of {title.toLowerCase()} statuses.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Cubicle No.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Yr & Sec</TableHead>
                            <TableHead>Time in</TableHead>
                            <TableHead>Time out</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cubicles.map((cubicle) => (
                            <TableRow key={cubicle.cubicle_id}>
                                <TableCell className="font-medium">{cubicle.cubicle_no}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("inline-block size-3 rounded-full", getStatusColor(cubicle.status))}></span>
                                        {cubicle.status}
                                    </div>
                                </TableCell>
                                <TableCell>{cubicle.name}</TableCell>
                                <TableCell>{cubicle.yr_sec}</TableCell>
                                <TableCell>
                                    {cubicle.time_in && cubicle.time_in !== '-' ? (
                                        <>
                                            <div>{new Date(cubicle.time_in).toLocaleTimeString()}</div>
                                            <div>{new Date(cubicle.time_in).toLocaleDateString()}</div>
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => handleTimeOutClick(cubicle.cubicle_id, 'cubicle')}
                                        disabled={cubicle.status !== 'Occupied'}
                                        variant={cubicle.status === 'Occupied' ? 'timeout' : 'outline'}
                                        size="icon"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const renderInstrumentTable = (instruments: InstrumentData[], title: string) => {
        if (!instruments || instruments.length === 0) {
            return null;
        }
        
        return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <Table>
                    <TableCaption>A list of {title.toLowerCase()} statuses.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Asset Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Borrower</TableHead>
                            <TableHead>Yr & Sec</TableHead>
                            <TableHead>Release Time</TableHead>
                            <TableHead>Return</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {instruments.map((instrument) => (
                            <TableRow key={instrument.instrument_id}>
                                <TableCell className="font-medium">{instrument.instrument_no}</TableCell>
                                <TableCell>{instrument.instrument_name}</TableCell>
                                <TableCell>{instrument.instrument_type}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("inline-block size-3 rounded-full", getStatusColor(instrument.status))}></span>
                                        {capitalizeStatus(instrument.status)}
                                    </div>
                                </TableCell>
                                <TableCell>{instrument.name}</TableCell>
                                <TableCell>{instrument.yr_sec}</TableCell>
                                <TableCell>
                                    {instrument.time_in && instrument.time_in !== '-' ? (
                                        <>
                                            <div>{new Date(instrument.time_in).toLocaleTimeString()}</div>
                                            <div>{new Date(instrument.time_in).toLocaleDateString()}</div>
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => handleTimeOutClick(instrument.instrument_id, 'instrument')}
                                        disabled={!['Borrowed', 'Occupied'].map(s => s.toLowerCase()).includes(instrument.status.toLowerCase())}
                                        variant={['Borrowed', 'Occupied'].map(s => s.toLowerCase()).includes(instrument.status.toLowerCase()) ? 'timeout' : 'outline'}
                                        size="icon"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        );
    };

    const renderToolTable = (tools: ToolData[], title: string) => {
        if (!tools || tools.length === 0) {
            return null;
        }
        
        return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <Table>
                    <TableCaption>A list of {title.toLowerCase()} statuses.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Asset Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Borrower</TableHead>
                            <TableHead>Yr & Sec</TableHead>
                            <TableHead>Release Time</TableHead>
                            <TableHead>Return</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tools.map((tool) => {
                            return (
                            <TableRow key={tool.tool_id}>
                                <TableCell className="font-medium">{tool.tool_no || '-'}</TableCell>
                                <TableCell>{tool.tool_name || tool.tool_type || '-'}</TableCell>
                                <TableCell>{tool.tool_type || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("inline-block size-3 rounded-full", getStatusColor(tool.status))}></span>
                                        {capitalizeStatus(tool.status)}
                                    </div>
                                </TableCell>
                                <TableCell>{tool.name}</TableCell>
                                <TableCell>{tool.yr_sec}</TableCell>
                                <TableCell>
                                    {tool.time_in && tool.time_in !== '-' ? (
                                        <>
                                            <div>{new Date(tool.time_in).toLocaleTimeString()}</div>
                                            <div>{new Date(tool.time_in).toLocaleDateString()}</div>
                                        </>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => handleTimeOutClick(tool.tool_id, 'tool')}
                                        disabled={!['Borrowed', 'Occupied'].map(s => s.toLowerCase()).includes(tool.status.toLowerCase())}
                                        variant={['Borrowed', 'Occupied'].map(s => s.toLowerCase()).includes(tool.status.toLowerCase()) ? 'timeout' : 'outline'}
                                        size="icon"
                                    >
                                        <Clock className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        );
    };

    // derive unique types dynamically from the data
    const uniqueCubicleTypes = Array.from(new Set(cubicles.map(c => c.cubicle_type))).filter(Boolean) as string[];

    // Backend already separates Musical Instruments and Audio Visual Equipment
    // Use allInstrumentsForFilter for office dropdown (includes ALL instruments, not just current page)
    const allInstrumentsData = [...musicalInstruments.data, ...audioVisualEquipment.data];

    // Flatten all tools from toolsByCategory for timeout search
    const allToolsData: ToolData[] = Object.values(toolsByCategory).flatMap(category => 
        category.data.map(item => ({
            tool_id: item.instrument_id,
            tool_no: item.instrument_no,
            tool_type: item.instrument_type,
            tool_name: item.instrument_name,
            office: item.office,
            status: item.status,
            name: item.name,
            yr_sec: item.yr_sec,
            time_in: item.time_in,
        } as ToolData))
    );

    // Get unique offices for filtering - use allInstrumentsForFilter to get ALL offices
    const instrumentOffices = Array.from(new Set(
        allInstrumentsForFilter
            .map(i => i.office)
            .filter(Boolean)
    )) as string[];

    const toolOffices = Array.from(new Set(
        allInstrumentsForFilter
            .filter(i => {
                const category = i.instrument_type.toLowerCase();
                return category !== 'musical instruments' && 
                       category !== 'audio visual equipment' && 
                       category !== 'audiovisual equipment';
            })
            .map(i => i.office)
            .filter(Boolean)
    )) as string[];

    // Office filtering is now handled by backend, no need for frontend filtering

    // If redirected here after booking, read the flag and open the Instruments tab with the desired type
    // (this mirrors behavior from Dashboard booking flow)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('afterBooking');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.tab === 'Instruments') {
                    setSelectedFilter('Instruments');
                    setSelectedType(parsed?.type || 'All');
                }
                sessionStorage.removeItem('afterBooking');
            }
        } catch (e) {
            // ignore JSON errors
            console.error('Error reading afterBooking flag:', e);
        }
    }, []);
    

    return (
        <AppLayout>
            <Head title="Resources" />
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-2">Resources Overview</h1>
                <p className="text-muted-foreground mb-4">
                    View all music room cubicles and instruments with their real-time status at a glance. Easily check availability to plan your practice or booking efficiently.
                </p>

                <Card className="mb-6 pt-1 pb-7 gap-1">
                    <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-pink-500" />
                            <CardTitle className="text-lg font-semibold">Filters:</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                        <div className="flex gap-2" role="group" aria-label="Filter by category">
                            <Button 
                                variant={selectedFilter === 'Cubicles' ? 'default' : 'outline'}
                                onClick={() => {
                                    setSelectedFilter('Cubicles');
                                    router.get('/resources?filter=Cubicles', {}, { 
                                        preserveState: false,
                                        preserveScroll: true,
                                        only: ['cubicles', 'musicalInstruments', 'audioVisualEquipment', 'toolsByCategory', 'allInstrumentsForFilter', 'selectedOffice']
                                    });
                                }}
                            >
                                Cubicles
                            </Button>
                            <Button 
                                variant={selectedFilter === 'Instruments' ? 'default' : 'outline'}
                                onClick={() => {
                                    setSelectedFilter('Instruments');
                                    router.get('/resources?filter=Instruments', {}, { 
                                        preserveState: false,
                                        preserveScroll: true,
                                        only: ['cubicles', 'musicalInstruments', 'audioVisualEquipment', 'toolsByCategory', 'allInstrumentsForFilter', 'selectedOffice']
                                    });
                                }}
                            >
                                Instruments
                            </Button>
                            <Button 
                                variant={selectedFilter === 'Tools' ? 'default' : 'outline'}
                                onClick={() => {
                                    setSelectedFilter('Tools');
                                    router.get('/resources?filter=Tools', {}, { 
                                        preserveState: false,
                                        preserveScroll: true,
                                        only: ['cubicles', 'musicalInstruments', 'audioVisualEquipment', 'toolsByCategory', 'allInstrumentsForFilter', 'selectedOffice']
                                    });
                                }}
                            >
                                Tools
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center space-x-2">
                            <span className="font-medium">{selectedFilter === 'Cubicles' ? 'Type:' : 'Office:'}</span>
                            <Select 
                                onValueChange={(value) => {
                                    setSelectedType(value);
                                    // Navigate with office parameter to trigger backend filtering
                                    const currentFilter = selectedFilter;
                                    router.get(`/resources?filter=${currentFilter}&office=${value}`, {}, { 
                                        preserveState: false,
                                        preserveScroll: true,
                                        only: ['cubicles', 'musicalInstruments', 'audioVisualEquipment', 'toolsByCategory', 'allInstrumentsForFilter', 'selectedOffice']
                                    });
                                }} 
                                value={selectedType}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="All">All {selectedFilter === 'Cubicles' ? 'Types' : 'Offices'}</SelectItem>
                                    {selectedFilter === 'Cubicles' && (
                                        <>
                                            {uniqueCubicleTypes.filter(t => t !== 'MTL').map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </>
                                    )}
                                    {selectedFilter === 'Instruments' && (
                                        <>
                                            {instrumentOffices.map(office => (
                                                <SelectItem key={office} value={office}>
                                                    {office}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}
                                    {selectedFilter === 'Tools' && (
                                        <>
                                            {toolOffices.map(office => (
                                                <SelectItem key={office} value={office}>{office}</SelectItem>
                                            ))}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedFilter === 'Cubicles' && (
                    <>
                        {uniqueCubicleTypes.filter(type => type !== 'MTL').map((type) => 
                            (selectedType === 'All' || selectedType === type) ? (
                                <div key={type} className="mb-8">
                                    <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2">
                                        {type} Cubicles
                                    </h2>
                                    {renderCubicleTable(cubicles.filter(c => c.cubicle_type === type), `${type} Cubicles`)}
                                </div>
                            ) : null
                        )}
                    </>
                )}

                {selectedFilter === 'Instruments' && (
                    <>
                        {/* Musical Instruments Section */}
                        {musicalInstruments.data.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2">
                                    Musical Instruments
                                </h2>
                                {renderInstrumentTable(musicalInstruments.data, 'Musical Instruments')}
                                
                                {/* Pagination for Musical Instruments */}
                                <div className="flex justify-center items-center mt-4">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationFirst 
                                                    href={musicalInstruments.current_page === 1 ? "#" : `${musicalInstruments.path}?filter=Instruments&office=${selectedType}&musical_page=1`} 
                                                    onClick={(e) => {
                                                        if (musicalInstruments.current_page === 1) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${musicalInstruments.path}?filter=Instruments&office=${selectedType}&musical_page=1`);
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationPrevious 
                                                    href={musicalInstruments.current_page === 1 ? "#" : `${musicalInstruments.prev_page_url}&filter=Instruments&office=${selectedType}` || "#"} 
                                                    onClick={(e) => {
                                                        if (musicalInstruments.current_page === 1) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${musicalInstruments.prev_page_url}&filter=Instruments&office=${selectedType}` || "#");
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <span className="px-2">{musicalInstruments.current_page} of {musicalInstruments.last_page}</span>
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationNext 
                                                    href={musicalInstruments.current_page === musicalInstruments.last_page ? "#" : `${musicalInstruments.next_page_url}&filter=Instruments&office=${selectedType}` || "#"} 
                                                    onClick={(e) => {
                                                        if (musicalInstruments.current_page === musicalInstruments.last_page) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${musicalInstruments.next_page_url}&filter=Instruments&office=${selectedType}` || "#");
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLast 
                                                    href={musicalInstruments.current_page === musicalInstruments.last_page ? "#" : `${musicalInstruments.path}?filter=Instruments&office=${selectedType}&musical_page=${musicalInstruments.last_page}`} 
                                                    onClick={(e) => {
                                                        if (musicalInstruments.current_page === musicalInstruments.last_page) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${musicalInstruments.path}?filter=Instruments&office=${selectedType}&musical_page=${musicalInstruments.last_page}`);
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        )}

                        {/* Audio Visual Equipment Section */}
                        {audioVisualEquipment.data.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2">
                                    Audio Visual Equipment
                                </h2>
                                {renderInstrumentTable(audioVisualEquipment.data, 'Audio Visual Equipment')}
                                
                                {/* Pagination for Audio Visual Equipment */}
                                <div className="flex justify-center items-center mt-4">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationFirst 
                                                    href={audioVisualEquipment.current_page === 1 ? "#" : `${audioVisualEquipment.path}?filter=Instruments&office=${selectedType}&audio_visual_page=1`} 
                                                    onClick={(e) => {
                                                        if (audioVisualEquipment.current_page === 1) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${audioVisualEquipment.path}?filter=Instruments&office=${selectedType}&audio_visual_page=1`);
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationPrevious 
                                                    href={audioVisualEquipment.current_page === 1 ? "#" : `${audioVisualEquipment.prev_page_url}&filter=Instruments&office=${selectedType}` || "#"} 
                                                    onClick={(e) => {
                                                        if (audioVisualEquipment.current_page === 1) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${audioVisualEquipment.prev_page_url}&filter=Instruments&office=${selectedType}` || "#");
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <span className="px-2">{audioVisualEquipment.current_page} of {audioVisualEquipment.last_page}</span>
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationNext 
                                                    href={audioVisualEquipment.current_page === audioVisualEquipment.last_page ? "#" : `${audioVisualEquipment.next_page_url}&filter=Instruments&office=${selectedType}` || "#"} 
                                                    onClick={(e) => {
                                                        if (audioVisualEquipment.current_page === audioVisualEquipment.last_page) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${audioVisualEquipment.next_page_url}&filter=Instruments&office=${selectedType}` || "#");
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLast 
                                                    href={audioVisualEquipment.current_page === audioVisualEquipment.last_page ? "#" : `${audioVisualEquipment.path}?filter=Instruments&office=${selectedType}&audio_visual_page=${audioVisualEquipment.last_page}`} 
                                                    onClick={(e) => {
                                                        if (audioVisualEquipment.current_page === audioVisualEquipment.last_page) {
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            router.get(`${audioVisualEquipment.path}?filter=Instruments&office=${selectedType}&audio_visual_page=${audioVisualEquipment.last_page}`);
                                                        }
                                                    }}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {selectedFilter === 'Tools' && (
                    <>
                        {Object.keys(toolsByCategory).length > 0 ? (
                            Object.entries(toolsByCategory).map(([category, paginatedTools]) => (
                                <div key={category} className="mb-8">
                                    <h2 className="text-xl font-bold text-pink-600 mb-4 border-b-2 border-pink-200 pb-2">
                                        {category}
                                    </h2>
                                    {renderToolTable(paginatedTools.data.map(item => ({
                                        tool_id: item.instrument_id,
                                        tool_no: item.instrument_no,
                                        tool_type: item.instrument_type,
                                        tool_name: item.instrument_name,
                                        office: item.office,
                                        status: item.status,
                                        name: item.name,
                                        yr_sec: item.yr_sec,
                                        time_in: item.time_in,
                                    } as ToolData)), category)}
                                    
                                    {/* Pagination for each tool category */}
                                    <div className="flex justify-center items-center mt-4">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationFirst 
                                                        href={paginatedTools.current_page === 1 ? "#" : `${paginatedTools.path}?filter=Tools&office=${selectedType}&${paginatedTools.path.split('pageName=')[1] || 'page'}=1`} 
                                                        onClick={(e) => {
                                                            if (paginatedTools.current_page === 1) {
                                                                e.preventDefault();
                                                            } else {
                                                                e.preventDefault();
                                                                const pageName = category.toLowerCase().replace(/ /g, '_') + '_page';
                                                                router.get(`${paginatedTools.path}?filter=Tools&office=${selectedType}&${pageName}=1`);
                                                            }
                                                        }}
                                                    />
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationPrevious 
                                                        href={paginatedTools.current_page === 1 ? "#" : `${paginatedTools.prev_page_url}&filter=Tools&office=${selectedType}` || "#"} 
                                                        onClick={(e) => {
                                                            if (paginatedTools.current_page === 1) {
                                                                e.preventDefault();
                                                            } else {
                                                                e.preventDefault();
                                                                router.get(`${paginatedTools.prev_page_url}&filter=Tools&office=${selectedType}` || "#");
                                                            }
                                                        }}
                                                    />
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <span className="px-2">{paginatedTools.current_page} of {paginatedTools.last_page}</span>
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationNext 
                                                        href={paginatedTools.current_page === paginatedTools.last_page ? "#" : `${paginatedTools.next_page_url}&filter=Tools&office=${selectedType}` || "#"} 
                                                        onClick={(e) => {
                                                            if (paginatedTools.current_page === paginatedTools.last_page) {
                                                                e.preventDefault();
                                                            } else {
                                                                e.preventDefault();
                                                                router.get(`${paginatedTools.next_page_url}&filter=Tools&office=${selectedType}` || "#");
                                                            }
                                                        }}
                                                    />
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationLast 
                                                        href={paginatedTools.current_page === paginatedTools.last_page ? "#" : `${paginatedTools.path}?filter=Tools&office=${selectedType}&${category.toLowerCase().replace(' ', '_')}_page=${paginatedTools.last_page}`} 
                                                        onClick={(e) => {
                                                            if (paginatedTools.current_page === paginatedTools.last_page) {
                                                                e.preventDefault();
                                                            } else {
                                                                e.preventDefault();
                                                                const pageName = category.toLowerCase().replace(' ', '_') + '_page';
                                                                router.get(`${paginatedTools.path}?filter=Tools&office=${selectedType}&${pageName}=${paginatedTools.last_page}`);
                                                            }
                                                        }}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Card className="mb-6">
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No tools found for the selected office.
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmationModal}
                onClose={handleCloseModals}
                onConfirm={confirmTimeOut}
                title="Confirm Timeout"
                message="Are you sure? This will time-out the student and end their current session. This action cannot be undone."
                confirmText="Confirm Timeout"
            />

            {/* Success Modal */}
            <SuccessTimeoutModal
                isOpen={showSuccessModal}
                onClose={handleCloseModals}
                timeoutDetails={timeoutDetails}
            />

            {/* Failure Modal */}
            <FailureModal
                isOpen={showFailureModal}
                onClose={handleCloseModals}
                errorMessage={timeoutMessage}
                studentDetails={{ studentId: 'N/A', name: 'N/A', availableTime: 'N/A' }} // Placeholder
            />
        </AppLayout>
    );
}
