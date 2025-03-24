import { createContext, useContext, useEffect, useState } from "react";

// Simplified theme type without "system" option
type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Apply theme to document root element
 */
const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;
  
  // Clear existing theme classes
  root.classList.remove("light", "dark");
  
  // Apply the theme
  root.classList.add(theme);
};

/**
 * Get the current theme from localStorage or DOM
 */
const getCurrentTheme = (storageKey: string, defaultTheme: Theme): Theme => {
  // First check localStorage
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  
  // Then check DOM (in case theme was set outside of React)
  if (typeof window !== "undefined") {
    if (document.documentElement.classList.contains("dark")) {
      return "dark";
    }
    if (document.documentElement.classList.contains("light")) {
      return "light";
    }
  }
  
  // Default fallback
  return defaultTheme;
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "meditrack-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => 
    getCurrentTheme(storageKey, defaultTheme)
  );

  // Apply theme whenever it changes and sync with localStorage
  useEffect(() => {
    // Update DOM
    applyTheme(theme);
    
    // Sync localStorage
    localStorage.setItem(storageKey, theme);
    
    // Add MutationObserver to detect theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "class" && 
          mutation.target === document.documentElement
        ) {
          const newTheme = document.documentElement.classList.contains("dark") 
            ? "dark" 
            : "light";
          
          if (newTheme !== theme) {
            setTheme(newTheme);
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["class"] 
    });
    
    // Cleanup
    return () => observer.disconnect();
  }, [theme, storageKey]);

  // Create value object with setter that persists to localStorage
  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      // Apply theme immediately for instant feedback
      applyTheme(newTheme);
      // Update state
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  
  return context;
}