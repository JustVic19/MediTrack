import { Moon, Sun, Laptop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Function to determine active icon
  const getActiveIcon = () => {
    if (theme === "dark") {
      return <Moon className="h-[1.2rem] w-[1.2rem] text-primary" />;
    } else if (theme === "light") {
      return <Sun className="h-[1.2rem] w-[1.2rem] text-primary" />;
    } else {
      return (
        <>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </>
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 focus-visible:ring-1 focus-visible:ring-primary"
        >
          {getActiveIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={`flex items-center justify-between cursor-pointer ${theme === "light" ? "bg-secondary" : ""}`}
        >
          <div className="flex items-center">
            <Sun className={`mr-2 h-4 w-4 ${theme === "light" ? "text-primary" : ""}`} />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-between cursor-pointer ${theme === "dark" ? "bg-secondary" : ""}`}
        >
          <div className="flex items-center">
            <Moon className={`mr-2 h-4 w-4 ${theme === "dark" ? "text-primary" : ""}`} />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={`flex items-center justify-between cursor-pointer ${theme === "system" ? "bg-secondary" : ""}`}
        >
          <div className="flex items-center">
            <Laptop className={`mr-2 h-4 w-4 ${theme === "system" ? "text-primary" : ""}`} />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}