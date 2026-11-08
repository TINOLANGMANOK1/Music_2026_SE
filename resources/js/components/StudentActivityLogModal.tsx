import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';

export interface ActivityLogEntry {
    item_type: string;
    item_name?: string;
    item_number: string;
    time_in: string;
    time_out: string | null;
    consumed_minutes: number | null;
}

interface StudentActivityLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentId: string;
    yearSection?: string;
    mtlTimeRemaining?: number;
    logs: ActivityLogEntry[];
}

export default function StudentActivityLogModal({
    isOpen,
    onClose,
    studentName,
    studentId,
    yearSection,
    mtlTimeRemaining,
    logs,
}: StudentActivityLogModalProps) {
    const [filterType, setFilterType] = useState<'All' | 'Cubicle' | 'Instrument' | 'Tool'>('All');

    const formatDuration = (minutes: number | null) => {
        if (minutes === null) return 'Ongoing';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Filter logs based on selected type
    const filteredLogs = filterType === 'All' ? logs : logs.filter((log) => log.item_type === filterType);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] !max-w-none flex-col overflow-hidden p-0">
                <DialogHeader className="flex-shrink-0 border-b px-6 pt-6 pb-4">
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">My Activity Log</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    <div className="space-y-6 p-6">
                        {/* Student Info Card */}
                        <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 dark:border-pink-800 dark:from-pink-900/20 dark:to-purple-900/20">
                            <CardContent className="pt-4 pb-4">
                                <div className="grid grid-cols-4 gap-6">
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Student Name</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{studentName}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Student ID</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{studentId}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Year & Section</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{yearSection || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">MTL Time Remaining</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {mtlTimeRemaining !== undefined
                                                ? `${Math.floor(mtlTimeRemaining / 60)}hr ${mtlTimeRemaining % 60}min`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Filter Card matching Activity Log page */}
                        <Card className="pt-1 pb-4">
                            <CardContent className="pt-4">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="default"
                                        variant={filterType === 'All' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('All')}
                                    >
                                        All ({logs.length})
                                    </Button>
                                    <Button
                                        size="default"
                                        variant={filterType === 'Cubicle' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('Cubicle')}
                                    >
                                        Cubicles ({logs.filter((l) => l.item_type === 'Cubicle').length})
                                    </Button>
                                    <Button
                                        size="default"
                                        variant={filterType === 'Instrument' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('Instrument')}
                                    >
                                        Instruments ({logs.filter((l) => l.item_type === 'Instrument').length})
                                    </Button>
                                    <Button
                                        size="default"
                                        variant={filterType === 'Tool' ? 'default' : 'outline'}
                                        onClick={() => setFilterType('Tool')}
                                    >
                                        Tools ({logs.filter((l) => l.item_type === 'Tool').length})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Log Table Card matching Activity Log page */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {filteredLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                                        <svg
                                            className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="text-lg font-medium">
                                            No {filterType === 'All' ? 'activity' : filterType.toLowerCase()} records found
                                        </p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            {filterType === 'All'
                                                ? 'Your booking history will appear here'
                                                : `No ${filterType.toLowerCase()} bookings yet`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {filterType === 'Cubicle' && (
                                                        <>
                                                            <TableHead>Cubicle Type</TableHead>
                                                            <TableHead>Cubicle No.</TableHead>
                                                            <TableHead>Time in</TableHead>
                                                            <TableHead>Time out</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Time Consumed</TableHead>
                                                        </>
                                                    )}
                                                    {filterType === 'Instrument' && (
                                                        <>
                                                            <TableHead>Instrument Type</TableHead>
                                                            <TableHead>Item Name</TableHead>
                                                            <TableHead>Instrument No.</TableHead>
                                                            <TableHead>Time in</TableHead>
                                                            <TableHead>Time out</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Time Consumed</TableHead>
                                                        </>
                                                    )}
                                                    {filterType === 'Tool' && (
                                                        <>
                                                            <TableHead>Tool Type</TableHead>
                                                            <TableHead>Item Name</TableHead>
                                                            <TableHead>Tool No.</TableHead>
                                                            <TableHead>Time in</TableHead>
                                                            <TableHead>Time out</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Time Consumed</TableHead>
                                                        </>
                                                    )}
                                                    {filterType === 'All' && (
                                                        <>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Item Name</TableHead>
                                                            <TableHead>Item Number</TableHead>
                                                            <TableHead>Time in</TableHead>
                                                            <TableHead>Time out</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Time Consumed</TableHead>
                                                        </>
                                                    )}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredLogs.map((log, index) => {
                                                    const date = new Date(log.time_in).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    });
                                                    const timeIn = new Date(log.time_in).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                    });
                                                    const timeOut = log.time_out
                                                        ? new Date(log.time_out).toLocaleTimeString('en-US', {
                                                              hour: 'numeric',
                                                              minute: '2-digit',
                                                              hour12: true,
                                                          })
                                                        : null;
                                                    const duration = log.consumed_minutes ? formatDuration(log.consumed_minutes) : null;

                                                    return (
                                                        <TableRow key={index}>
                                                            {filterType === 'All' && (
                                                                <>
                                                                    <TableCell className="py-2 font-medium">
                                                                        <span
                                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                                log.item_type === 'Cubicle'
                                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                                    : log.item_type === 'Instrument'
                                                                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                            }`}
                                                                        >
                                                                            {log.item_type}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="py-2">{log.item_name || '-'}</TableCell>
                                                                    <TableCell className="py-2">{log.item_number}</TableCell>
                                                                    <TableCell className="py-2">{timeIn}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {timeOut ? (
                                                                            timeOut
                                                                        ) : (
                                                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                                                Ongoing
                                                                            </span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="py-2">{date}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {duration ? duration : <span className="text-gray-400">-</span>}
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                            {filterType === 'Cubicle' && (
                                                                <>
                                                                    <TableCell className="py-2">{log.item_name || 'Piano'}</TableCell>
                                                                    <TableCell className="py-2">{log.item_number}</TableCell>
                                                                    <TableCell className="py-2">{timeIn}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {timeOut ? (
                                                                            timeOut
                                                                        ) : (
                                                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                                                Ongoing
                                                                            </span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="py-2">{date}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {duration ? duration : <span className="text-gray-400">-</span>}
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                            {filterType === 'Instrument' && (
                                                                <>
                                                                    <TableCell className="py-2">Audio Visual Equipment</TableCell>
                                                                    <TableCell className="py-2">{log.item_name || 'Amplifier'}</TableCell>
                                                                    <TableCell className="py-2">{log.item_number}</TableCell>
                                                                    <TableCell className="py-2">{timeIn}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {timeOut ? (
                                                                            timeOut
                                                                        ) : (
                                                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                                                Ongoing
                                                                            </span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="py-2">{date}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {duration ? duration : <span className="text-gray-400">-</span>}
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                            {filterType === 'Tool' && (
                                                                <>
                                                                    <TableCell className="py-2">Equipment</TableCell>
                                                                    <TableCell className="py-2">{log.item_name || 'Microphone'}</TableCell>
                                                                    <TableCell className="py-2">{log.item_number}</TableCell>
                                                                    <TableCell className="py-2">{timeIn}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {timeOut ? (
                                                                            timeOut
                                                                        ) : (
                                                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                                                Ongoing
                                                                            </span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="py-2">{date}</TableCell>
                                                                    <TableCell className="py-2">
                                                                        {duration ? duration : <span className="text-gray-400">-</span>}
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Footer with record count */}
                                {filteredLogs.length > 0 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-semibold">{filteredLogs.length}</span>{' '}
                                            {filteredLogs.length === 1 ? 'record' : 'records'}
                                            {filterType !== 'All' && <span className="ml-1">({filterType})</span>}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
