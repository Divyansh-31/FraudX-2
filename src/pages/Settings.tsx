import { useState } from "react";
import { User, Bell, Shield, Moon, Monitor, Globe, Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { DashboardLayout } from "@/components/DashboardLayout";

const TABS = [
    { id: "general", label: "General", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Monitor },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState("general");
    const { theme, setTheme } = useTheme();

    // Mock state
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Switch Component (Local)
    function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={cn(
                    "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    checked ? "bg-primary" : "bg-input"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                        checked ? "translate-x-4" : "translate-x-0"
                    )}
                />
            </button>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar / Tabs */}
                    <aside className="w-full md:w-64 min-w-[240px] flex flex-col gap-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                                    activeTab === tab.id
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 w-full max-w-2xl glass-card border border-border/40 rounded-xl p-6 md:p-8">
                        <div className="mb-6 pb-6 border-b border-border/40">
                            <h2 className="text-lg font-semibold">{TABS.find((t) => t.id === activeTab)?.label}</h2>
                        </div>

                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        AM
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium">Alex Morgen</h4>
                                        <p className="text-sm text-muted-foreground">alex.morgen@fraudx.io</p>
                                        <button className="mt-2 text-xs text-primary font-medium hover:underline">
                                            Change Avatar
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-4 max-w-md">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue="Alex Morgen"
                                            className="h-9 rounded-lg border border-border/60 bg-secondary/30 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</label>
                                        <input
                                            type="text"
                                            value="Senior Risk Analyst"
                                            disabled
                                            className="h-9 rounded-lg border border-border/60 bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Alerts</h4>

                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10">
                                                <Globe className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Email Notifications</p>
                                                <p className="text-xs text-muted-foreground">Receive daily fraud summaries</p>
                                            </div>
                                        </div>
                                        <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-500/10">
                                                <Smartphone className="h-4 w-4 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Push Notifications</p>
                                                <p className="text-xs text-muted-foreground">Instant alerts for Critical risks</p>
                                            </div>
                                        </div>
                                        <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Authentication</h4>

                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/10">
                                                <Shield className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Two-Factor Authentication</p>
                                                <p className="text-xs text-muted-foreground">Secure your account with 2FA</p>
                                            </div>
                                        </div>
                                        <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                                    </div>

                                    <div className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-3">
                                        <p className="text-sm font-medium">Change Password</p>
                                        <div className="grid gap-2">
                                            <input
                                                type="password"
                                                placeholder="Current Password"
                                                className="h-9 rounded-lg border border-border/60 bg-secondary/30 px-3 text-sm focus:border-primary focus:outline-none"
                                            />
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="New Password"
                                                    className="h-9 w-full rounded-lg border border-border/60 bg-secondary/30 px-3 text-sm focus:border-primary focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </div>
                                        <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors">
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "preferences" && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearance</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "light", label: "Light", icon: Moon, active: theme === "light" },
                                            { value: "dark", label: "Dark", icon: Moon, active: theme === "dark" },
                                        ].map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => setTheme(t.value as "light" | "dark")}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                                    t.active
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-border/40 hover:border-border/60 hover:bg-accent/40 text-muted-foreground"
                                                )}
                                            >
                                                <t.icon className="h-5 w-5" />
                                                <span className="text-xs font-medium">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
