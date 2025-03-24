import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

// Ensure dark mode is applied before rendering to avoid flash
const initializeTheme = () => {
  const storedTheme = localStorage.getItem("meditrack-theme");
  if (storedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (storedTheme === "light") {
    document.documentElement.classList.add("light");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  }
};

// Run theme initialization before rendering
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="meditrack-theme">
    <App />
  </ThemeProvider>
);
