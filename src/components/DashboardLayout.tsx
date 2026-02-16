import { ReactNode, useState, useRef, useEffect, createContext, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  User,
  Settings,
  HelpCircle,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Search Context — so Index.tsx can read the query                    */
/* ------------------------------------------------------------------ */

interface SearchCtx {
  searchQuery: string;
}
const SearchContext = createContext<SearchCtx>({ searchQuery: "" });
export const useSearchQuery = () => useContext(SearchContext).searchQuery;

/* ------------------------------------------------------------------ */
/* Mock notifications                                                  */
/* ------------------------------------------------------------------ */

const NOTIFICATIONS = [
  {
    id: 1,
    icon: ShieldAlert,
    color: "text-destructive",
    title: "High-risk refund blocked",
    desc: "₹1,24,500 from catalyst-sandbox flagged for GeoMismatch",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    icon: AlertTriangle,
    color: "text-warning",
    title: "Unusual login pattern",
    desc: "User priya.m@mail.com — 3 cities in 10 min",
    time: "18 min ago",
    unread: true,
  },
  {
    id: 3,
    icon: MapPin,
    color: "text-primary",
    title: "Impossible jump detected",
    desc: "Device DEV-0x7F moved 729km in 4 min",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: 4,
    icon: ShieldAlert,
    color: "text-muted-foreground",
    title: "Weekly risk report ready",
    desc: "23 new flagged transactions to review",
    time: "3 hr ago",
    unread: false,
  },
  {
    id: 5,
    icon: AlertTriangle,
    color: "text-muted-foreground",
    title: "ML model retrained",
    desc: "Anomaly detection v2.3 deployed",
    time: "5 hr ago",
    unread: false,
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  /* ── Date navigation ── */
  const [dateOffset, setDateOffset] = useState(0);
  const getDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  /* ── Search ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Notification panel ── */
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifs.filter((n) => n.unread).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  const dismissNotif = (id: number) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Keyboard shortcut: Ctrl+K to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <SearchContext.Provider value={{ searchQuery }}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {pageName}
              </h2>
              <span className="text-muted-foreground/40">|</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs text-success">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search transactions…  ⌘K"
                  className={cn(
                    "h-9 rounded-lg border bg-card/50 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-all",
                    searchFocused
                      ? "w-[300px] border-primary/40 ring-1 ring-primary/40"
                      : "w-[220px] border-border/60"
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  className={cn(
                    "relative flex items-center justify-center h-9 w-9 rounded-lg border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all",
                    notifOpen ? "border-primary/40 text-foreground" : "border-border/60"
                  )}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-[10px] font-semibold text-white flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-12 w-[360px] bg-card rounded-xl border border-border/60 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                      <h4 className="text-xs font-semibold text-foreground">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] font-medium text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">No notifications</div>
                      ) : (
                        notifs.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 border-b border-border/10 hover:bg-accent/40 transition-colors group",
                              n.unread && "bg-primary/[0.03]"
                            )}
                          >
                            <div className={cn("mt-0.5 flex-shrink-0", n.color)}>
                              <n.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground flex items-center gap-2">
                                {n.title}
                                {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.desc}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Date */}
              <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-card/50">
                <button
                  onClick={() => setDateOffset((d) => d - 1)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-xs font-medium text-foreground select-none">{getDate()}</span>
                <button
                  onClick={() => setDateOffset((d) => Math.min(d + 1, 0))}
                  className={cn(
                    "transition-colors",
                    dateOffset >= 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"
                  )}
                  disabled={dateOffset >= 0}
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Profile */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2.5 pl-3 border-l border-border/40 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-medium text-foreground leading-none">Alex Morgen</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">@alexmorgen</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[11px] font-bold text-white">
                    AM
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-[200px] glass-card rounded-xl border border-border/60 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-border/30">
                      <p className="text-xs font-semibold text-foreground">Alex Morgen</p>
                      <p className="text-[10px] text-muted-foreground">alex.morgen@fraudx.io</p>
                    </div>
                    {[
                      { icon: User, label: "My Profile", action: () => { } },
                      { icon: Settings, label: "Settings", action: () => navigate("/settings") },
                      { icon: HelpCircle, label: "Help & Support", action: () => { } },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setProfileOpen(false);
                          item.action();
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-foreground hover:bg-accent/60 transition-colors"
                      >
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-border/30">
                      <button
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>



          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
