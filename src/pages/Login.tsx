import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, ArrowRight, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Mock credentials                                                   */
/* ------------------------------------------------------------------ */

const VALID_CREDENTIALS = {
    email: "admin@fraudx.io",
    password: "admin123",
};

/* ------------------------------------------------------------------ */
/*  Animated background grid                                           */
/* ------------------------------------------------------------------ */

function GridBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
          `,
                    backgroundSize: "60px 60px",
                }}
            />
            {/* Radial glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
                }}
            />
            {/* Floating orbs */}
            <motion.div
                animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
            />
            <motion.div
                animate={{ y: [15, -15, 15], x: [10, -10, 10] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[25%] right-[20%] w-48 h-48 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
            />
            <motion.div
                animate={{ y: [10, -20, 10] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[60%] left-[60%] w-24 h-24 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)" }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Stat pill for decoration                                           */
/* ------------------------------------------------------------------ */

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/50 border border-border/30 backdrop-blur-sm">
            <div className={cn("h-2 w-2 rounded-full", color)} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="text-[10px] font-semibold text-foreground">{value}</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Login Page                                                         */
/* ------------------------------------------------------------------ */

export default function Login() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [shakeKey, setShakeKey] = useState(0);

    const validate = () => {
        const errs: typeof errors = {};
        if (!email) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
        if (!password) errs.password = "Password is required";
        else if (password.length < 6) errs.password = "Minimum 6 characters";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            setShakeKey((k) => k + 1);
            return;
        }

        setLoading(true);

        // Simulate network delay
        await new Promise((r) => setTimeout(r, 1500));

        if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
            // Store auth state
            localStorage.setItem("fraudx_auth", JSON.stringify({ email, loggedIn: true, timestamp: Date.now() }));

            toast({
                title: "Welcome back!",
                description: "Redirecting to dashboard…",
            });

            setTimeout(() => navigate("/"), 400);
        } else {
            setLoading(false);
            setShakeKey((k) => k + 1);
            setErrors({ password: "Invalid email or password" });
            toast({
                title: "Authentication failed",
                description: "Please check your credentials and try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-background relative">
            <GridBackground />

            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
                {/* Content */}
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 mb-16"
                    >
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground tracking-tight">FraudX</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Command Center</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight mb-4">
                            Real-time fraud
                            <br />
                            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                detection & prevention
                            </span>
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                            Monitor transactions, detect anomalies, and block fraudulent activities
                            before they impact your business. Powered by ML-driven risk scoring.
                        </p>
                    </motion.div>
                </div>

                {/* Bottom stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative z-10 space-y-4"
                >
                    <div className="flex flex-wrap gap-2">
                        <StatPill label="Blocked today" value="₹12.4L" color="bg-destructive" />
                        <StatPill label="Risk score" value="94/100" color="bg-warning" />
                        <StatPill label="Uptime" value="99.97%" color="bg-success" />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">
                        © 2026 FraudX Systems · Enterprise Security Platform
                    </p>
                </motion.div>

                {/* Decorative gradient border on right */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent" />
            </div>

            {/* Right Panel — Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-[400px]"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                            <Shield className="h-4.5 w-4.5 text-white" />
                        </div>
                        <span className="text-base font-bold text-foreground">FraudX</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Sign in</h2>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Enter your credentials to access the command center
                        </p>
                    </div>

                    {/* Form */}
                    <motion.form
                        key={shakeKey}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-medium text-foreground">
                                Email address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                                    placeholder="admin@fraudx.io"
                                    className={cn(
                                        "h-11 pl-10 bg-card/50 border-border/60 text-foreground placeholder:text-muted-foreground/50 transition-all",
                                        errors.email && "border-destructive/60 focus-visible:ring-destructive/40"
                                    )}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                            {errors.email && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[11px] text-destructive font-medium"
                                >
                                    {errors.email}
                                </motion.p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                                    Password
                                </Label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        toast({
                                            title: "Password reset",
                                            description: "Check your email for a reset link.",
                                        })
                                    }
                                    className="text-[11px] text-primary hover:underline font-medium"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                                    placeholder="••••••••"
                                    className={cn(
                                        "h-11 pl-10 pr-11 bg-card/50 border-border/60 text-foreground placeholder:text-muted-foreground/50 transition-all",
                                        errors.password && "border-destructive/60 focus-visible:ring-destructive/40"
                                    )}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[11px] text-destructive font-medium"
                                >
                                    {errors.password}
                                </motion.p>
                            )}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(v) => setRememberMe(!!v)}
                                className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                                Keep me signed in for 30 days
                            </Label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all relative overflow-hidden group"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Authenticating…
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign in
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </motion.form>

                    <Separator className="my-6" />

                    {/* Demo credentials hint */}
                    <div
                        className="rounded-xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm"
                    >
                        <p className="text-[11px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-primary" />
                            Demo Credentials
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                                <button
                                    onClick={() => { setEmail(VALID_CREDENTIALS.email); setErrors({}); }}
                                    className="text-xs font-mono text-primary hover:underline cursor-pointer"
                                >
                                    admin@fraudx.io
                                </button>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Password</p>
                                <button
                                    onClick={() => { setPassword(VALID_CREDENTIALS.password); setErrors({}); }}
                                    className="text-xs font-mono text-primary hover:underline cursor-pointer"
                                >
                                    admin123
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
                        Protected by FraudX Enterprise Security · v3.2.1
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
