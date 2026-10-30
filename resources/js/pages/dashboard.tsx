import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BarChart, XAxis, YAxis, Bar, PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area, CartesianGrid } from 'recharts';
import { CalendarIcon, Square, Guitar, Wrench, Plus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import BookCubicleModal from '@/components/BookCubicleModal';
import BorrowInstrumentModal from '@/components/BorrowInstrumentModal';
import BorrowToolModal from '@/components/BorrowToolModal';
import StudentPanelRfidBookingModal from '@/components/StudentPanelRfidBookingModal';
import StudentPanelRfidActivityLogModal from '@/components/StudentPanelRfidActivityLogModal';
import SuccessModal from '@/components/SuccessModal';
import FailureModal from '@/components/FailureModal';
import LoginSuccessModal from '@/components/LoginSuccessModal';
import { useModalContext } from '@/contexts/ModalContext';
import { type SharedData } from '@/types';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"


interface CountData {
    total_count: number;
    available_count: number;
}

interface DashboardStats {
    pendingApprovals: number;
    itemsUnderRepair: number;
    mostBorrowedInstrument: { count: number; name: string };
    mostUsedCubicle: { count: number; type: string };
}

interface UtilizationData {
    year: string;
    cubicles: number;
    mtlCubicle: number;
    instruments: number;
    tools: number;
    total: number;
}

interface CubicleUsageData {
    category: string;
    sessions: number;
}

interface WeeklyUsageData {
    week: string;
    usage: number;
}

interface AssetCondition {
    id: number;
    type: 'asset' | 'cubicle';
    name: string;
    status: string;
    date: string;
    description: string;
    repair_image?: string | null;
    statusClass: string;
}

interface AssetChartData {
    name: string;
    value: number;
}

interface CeciliaHallBooking {
    id: number;
    purpose: string;
    date: string;
    time: string;
    status: string;
    student_name: string;
    email: string;
    booker_type: 'music_department' | 'external';
}

interface MTLBooking {
    id: number;
    name: string;
    email: string;
    date: string;
    start_time: string;
    end_time: string;
    purpose: string;
    status: string;
}

interface SemesterOption {
    label: string;
    value: string;
    start_date: string;
    end_date: string;
    months: number;
}

interface DayBooking {
    date: string;
    cubicles: number;
    instruments: number;
    tools: number;
    cecilia: number;
    total: number;
}

interface SemesterBookingsData {
    semester: SemesterOption;
    bookings: Record<string, DayBooking>;
}

interface DashboardProps {
    counts: {
        cubicles: Record<string, CountData>;
        instruments: Record<string, CountData>;
        tools: Record<string, CountData>;
    };
    stats: DashboardStats;
    utilizationByYear: UtilizationData[];
    cubicleUsage: CubicleUsageData[];
    weeklyUsageTrend: WeeklyUsageData[];
    combinedConditions: AssetCondition[];
    assetChart: AssetChartData[];
    ceciliaHallBookings: CeciliaHallBooking[];
    mtlBookings: MTLBooking[];
    availableSemesters: SemesterOption[];
    currentSemester: string;
    semesterBookings: SemesterBookingsData;
}

interface WeeklyToolUsageData {
    item_type: string;
    usage_count: number;
}

const chartConfig = {
    cubicles: {
      label: "Cubicles",
      color: "#0088FE",
    },
    instruments: {
      label: "Instruments",
      color: "#00C49F",
    },
    mtl: {
      label: "MTL",
      color: "#FFBB28",
    },
  } satisfies ChartConfig

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export default function Dashboard({ counts, stats, utilizationByYear, cubicleUsage, weeklyUsageTrend, combinedConditions, assetChart, ceciliaHallBookings, mtlBookings, availableSemesters, currentSemester, semesterBookings }: DashboardProps) {
    const page = usePage<SharedData>();
    const auth = page.props.auth;
    const [showLoginSuccess, setShowLoginSuccess] = useState(false);
    const [userName, setUserName] = useState('');
    
    const [cubicleInstrumentFromDate, setCubicleInstrumentFromDate] = useState<Date | null>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [cubicleInstrumentToDate, setCubicleInstrumentToDate] = useState<Date | null>(endOfWeek(new Date(), { weekStartsOn: 1 }));
    const [weeklyUsageData, setWeeklyUsageData] = useState<WeeklyUsageData[]>([]);
    const [equipmentFromDate, setEquipmentFromDate] = useState<Date | null>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [equipmentToDate, setEquipmentToDate] = useState<Date | null>(endOfWeek(new Date(), { weekStartsOn: 1 }));
    const [weeklyToolUsageData, setWeeklyToolUsageData] = useState<WeeklyToolUsageData[]>([]);
    
    // Cubicle usage by week state
    const [cubicleUsageFromDate, setCubicleUsageFromDate] = useState<Date | null>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [cubicleUsageToDate, setCubicleUsageToDate] = useState<Date | null>(endOfWeek(new Date(), { weekStartsOn: 1 }));
    const [weeklyCubicleUsageData, setWeeklyCubicleUsageData] = useState<CubicleUsageData[]>(cubicleUsage);
    const [isCubicleUsageLoading, setIsCubicleUsageLoading] = useState(false);
    
    // Utilization by semester state
    const [selectedUtilizationSemester, setSelectedUtilizationSemester] = useState(currentSemester);
    const [utilizationData, setUtilizationData] = useState(utilizationByYear);

    // Condition filter state
    const [conditionFilter, setConditionFilter] = useState<'all' | 'asset' | 'cubicle'>('all');
    
    // Booking type filter state
    const [bookingTypeFilter, setBookingTypeFilter] = useState<'cecilia' | 'mtl'>('cecilia');
    
    // Filter combined conditions based on selected filter
    const filteredConditions = combinedConditions.filter(condition => {
        if (conditionFilter === 'all') return true;
        return condition.type === conditionFilter;
    });

    // Show login success modal on first visit after login
    useEffect(() => {
        const hasSeenLoginSuccess = sessionStorage.getItem('hasSeenLoginSuccess');
        
        // Only show if user exists, hasn't seen it, and this is not a hot-reload
        if (auth?.user && !hasSeenLoginSuccess) {
            setUserName(auth.user.name || '');
            setShowLoginSuccess(true);
            sessionStorage.setItem('hasSeenLoginSuccess', 'true');
        }
    }, [auth?.user]);

    useEffect(() => {
        const fetchWeeklyToolUsage = async () => {
            if (equipmentFromDate && equipmentToDate) {
                try {
                    const response = await fetch(`/api/dashboard-chart/weekly-tool-usage?startDate=${format(equipmentFromDate, 'yyyy-MM-dd')}&endDate=${format(equipmentToDate, 'yyyy-MM-dd')}`);
                    const data = await response.json();
                    setWeeklyToolUsageData(data);
                } catch (error) {
                    console.error('Error fetching weekly tool usage data:', error);
                }
            }
        };

        fetchWeeklyToolUsage();

        const interval = setInterval(() => {
            fetchWeeklyToolUsage();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [equipmentFromDate, equipmentToDate]);

    const equipmentChartData = useMemo(() => {
        if (weeklyToolUsageData.length === 0) {
            return [{ name: 'None', value: 1 }];
        }
        return weeklyToolUsageData.map(d => ({ name: d.item_type, value: d.usage_count }));
    }, [weeklyToolUsageData]);

    useEffect(() => {
        const fetchWeeklyUsage = async () => {
            if (cubicleInstrumentFromDate && cubicleInstrumentToDate) {
                try {
                    const response = await fetch(`/api/dashboard-chart/weekly-usage?startDate=${format(cubicleInstrumentFromDate, 'yyyy-MM-dd')}&endDate=${format(cubicleInstrumentToDate, 'yyyy-MM-dd')}`);
                    const data = await response.json();
                    setWeeklyUsageData(data);
                } catch (error) {
                    console.error('Error fetching weekly usage data:', error);
                }
            }
        };

        fetchWeeklyUsage();

        const interval = setInterval(() => {
            fetchWeeklyUsage();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [cubicleInstrumentFromDate, cubicleInstrumentToDate]);

    const [isBookCubicleModalOpen, setIsBookCubicleModalOpen] = useState(false);
    const [isBorrowInstrumentModalOpen, setIsBorrowInstrumentModalOpen] = useState(false);
    const [isBorrowToolModalOpen, setIsBorrowToolModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<unknown | null>(null);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [failureDetails, setFailureDetails] = useState<unknown | null>(null);
    const [sharedStudentInfo, setSharedStudentInfo] = useState<any>(null);
    const [sharedInstrumentIds, setSharedInstrumentIds] = useState<number[]>([]);
    const [sharedToolIds, setSharedToolIds] = useState<number[]>([]);
    const [isFabOpen, setIsFabOpen] = useState(false);

    const { setIsAnyBorrowModalOpen } = useModalContext();

    useEffect(() => {
        const anyBorrowModalOpen = isBookCubicleModalOpen || isBorrowInstrumentModalOpen || isBorrowToolModalOpen;
        setIsAnyBorrowModalOpen(anyBorrowModalOpen);
    }, [isBookCubicleModalOpen, isBorrowInstrumentModalOpen, isBorrowToolModalOpen, setIsAnyBorrowModalOpen]);

    const getCount = (category: 'cubicles' | 'instruments' | 'tools', type: string, countType: 'total_count' | 'available_count') => {
        return counts[category][type]?.[countType] || 0;
    };

    const handleBookingSuccess = (details: unknown) => {
        setIsBookCubicleModalOpen(false);
        setIsBorrowInstrumentModalOpen(false);
        setIsBorrowToolModalOpen(false);
        setBookingDetails(details);
        setIsSuccessModalOpen(true);
    };

    const handleBookingFailure = (details: unknown) => {
        setIsBookCubicleModalOpen(false);
        setIsBorrowInstrumentModalOpen(false);
        setIsBorrowToolModalOpen(false);
        setFailureDetails(details);
        setIsFailureModalOpen(true);
    };

    const handleCubicleInstrumentWeekSelect = (value: string) => {
        const today = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (value) {
            case "thisWeek":
                start = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
                end = endOfWeek(today, { weekStartsOn: 1 });   // Week ends on Sunday
                break;
            case "lastWeek":
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case "twoWeeksAgo":
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);
                start = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
                end = endOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
                break;
            case "threeWeeksAgo":
                const threeWeeksAgo = new Date();
                threeWeeksAgo.setDate(today.getDate() - 21);
                start = startOfWeek(threeWeeksAgo, { weekStartsOn: 1 });
                end = endOfWeek(threeWeeksAgo, { weekStartsOn: 1 });
                break;
            default:
                break;
        }
        console.log(start, end);
        setCubicleInstrumentFromDate(start);
        setCubicleInstrumentToDate(end);
    };

    const handleEquipmentWeekSelect = (value: string) => {
        const today = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (value) {
            case "thisWeek":
                start = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
                end = endOfWeek(today, { weekStartsOn: 1 });   // Week ends on Sunday
                break;
            case "lastWeek":
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case "twoWeeksAgo":
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);
                start = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
                end = endOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
                break;
            case "threeWeeksAgo":
                const threeWeeksAgo = new Date();
                threeWeeksAgo.setDate(today.getDate() - 21);
                start = startOfWeek(threeWeeksAgo, { weekStartsOn: 1 });
                end = endOfWeek(threeWeeksAgo, { weekStartsOn: 1 });
                break;
            default:
                break;
        }
        setEquipmentFromDate(start);
        setEquipmentToDate(end);
    };

    const handleCubicleUsageWeekSelect = (value: string) => {
        const today = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (value) {
            case "thisWeek":
                start = startOfWeek(today, { weekStartsOn: 1 });
                end = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case "lastWeek":
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case "twoWeeksAgo":
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);
                start = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
                end = endOfWeek(twoWeeksAgo, { weekStartsOn: 1 });
                break;
            case "threeWeeksAgo":
                const threeWeeksAgo = new Date();
                threeWeeksAgo.setDate(today.getDate() - 21);
                start = startOfWeek(threeWeeksAgo, { weekStartsOn: 1 });
                end = endOfWeek(threeWeeksAgo, { weekStartsOn: 1 });
                break;
            default:
                break;
        }
        setCubicleUsageFromDate(start);
        setCubicleUsageToDate(end);
    };

    useEffect(() => {
        const fetchWeeklyCubicleUsage = async () => {
            if (cubicleUsageFromDate && cubicleUsageToDate) {
                setIsCubicleUsageLoading(true);
                try {
                    const response = await fetch(`/api/dashboard-chart/weekly-cubicle-usage?startDate=${format(cubicleUsageFromDate, 'yyyy-MM-dd')}&endDate=${format(cubicleUsageToDate, 'yyyy-MM-dd')}`);
                    const data = await response.json();
                    setWeeklyCubicleUsageData(data);
                } catch (error) {
                    console.error('Error fetching weekly cubicle usage data:', error);
                    // Set default structure with zero values on error
                    setWeeklyCubicleUsageData([
                        { category: 'Guitar', sessions: 0 },
                        { category: 'Piano', sessions: 0 },
                        { category: 'MTL', sessions: 0 }
                    ]);
                } finally {
                    setIsCubicleUsageLoading(false);
                }
            }
        };

        fetchWeeklyCubicleUsage();

        const interval = setInterval(() => {
            fetchWeeklyCubicleUsage();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [cubicleUsageFromDate, cubicleUsageToDate]);


    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="p-4 md:p-10">
                <h1 className="text-3xl font-bold mb-2">Homepage</h1>
                <p className="text-muted-foreground mb-6">
                    Your central hub for music room reservations and instrument management in one place.
                </p>

                {/* Top Stats Cards with Gradient - Admin Management Focus */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    {/* Pending Approvals */}
                    <Card className="bg-gradient-to-br from-pink-400 to-pink-500 text-white border-0 shadow-lg">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm font-medium mb-0.5">Pending Approvals</p>
                                    <h3 className="text-4xl font-bold leading-tight">{stats.pendingApprovals}</h3>
                                    <p className="text-sm text-white/90">Needs Action</p>
                                </div>
                                <div className="bg-white/20 rounded-full p-2 ml-2">
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Most Borrowed Instrument */}
                    <Card className="bg-gradient-to-br from-pink-500 to-red-500 text-white border-0 shadow-lg">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm font-medium mb-0.5">Most Borrowed Instrument</p>
                                    <h3 className="text-4xl font-bold leading-tight">{stats.mostBorrowedInstrument.count}</h3>
                                    <p className="text-sm text-white/90 truncate">{stats.mostBorrowedInstrument.name}</p>
                                </div>
                                <div className="bg-white/20 rounded-full p-2 ml-2">
                                    <Guitar className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Most Used Cubicle */}
                    <Card className="bg-gradient-to-br from-red-500 to-orange-500 text-white border-0 shadow-lg">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm font-medium mb-0.5">Most Used Cubicle</p>
                                    <h3 className="text-4xl font-bold leading-tight">{stats.mostUsedCubicle.count}</h3>
                                    <p className="text-sm text-white/90 truncate">{stats.mostUsedCubicle.type}</p>
                                </div>
                                <div className="bg-white/20 rounded-full p-2 ml-2">
                                    <Square className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Under Repair */}
                    <Card className="bg-gradient-to-br from-orange-400 to-pink-400 text-white border-0 shadow-lg">
                        <CardContent className="pt-4 pb-3 px-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm font-medium mb-0.5">Items Under Repair</p>
                                    <h3 className="text-4xl font-bold leading-tight">{stats.itemsUnderRepair}</h3>
                                    <p className="text-sm text-white/90">Needs Attention</p>
                                </div>
                                <div className="bg-white/20 rounded-full p-2 ml-2">
                                    <Wrench className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Dashboard Grid - Left Column (2/3) + Right Column (1/3) */}
                <div className="grid gap-4 lg:grid-cols-3 mb-6">
                    {/* Left Column - All Charts (2/3 width) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Resources Usage Line Chart - Shadcn Style */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resources Usage</CardTitle>
                                <CardDescription>
                                    Showing total usage for the last 12 weeks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <ChartContainer 
                                    config={{
                                        usage: {
                                            label: "Usage",
                                            color: "#ec4899",
                                        },
                                    }}
                                    className="h-[280px] w-full"
                                >
                                    <AreaChart
                                        accessibilityLayer
                                        data={weeklyUsageTrend}
                                        margin={{
                                            left: 0,
                                            right: 0,
                                            top: 10,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.8} />
                                        <XAxis
                                            dataKey="week"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis 
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dot" />}
                                        />
                                        <Area
                                            dataKey="usage"
                                            type="monotone"
                                            fill="var(--color-usage)"
                                            fillOpacity={0.4}
                                            stroke="var(--color-usage)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Resources Utilization by Year - Shadcn Style */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>Resources Utilization</CardTitle>
                                        <CardDescription>Usage breakdown by year level</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">Semester:</span>
                                        <Select 
                                            value={selectedUtilizationSemester} 
                                            onValueChange={(value) => {
                                                setSelectedUtilizationSemester(value);
                                                // Fetch new utilization data for selected semester
                                                router.get('/dashboard', { utilizationSemester: value }, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    only: ['utilizationByYear'],
                                                    onSuccess: (page: any) => {
                                                        setUtilizationData(page.props.utilizationByYear);
                                                    }
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="w-[200px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] overflow-y-auto">
                                                {availableSemesters.map((semester) => (
                                                    <SelectItem key={semester.value} value={semester.value} className="text-xs">
                                                        {semester.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <ChartContainer
                                    config={{
                                        cubicles: {
                                            label: "Cubicles",
                                            color: "#0088FE",
                                        },
                                        mtlCubicle: {
                                            label: "MTL Cubicle",
                                            color: "#ec4899",
                                        },
                                        instruments: {
                                            label: "Instruments",
                                            color: "#00C49F",
                                        },
                                        tools: {
                                            label: "Tools",
                                            color: "#FFBB28",
                                        },
                                    }}
                                    className="h-[280px] w-full"
                                >
                                    <BarChart
                                        accessibilityLayer
                                        data={utilizationData}
                                        margin={{
                                            left: 0,
                                            right: 0,
                                            top: 10,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis
                                            dataKey="year"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar
                                            dataKey="cubicles"
                                            stackId="a"
                                            fill="var(--color-cubicles)"
                                            radius={[0, 0, 4, 4]}
                                        />
                                        <Bar
                                            dataKey="mtlCubicle"
                                            stackId="a"
                                            fill="var(--color-mtlCubicle)"
                                            radius={[0, 0, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="instruments"
                                            stackId="a"
                                            fill="var(--color-instruments)"
                                            radius={[0, 0, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="tools"
                                            stackId="a"
                                            fill="var(--color-tools)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Bottom Row - Cubicle Usage and Asset Chart in 2 columns */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Cubicle Usage */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>Cubicle Usage</CardTitle>
                                            <CardDescription>Weekly sessions</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">Week:</span>
                                            <Select defaultValue="thisWeek" onValueChange={handleCubicleUsageWeekSelect}>
                                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="thisWeek" className="text-xs">This Week</SelectItem>
                                                    <SelectItem value="lastWeek" className="text-xs">Last Week</SelectItem>
                                                    <SelectItem value="twoWeeksAgo" className="text-xs">2 Weeks Ago</SelectItem>
                                                    <SelectItem value="threeWeeksAgo" className="text-xs">3 Weeks Ago</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative">
                                    {isCubicleUsageLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                                <p className="text-sm text-muted-foreground">Loading...</p>
                                            </div>
                                        </div>
                                    )}
                                    <ChartContainer
                                        config={{
                                            sessions: {
                                                label: "Sessions",
                                                color: "#ec4899",
                                            },
                                        }}
                                        className="h-[250px] w-full"
                                    >
                                        <BarChart
                                            accessibilityLayer
                                            data={weeklyCubicleUsageData}
                                            layout="vertical"
                                            margin={{
                                                left: 0,
                                            }}
                                        >
                                            <YAxis
                                                dataKey="category"
                                                type="category"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                            />
                                            <XAxis dataKey="sessions" type="number" hide />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Bar dataKey="sessions" layout="vertical" radius={5} fill="#ec4899" />
                                        </BarChart>
                                    </ChartContainer>
                                    {!isCubicleUsageLoading && weeklyCubicleUsageData.every(d => d.sessions === 0) && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <p className="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-lg">
                                                No usage data for this week
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Asset Chart - Donut */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Asset Distribution</CardTitle>
                                    <p className="text-sm text-muted-foreground">By category</p>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={assetChart} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                innerRadius={60}
                                                outerRadius={80} 
                                                paddingAngle={2}
                                            >
                                                <Cell fill="#0088FE" />
                                                <Cell fill="#00C49F" />
                                                <Cell fill="#FFBB28" />
                                                <Cell fill="#FF8042" />
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column - Cecilia Hall Booking & Equipment Conditions (1/3 width, full height) */}
                    <div className="space-y-4">
                        {/* Cecilia Hall & MTL Bookings */}
                        <Card className="h-[605px] flex flex-col">
                            <CardHeader className="flex-shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <CardTitle>{bookingTypeFilter === 'cecilia' ? 'Cecilia Hall Booking' : 'MTL Booking'}</CardTitle>
                                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                                        <button
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                bookingTypeFilter === 'cecilia'
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                            onClick={() => setBookingTypeFilter('cecilia')}
                                        >
                                            Cecilia Hall
                                        </button>
                                        <button
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                bookingTypeFilter === 'mtl'
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                            onClick={() => setBookingTypeFilter('mtl')}
                                        >
                                            MTL
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">Recent bookings</p>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col pb-2 overflow-hidden">
                                <div className="space-y-2 flex-1 overflow-y-auto pr-2 px-1 py-1">
                                    {bookingTypeFilter === 'cecilia' ? (
                                        ceciliaHallBookings && ceciliaHallBookings.length > 0 ? (
                                            ceciliaHallBookings.slice(0, 8).map((booking) => (
                                                <div 
                                                    key={booking.id}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                                                        booking.status === 'pending' 
                                                            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:border-yellow-300 dark:hover:border-yellow-700'
                                                            : booking.status === 'approved'
                                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700'
                                                            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700'
                                                    }`}
                                                    onClick={() => {
                                                        const sanitizedId = encodeURIComponent(String(booking.id));
                                                        router.visit(`/cecilia-hall?bookingId=${sanitizedId}`);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm line-clamp-1 mb-2">{booking.purpose}</p>
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <Badge 
                                                                    className={
                                                                        booking.status === 'pending' 
                                                                            ? 'bg-yellow-500' 
                                                                            : booking.status === 'approved' 
                                                                            ? 'bg-green-500' 
                                                                            : booking.status === 'completed'
                                                                            ? 'bg-blue-500'
                                                                            : 'bg-red-500'
                                                                    }
                                                                >
                                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {booking.booker_type === 'external' ? '🏢 External' : '🎵 Music Dept'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {booking.date} • {booking.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {booking.student_name}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p className="text-sm">No recent Cecilia Hall bookings</p>
                                            </div>
                                        )
                                    ) : (
                                        mtlBookings && mtlBookings.length > 0 ? (
                                            mtlBookings.slice(0, 8).map((booking) => (
                                                <div 
                                                    key={booking.id}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                                                        booking.status === 'pending' 
                                                            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:border-yellow-300 dark:hover:border-yellow-700'
                                                            : booking.status === 'approved'
                                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700'
                                                            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700'
                                                    }`}
                                                    onClick={() => {
                                                        const sanitizedId = encodeURIComponent(String(booking.id));
                                                        router.visit(`/mtl-booking?bookingId=${sanitizedId}`);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm line-clamp-1 mb-2">{booking.purpose || 'MTL Session'}</p>
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <Badge 
                                                                    className={
                                                                        booking.status === 'pending' 
                                                                            ? 'bg-yellow-500' 
                                                                            : booking.status === 'approved' 
                                                                            ? 'bg-green-500' 
                                                                            : booking.status === 'completed'
                                                                            ? 'bg-blue-500'
                                                                            : 'bg-red-500'
                                                                    }
                                                                >
                                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                                    🎹 MTL
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {booking.date} • {booking.start_time} - {booking.end_time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {booking.name}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p className="text-sm">No recent MTL bookings</p>
                                            </div>
                                        )
                                    )}
                                </div>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full mt-3" 
                                    size="sm"
                                    onClick={() => router.visit(bookingTypeFilter === 'cecilia' ? '/cecilia-hall' : '/mtl-booking')}
                                >
                                    View All {bookingTypeFilter === 'cecilia' ? 'Cecilia Hall' : 'MTL'} Bookings
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Equipment Conditions */}
                        <Card className="h-[605px] flex flex-col">
                            <CardHeader className="flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>Equipment Conditions</CardTitle>
                                        <p className="text-sm text-muted-foreground">Recent maintenance</p>
                                    </div>
                                    <Select value={conditionFilter} onValueChange={(value: any) => setConditionFilter(value)}>
                                        <SelectTrigger className="w-[110px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-xs">All</SelectItem>
                                            <SelectItem value="asset" className="text-xs">Assets</SelectItem>
                                            <SelectItem value="cubicle" className="text-xs">Cubicles</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden pb-2">
                                <div className="space-y-3 h-full overflow-y-auto pr-2">
                                    {filteredConditions.length > 0 ? (
                                        filteredConditions.map((item, index) => (
                                            <div 
                                                key={index} 
                                                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                                                    item.status === 'Under Repair' 
                                                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700'
                                                        : item.status === 'Maintenance'
                                                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/30 hover:border-orange-300 dark:hover:border-orange-700'
                                                        : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:border-yellow-300 dark:hover:border-yellow-700'
                                                }`}
                                                onClick={() => {
                                                    const page = item.type === 'asset' ? '/inventory' : '/manage-cubicles';
                                                    router.visit(`${page}?openId=${item.id}`);
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-sm">{item.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                                                item.status === 'Under Repair'
                                                                    ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                                                                    : item.status === 'Maintenance'
                                                                    ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
                                                                    : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                {item.type === 'asset' ? 'Asset' : 'Cubicle'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>All equipment in good condition</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>

            {/* Book Cubicle Modal */}
            <BookCubicleModal
                isOpen={isBookCubicleModalOpen}
                onClose={() => setIsBookCubicleModalOpen(false)}
                onBookingSuccess={handleBookingSuccess}
                onBookingFailure={handleBookingFailure}
            />

            {/* Borrow Instrument Modal */}
            <BorrowInstrumentModal
                isOpen={isBorrowInstrumentModalOpen}
                onClose={() => {
                    setIsBorrowInstrumentModalOpen(false);
                    setSharedStudentInfo(null);
                    setSharedInstrumentIds([]);
                    setSharedToolIds([]);
                }}
                onBookingSuccess={handleBookingSuccess}
                onBookingFailure={handleBookingFailure}
                preFilledStudent={sharedStudentInfo}
                onStudentInfoChange={setSharedStudentInfo}
                preFilledInstrumentIds={sharedInstrumentIds}
                preFilledToolIds={sharedToolIds}
                onInstrumentSelectionChange={setSharedInstrumentIds}
                onSwitchToTool={() => {
                    setIsBorrowInstrumentModalOpen(false);
                    setIsBorrowToolModalOpen(true);
                }}
            />

            {/* Borrow Tool Modal */}
            <BorrowToolModal
                isOpen={isBorrowToolModalOpen}
                onClose={() => {
                    setIsBorrowToolModalOpen(false);
                    setSharedStudentInfo(null);
                    setSharedInstrumentIds([]);
                    setSharedToolIds([]);
                }}
                onBookingSuccess={handleBookingSuccess}
                onBookingFailure={handleBookingFailure}
                preFilledStudent={sharedStudentInfo}
                onStudentInfoChange={setSharedStudentInfo}
                preFilledInstrumentIds={sharedInstrumentIds}
                preFilledToolIds={sharedToolIds}
                onToolSelectionChange={setSharedToolIds}
                onSwitchToInstrument={() => {
                    setIsBorrowToolModalOpen(false);
                    setIsBorrowInstrumentModalOpen(true);
                }}
            />

            {/* Success Modal */}
            {bookingDetails && (
                <SuccessModal
                    isOpen={isSuccessModalOpen}
                    onClose={() => {
                        setIsSuccessModalOpen(false);
                        setBookingDetails(null);
                    }}
                    bookingDetails={bookingDetails as any}
                />
            )}

            {/* Failure Modal */}
            {failureDetails && (
                <FailureModal
                    isOpen={isFailureModalOpen}
                    onClose={() => {
                        setIsFailureModalOpen(false);
                        setFailureDetails(null);
                    }}
                    errorMessage={(failureDetails as any)?.errorMessage}
                    studentDetails={(failureDetails as any)?.studentDetails}
                />
            )}

            {/* Login Success Modal - Informational only, user already on dashboard */}
            <LoginSuccessModal
                isOpen={showLoginSuccess}
                onClose={() => setShowLoginSuccess(false)}
                onConfirm={() => setShowLoginSuccess(false)}
                userName={userName}
            />

            {/* Floating Action Button */}
            <div className="fixed bottom-8 right-8 z-50">
                {/* Popup Menu */}
                {isFabOpen && (
                    <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
                        <Button
                            variant="default"
                            className="shadow-lg flex items-center justify-start w-full min-w-[180px]"
                            onClick={() => {
                                setIsBookCubicleModalOpen(true);
                                setIsFabOpen(false);
                            }}
                        >
                            <Square className="mr-2 h-4 w-4" />
                            Book Cubicle
                        </Button>
                        <Button
                            variant="default"
                            className="shadow-lg flex items-center justify-start w-full min-w-[180px]"
                            onClick={() => {
                                setIsBorrowInstrumentModalOpen(true);
                                setIsFabOpen(false);
                            }}
                        >
                            <Guitar className="mr-2 h-4 w-4" />
                            Borrow Instrument
                        </Button>
                        <Button
                            variant="default"
                            className="shadow-lg flex items-center justify-start w-full min-w-[180px]"
                            onClick={() => {
                                setIsBorrowToolModalOpen(true);
                                setIsFabOpen(false);
                            }}
                        >
                            <Wrench className="mr-2 h-4 w-4" />
                            Borrow Tools
                        </Button>
                    </div>
                )}
                
                {/* Main FAB Button */}
                <Button
                    size="lg"
                    className={`rounded-full h-14 w-14 shadow-lg transition-transform ${isFabOpen ? 'rotate-45' : ''}`}
                    onClick={() => setIsFabOpen(!isFabOpen)}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </AppLayout>
    );
}
