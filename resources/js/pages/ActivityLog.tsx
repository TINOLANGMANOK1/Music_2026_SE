import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationFirst, PaginationLast } from '@/components/ui/pagination';
import { format } from 'date-fns';
import { CalendarIcon, Filter } from 'lucide-react';

interface Log {
    name: string;
    yr_sec: string;
    item_type: string;
    item_name?: string;
    item_number: string;
    time_in: string;
    time_out: string | null;
    consumed_minutes: number | null;
}

interface PaginatedLogs {
    current_page: number;
    data: Log[];
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    last_page: number;
}

interface ActivityLogProps {
    logs: PaginatedLogs;
    filters: {
        table?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    };
    filterOptions: string[];
}

export default function ActivityLog({ logs, filters, filterOptions }: ActivityLogProps) {
    const [selectedTable, setSelectedTable] = useState(filters.table || 'cubicles');
    const [selectedType, setSelectedType] = useState(filters.type || 'All');
    const [startDate, setStartDate] = useState<Date | null>(filters.startDate ? new Date(filters.startDate) : null);
    const [endDate, setEndDate] = useState<Date | null>(filters.endDate ? new Date(filters.endDate) : null);

    const handleTableChange = (value: string) => {
        setSelectedTable(value);
        setSelectedType('All'); // Reset type filter when table changes
        const params: Record<string, string> = {
            table: value,
            type: 'All',
            page: '1'
        };
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        router.get('/activity-log', params, { preserveState: true, replace: true });
    };

    const handleTypeChange = (value: string) => {
        setSelectedType(value);
        const params: Record<string, string> = {
            table: selectedTable,
            type: value,
            page: '1'
        };
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        router.get('/activity-log', params, { preserveState: true, replace: true });
    };

    const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
        setStartDate(range?.from || null);
        setEndDate(range?.to || null);
        const params: Record<string, string> = {
            table: selectedTable,
            type: selectedType,
            page: '1'
        };
        if (range?.from) params.startDate = format(range.from, 'yyyy-MM-dd');
        if (range?.to) params.endDate = format(range.to, 'yyyy-MM-dd');
        router.get('/activity-log', params, { preserveState: true, replace: true });
    };

    const handleClearFilters = () => {
        setSelectedTable('cubicles');
        setSelectedType('All');
        setStartDate(null);
        setEndDate(null);
        router.get('/activity-log', {}, { preserveState: true, replace: true });
    };

    return (
        <AppLayout>
            <Head title="Activity Log" />
            <div className="p-10">
                <h1 className="text-2xl font-bold mb-2">Activity Log</h1>
                <p className="text-muted-foreground mb-4">Track your room booking requests, instrument borrowing requests, confirmations, and updates—all in one place.</p>

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
                                variant={selectedTable === 'cubicles' ? 'default' : 'outline'}
                                onClick={() => handleTableChange('cubicles')}
                            >
                                Cubicles
                            </Button>
                            <Button 
                                variant={selectedTable === 'instruments' ? 'default' : 'outline'}
                                onClick={() => handleTableChange('instruments')}
                            >
                                Instruments
                            </Button>
                            <Button 
                                variant={selectedTable === 'tools' ? 'default' : 'outline'}
                                onClick={() => handleTableChange('tools')}
                            >
                                Tools
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{selectedTable === 'cubicles' ? 'Type:' : 'Office:'}</span>
                                <Select onValueChange={handleTypeChange} value={selectedType}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={selectedTable === 'cubicles' ? 'Select type' : 'Select office'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">{selectedTable === 'cubicles' ? 'All Types' : 'All Offices'}</SelectItem>
                                        {filterOptions.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Date Range:</span>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className="justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate && endDate ? (
                                            `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`
                                        ) : (
                                            <span>Select Date Range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={{ from: startDate || undefined, to: endDate || undefined }}
                                        onSelect={handleDateRangeChange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            </div>
                            <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Yr & Sec</TableHead>
                                    <TableHead>{selectedTable === 'cubicles' ? 'Cubicle' : selectedTable === 'instruments' ? 'Instrument' : 'Tool'} Type</TableHead>
                                    {selectedTable !== 'cubicles' && <TableHead>Item Name</TableHead>}
                                    <TableHead>{selectedTable === 'cubicles' ? 'Cubicle' : selectedTable === 'instruments' ? 'Instrument' : 'Tool'} No.</TableHead>
                                    <TableHead>Time in</TableHead>
                                    <TableHead>Time out</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time Consumed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.map((row, index) => (
                                    <TableRow key={`${row.name}-${row.time_in}-${index}`}>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.yr_sec}</TableCell>
                                        <TableCell>{row.item_type}</TableCell>
                                        {selectedTable !== 'cubicles' && <TableCell>{row.item_name || 'N/A'}</TableCell>}
                                        <TableCell>{row.item_number}</TableCell>
                                        <TableCell>{format(new Date(row.time_in), 'hh:mm a')}</TableCell>
                                        <TableCell>
                                            {row.time_out ? (
                                                format(new Date(row.time_out), 'hh:mm a')
                                            ) : (
                                                <span className="text-green-600 dark:text-green-400 font-medium">Ongoing</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{format(new Date(row.time_in), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>
                                            {(() => {
                                                if (row.consumed_minutes !== null) {
                                                    const hours = Math.floor(row.consumed_minutes / 60);
                                                    const minutes = row.consumed_minutes % 60;
                                                    let timeString = '';
                                                    if (hours > 0) timeString += `${hours} hr `;
                                                    if (minutes > 0) timeString += `${minutes} min`;
                                                    if (timeString.trim() === '' && row.consumed_minutes === 0) return '0 min';
                                                    return timeString.trim();
                                                } else if (row.time_out !== null) {
                                                    // Calculate consumed minutes if time_out is available but consumed_minutes is null
                                                    const timeIn = new Date(row.time_in);
                                                    const timeOut = new Date(row.time_out);
                                                    const diffMs = timeOut.getTime() - timeIn.getTime();
                                                    const calculatedMinutes = Math.floor(diffMs / (1000 * 60));

                                                    const hours = Math.floor(calculatedMinutes / 60);
                                                    const minutes = calculatedMinutes % 60;
                                                    let timeString = '';
                                                    if (hours > 0) timeString += `${hours} hr `;
                                                    if (minutes > 0) timeString += `${minutes} min`;
                                                    if (timeString.trim() === '' && calculatedMinutes === 0) return '0 min';
                                                    return timeString.trim();
                                                }
                                                return <span className="text-gray-400">-</span>; // If both consumed_minutes and time_out are null
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-center items-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationFirst href={logs.current_page === 1 ? "#" : `${logs.path}?page=1`} disabled={logs.current_page === 1} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationPrevious href={logs.current_page === 1 ? "#" : logs.prev_page_url || "#"} disabled={logs.current_page === 1} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-2">{logs.current_page} of {logs.last_page}</span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext href={logs.current_page === logs.last_page ? "#" : logs.next_page_url || "#"} disabled={logs.current_page === logs.last_page} />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLast href={logs.current_page === logs.last_page ? "#" : `${logs.path}?page=${logs.last_page}`} disabled={logs.current_page === logs.last_page} />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
