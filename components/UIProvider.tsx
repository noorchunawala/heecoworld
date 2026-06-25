"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import AccountPanel from "@/components/AccountPanel";

type UIContextType = {
  openAccount: () => void;
  closeAccount: () => void;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        openAccount: () => setAccountOpen(true),
        closeAccount: () => setAccountOpen(false),
      }}
    >
      {children}

      <AccountPanel
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }

  return context;
}