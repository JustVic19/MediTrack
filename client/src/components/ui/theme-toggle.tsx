import { Moon, Sun, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Add local state to ensure UI consistency
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("light");
  
  // Update the local state whenever the theme context changes
  useEffect(() => {
    // Check the actual DOM class to ensure consistency
    const isDark = document.documentElement.classList.contains("dark");
    setCurrentTheme(isDark ? "dark" : "light");
  }, [theme]);

  // Function to determine active icon based on current state
  const getActiveIcon = () => {
    if (currentTheme === "dark") {
      return <Moon className="h-[1.2rem] w-[1.2rem] text-primary" />;
    } else {
      return <Sun className="h-[1.2rem] w-[1.2rem] text-primary" />;
    }
  };

  // Direct handler functions to ensure theme changes properly
  const setLightTheme = () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.setItem("meditrack-theme", "light");
    setTheme("light");
    setCurrentTheme("light");
  };

  const setDarkTheme = () => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    localStorage.setItem("meditrack-theme", "dark");
    setTheme("dark");
    setCurrentTheme("dark");
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
          onClick={setLightTheme}
          className={`flex items-center justify-between cursor-pointer ${currentTheme === "light" ? "bg-secondary" : ""}`}
        >
          <div className="flex items-center">
            <Sun className={`mr-2 h-4 w-4 ${currentTheme === "light" ? "text-primary" : ""}`} />
            <span>Light</span>
          </div>
          {currentTheme === "light" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={setDarkTheme}
          className={`flex items-center justify-between cursor-pointer ${currentTheme === "dark" ? "bg-secondary" : ""}`}
        >
          <div className="flex items-center">
            <Moon className={`mr-2 h-4 w-4 ${currentTheme === "dark" ? "text-primary" : ""}`} />
            <span>Dark</span>
          </div>
          {currentTheme === "dark" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}