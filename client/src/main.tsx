import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

// Enhanced theme initialization for light/dark only
const initializeTheme = () => {
  // Remove any existing theme classes first to avoid conflicts
  document.documentElement.classList.remove("light", "dark");
  
  // Check localStorage for user preference
  const storedTheme = localStorage.getItem("meditrack-theme");
  
  // Apply based on stored preference or default to light
  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.add("light");
    // Ensure localStorage has the correct value
    if (storedTheme !== "light") {
      localStorage.setItem("meditrack-theme", "light");
    }
  }
};

// Run theme initialization before rendering
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="meditrack-theme">
    <App />
  </ThemeProvider>
);
