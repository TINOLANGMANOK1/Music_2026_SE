import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { ReportCategorySelection, ReportsByCategory } from '@/lib/reportExport';
import { reports as reportsRoute } from '@/routes';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface ReportEntry {
    item_type: string;
    usage_count: number;
}

interface ReportsProps {
    reports: ReportEntry[];
    filters: {
        table?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    };
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export default function Reports({ reports, filters }: ReportsProps) {
    const [selectedTable, setSelectedTable] = useState(filters.table || 'cubicles');
    const [selectedType] = useState(filters.type || 'All');
    const [startDate, setStartDate] = useState<Date | null>(filters.startDate ? new Date(filters.startDate) : null);
    const [endDate, setEndDate] = useState<Date | null>(filters.endDate ? new Date(filters.endDate) : null);
    const [exportCategory, setExportCategory] = useState<ReportCategorySelection>('All Categories');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const params = {
            table: selectedTable,
            type: selectedType,
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        };
        router.get(reportsRoute(), params, { preserveState: true, replace: true });
    }, [selectedTable, selectedType, startDate, endDate]);

    const chartData = useMemo(() => {
        if (reports.length === 0) {
            return [{ name: 'None', value: 1 }];
        }
        return reports.map((entry) => ({ name: entry.item_type, value: entry.usage_count }));
    }, [reports]);

    const handleClearDateRange = () => {
        setStartDate(null);
        setEndDate(null);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const category = exportCategory === 'All Categories' ? 'all' : exportCategory.toLowerCase();
            const params = new URLSearchParams({
                category,
                type: selectedType || 'All',
            });
            if (startDate) {
                params.set('startDate', format(startDate, 'yyyy-MM-dd'));
            }
            if (endDate) {
                params.set('endDate', format(endDate, 'yyyy-MM-dd'));
            }

            const reportsUrl = reportsRoute().url.replace(/\/$/, '');
            const response = await fetch(`${reportsUrl}/export-data?${params.toString()}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                throw new Error(`The export data request failed (${response.status} ${response.statusText}).`);
            }

            const payload: { reportsByCategory?: ReportsByCategory } = await response.json();
            if (!payload.reportsByCategory) {
                throw new Error('The export data response did not contain category report data.');
            }

            const options = {
                selectedCategory: exportCategory,
                reportsByCategory: payload.reportsByCategory,
                startDate,
                endDate,
            };
            if (exportFormat === 'pdf') {
                const { exportReportsToPdf } = await import('@/lib/reportExport');
                await exportReportsToPdf(options);
            } else {
                const { exportReportsToExcel } = await import('@/lib/reportExport');
                await exportReportsToExcel(options);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
            window.alert(`${exportFormat.toUpperCase()} export failed: ${message}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Reports" />
            <div className="p-10">
                <h1 className="mb-2 text-2xl font-bold">Reports</h1>
                <p className="mb-4 text-muted-foreground">Visualize resource usage with the filters below.</p>

                <Card className="mb-6 gap-1 pt-1 pb-7">
                    <CardHeader className="flex flex-row items-center gap-2 p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-pink-500" />
                            <CardTitle className="text-lg font-semibold">Filters:</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                        <div className="flex gap-2" role="group" aria-label="Filter by category">
                            <Button variant={selectedTable === 'cubicles' ? 'default' : 'outline'} onClick={() => setSelectedTable('cubicles')}>
                                Cubicles
                            </Button>
                            <Button variant={selectedTable === 'instruments' ? 'default' : 'outline'} onClick={() => setSelectedTable('instruments')}>
                                Instruments
                            </Button>
                            <Button variant={selectedTable === 'tools' ? 'default' : 'outline'} onClick={() => setSelectedTable('tools')}>
                                Tools
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">Date Range:</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={'outline'} className="justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate && endDate ? (
                                                `${format(startDate, 'PPP')} - ${format(endDate, 'PPP')}`
                                            ) : (
                                                <span>Select Date Range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={{ from: startDate || undefined, to: endDate || undefined }}
                                            onSelect={(range) => {
                                                setStartDate(range?.from || null);
                                                setEndDate(range?.to || null);
                                            }}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button variant="outline" onClick={handleClearDateRange}>
                                    Clear
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline">
                                            Export Reports
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 space-y-4" align="start">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium" htmlFor="export-category">
                                                Category
                                            </label>
                                            <Select
                                                value={exportCategory}
                                                onValueChange={(value) => {
                                                    if (
                                                        value === 'All Categories' ||
                                                        value === 'Cubicles' ||
                                                        value === 'Instruments' ||
                                                        value === 'Tools'
                                                    ) {
                                                        setExportCategory(value);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="export-category">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All Categories">All Categories</SelectItem>
                                                    <SelectItem value="Cubicles">Cubicles</SelectItem>
                                                    <SelectItem value="Instruments">Instruments</SelectItem>
                                                    <SelectItem value="Tools">Tools</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium" htmlFor="export-format">
                                                File type
                                            </label>
                                            <Select
                                                value={exportFormat}
                                                onValueChange={(value) => {
                                                    if (value === 'pdf' || value === 'excel') {
                                                        setExportFormat(value);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="export-format">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                    <SelectItem value="excel">Excel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" className="w-full" disabled={isExporting} onClick={handleExport}>
                                            {isExporting ? 'Preparing export...' : 'Export'}
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.name === 'None' ? '#808080' : PIE_COLORS[index % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Report</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Type</TableHead>
                                        <TableHead>Usage Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{entry.item_type}</TableCell>
                                            <TableCell>{entry.usage_count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
