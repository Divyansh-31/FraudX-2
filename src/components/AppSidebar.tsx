import { useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BrainCircuit,
  Inbox,
  MapPin,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "ML Models", url: "/ml-models", icon: BrainCircuit },
  { title: "Inbound", url: "/inbound", icon: Inbox },
  { title: "Map", url: "/map", icon: MapPin },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="h-screen sticky top-0 flex flex-col w-[64px] border-r border-border/60 bg-sidebar">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border/40">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Tooltip key={item.url} delayDuration={0}>
              <TooltipTrigger asChild>
                <RouterNavLink
                  to={item.url}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] -ml-[12px] rounded-full bg-primary" />
                  )}
                  <item.icon className="h-[18px] w-[18px]" />
                </RouterNavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                {item.title}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="pb-4 flex flex-col items-center gap-1">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <RouterNavLink
              to="/settings"
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                location.pathname === "/settings"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Settings className="h-[18px] w-[18px]" />
            </RouterNavLink>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
