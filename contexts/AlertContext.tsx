import {
  CustomAlert,
  CustomAlertConfig
} from "@/components/CustomAlert";
import React, { createContext, useCallback, useContext, useState } from "react";

interface AlertContextType {
  showAlert: (config: Omit<CustomAlertConfig, "visible" | "onClose">) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig | null>(
    null,
  );

  const showAlert = useCallback(
    (config: Omit<CustomAlertConfig, "visible" | "onClose">) => {
      setAlertConfig({
        ...config,
        visible: true,
        onClose: () => setAlertConfig(null),
      });
    },
    [],
  );

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertConfig && <CustomAlert {...alertConfig} />}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
}
