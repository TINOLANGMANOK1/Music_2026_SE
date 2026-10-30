import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth/auth-simple-layout';
import { home } from '@/routes';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { type FormEventHandler, useState, useEffect } from 'react';
import LoginSuccessModal from '@/components/LoginSuccessModal';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    loginSuccess?: boolean;
}

export default function Login({ status, canResetPassword, loginSuccess }: LoginProps) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
    const [countdown, setCountdown] = useState<number>(0);
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Check for login success from backend
    // Check for login success from backend
    useEffect(() => {
        if (loginSuccess) {
            setShowSuccess(true);
        }
    }, [loginSuccess]);

    // Handle rate limiting countdown
    useEffect(() => {
        const errorsAny = errors as any;
        if (errorsAny.lockout_seconds) {
            const seconds = parseInt(errorsAny.lockout_seconds as string);
            setLockoutSeconds(seconds);
            setCountdown(seconds);
        }
    }, [errors]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setLockoutSeconds(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [countdown]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            preserveScroll: true,
            onSuccess: () => {
                // Only on successful login, we'll get redirected
                // The backend handles the redirect with X-Inertia-Location header
            },
            onError: (errors) => {
                // Errors will be automatically shown via InputError components
                // The form will stay on the page with error messages visible
            },
        });
    };

    // Handle redirect when modal is confirmed
    const handleModalConfirm = () => {
        setShowSuccess(false);
        setIsRedirecting(true);
        // Redirect to dashboard immediately without delay
        window.location.href = home().url;
    };

    return (
        <AuthLayout
            title="College of Music System"
            description="A Digital Solution for Efficient Record-Keeping"
        >
            <Head title="Log in" />

            {status && !showSuccess && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        required
                        autoFocus
                        autoComplete="email"
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Username or Email"
                        className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-pink-600"
                        disabled={lockoutSeconds > 0}
                    />
                    {lockoutSeconds > 0 ? (
                        <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                            <span className="font-semibold">Too many login attempts.</span>
                            <span>Please try again in</span>
                            <span className="font-bold text-lg text-red-700">{countdown}s</span>
                        </div>
                    ) : (
                        <InputError message={errors.email} className="mt-2" />
                    )}
                </div>

                <div className="mt-4">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-2">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            required
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-pink-600 pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                            disabled={lockoutSeconds > 0}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 z-10"
                            disabled={lockoutSeconds > 0}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between mt-4">
                    {canResetPassword && (
                        <Link href="/forgot-password" className="text-sm text-pink-600 hover:underline">
                            Forgot Password?
                        </Link>
                    )}
                </div>

                <div className="mt-6">
                    <Button type="submit" className="w-full" disabled={processing || isRedirecting || lockoutSeconds > 0}>
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {lockoutSeconds > 0 ? `Wait ${countdown}s` : 'Login'}
                    </Button>
                </div>
            </form>

            <LoginSuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                onConfirm={handleModalConfirm}
            />
        </AuthLayout>
    );
}