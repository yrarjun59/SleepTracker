import { DarkColors, LightColors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof DarkColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  // Load saved theme
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("@theme_mode");
      if (saved === "light" || saved === "dark") setMode(saved);
    })();
  }, []);

  // Persist changes
  const toggleTheme = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    AsyncStorage.setItem("@theme_mode", newMode);
  };

  const colors = mode === "dark" ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
