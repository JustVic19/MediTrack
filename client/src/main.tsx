import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

// Simple theme initialization for light/dark only
const initializeTheme = () => {
  const storedTheme = localStorage.getItem("meditrack-theme");
  // Apply the stored theme if it's valid
  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    // Default to light mode otherwise
    document.documentElement.classList.add("light");
  }
};

// Run theme initialization before rendering
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="meditrack-theme">
    <App />
  </ThemeProvider>
);
