import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <button
                    onClick={toggleTheme}
                    className="relative flex items-center justify-center h-9 w-9 rounded-lg border border-border/60 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all overflow-hidden"
                    aria-label="Toggle theme"
                >
                    <Sun
                        className="h-4 w-4 absolute transition-all duration-300"
                        style={{
                            opacity: theme === "light" ? 1 : 0,
                            transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
                        }}
                    />
                    <Moon
                        className="h-4 w-4 absolute transition-all duration-300"
                        style={{
                            opacity: theme === "dark" ? 1 : 0,
                            transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
                        }}
                    />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
                {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
        </Tooltip>
    );
}
