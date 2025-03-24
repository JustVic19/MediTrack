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

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "meditrack-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or use default
    const savedTheme = localStorage.getItem(storageKey);
    // Make sure the saved theme is valid (light or dark)
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return defaultTheme;
  });

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Create value object with setter that persists to localStorage
  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
      // Apply theme immediately for instant feedback
      applyTheme(newTheme);
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