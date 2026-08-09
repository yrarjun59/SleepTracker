import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type TimeFormat = "12h" | "24h";

interface SettingsContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (f: TimeFormat) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>("12h");

  // Load saved format on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("@time_format");
      if (saved === "24h" || saved === "12h") setTimeFormatState(saved);
    })();
  }, []);

  // Persist changes
  const setTimeFormat = async (format: TimeFormat) => {
    setTimeFormatState(format);
    await AsyncStorage.setItem("@time_format", format);
  };

  return (
    <SettingsContext.Provider value={{ timeFormat, setTimeFormat }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
