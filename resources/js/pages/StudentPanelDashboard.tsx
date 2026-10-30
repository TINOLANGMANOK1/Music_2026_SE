import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginSuccessModal from '@/components/LoginSuccessModal';
import { useState, useEffect } from 'react';
import { 
    Music,
    Wrench,
    DoorOpen,
    Scan,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';

interface DashboardProps {
    auth: {
        user: {
            name: string;
            email: string;
            role: string;
        };
    };
    stats: {
        availableInstruments: number;
        availableTools: number;
        availableCubicles: number;
    };
    loginSuccess?: boolean;
}

export default function StudentPanelDashboard({ auth, stats, loginSuccess = false }: DashboardProps) {
    const [showLoginSuccess, setShowLoginSuccess] = useState(false);

    useEffect(() => {
        if (loginSuccess) {
            setShowLoginSuccess(true);
        }
    }, [loginSuccess]);

    return (
        <AppLayout>
            <Head title="Student Dashboard" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome, {auth.user.name}! 🎵
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            RFID Self-Service Booking Station
                        </p>
                    </div>

                    {/* RFID Instructions Card */}
                    <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Scan className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Scan Your RFID Card to Get Started
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        This is a self-service station. Place your student RFID card on the scanner to book or return items.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">To Book</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Scan card → Select item → Confirm booking</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                                            <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">To Return</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Scan card → Select active booking → Timeout</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available Resources Cards */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Resources</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Available Instruments */}
                            <Card className="bg-gradient-to-br from-purple-400 to-purple-500 text-white border-0 shadow-lg">
                                <CardContent className="pt-4 pb-3 px-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white/80 text-sm font-medium mb-0.5">Available Now</p>
                                            <h3 className="text-4xl font-bold leading-tight">{stats.availableInstruments}</h3>
                                            <p className="text-sm text-white/90">Instruments</p>
                                        </div>
                                        <div className="bg-white/20 rounded-full p-2 ml-2">
                                            <Music className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Available Tools */}
                            <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white border-0 shadow-lg">
                                <CardContent className="pt-4 pb-3 px-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white/80 text-sm font-medium mb-0.5">Available Now</p>
                                            <h3 className="text-4xl font-bold leading-tight">{stats.availableTools}</h3>
                                            <p className="text-sm text-white/90">Tools</p>
                                        </div>
                                        <div className="bg-white/20 rounded-full p-2 ml-2">
                                            <Wrench className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Available Cubicles */}
                            <Card className="bg-gradient-to-br from-pink-400 to-pink-500 text-white border-0 shadow-lg">
                                <CardContent className="pt-4 pb-3 px-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white/80 text-sm font-medium mb-0.5">Available Now</p>
                                            <h3 className="text-4xl font-bold leading-tight">{stats.availableCubicles}</h3>
                                            <p className="text-sm text-white/90">Cubicles</p>
                                        </div>
                                        <div className="bg-white/20 rounded-full p-2 ml-2">
                                            <DoorOpen className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Guidelines Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Booking Rules */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    How to Use
                                </CardTitle>
                                <CardDescription>
                                    Quick guide to booking resources
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <span className="text-purple-500 font-bold mt-0.5">🎸</span>
                                        <div>
                                            <span className="font-semibold text-gray-900 dark:text-white">Instruments:</span>
                                            <span className="text-gray-600 dark:text-gray-400"> Check with staff for booking duration limits</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <span className="text-green-500 font-bold mt-0.5">🔧</span>
                                        <div>
                                            <span className="font-semibold text-gray-900 dark:text-white">Tools:</span>
                                            <span className="text-gray-600 dark:text-gray-400"> Available for short-term use, return promptly</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <span className="text-pink-500 font-bold mt-0.5">🚪</span>
                                        <div>
                                            <span className="font-semibold text-gray-900 dark:text-white">Cubicles:</span>
                                            <span className="text-gray-600 dark:text-gray-400"> Practice rooms available during open hours</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <span className="text-blue-500 font-bold mt-0.5">�</span>
                                        <div>
                                            <span className="font-semibold text-gray-900 dark:text-white">General:</span>
                                            <span className="text-gray-600 dark:text-gray-400"> Follow department policies and return items on time</span>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Important Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                    Important Notes
                                </CardTitle>
                                <CardDescription>
                                    Please read before booking
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <div className="flex items-start gap-2">
                                            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm mb-1">
                                                    Return on Time
                                                </h4>
                                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                    Late returns may result in booking restrictions or penalties
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm mb-1">
                                                    Handle with Care
                                                </h4>
                                                <p className="text-xs text-red-800 dark:text-red-200">
                                                    You're responsible for any damage to borrowed items
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
                                                    Need Help?
                                                </h4>
                                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                                    Contact Student Assistant or Music Dean for assistance
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Login Success Modal */}
            <LoginSuccessModal
                isOpen={showLoginSuccess}
                onClose={() => setShowLoginSuccess(false)}
                onConfirm={() => setShowLoginSuccess(false)}
            />
        </AppLayout>
    );
}
