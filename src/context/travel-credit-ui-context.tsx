import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TravelCreditModal } from "@/components/travel-credit-modal";

type TravelCreditView = "balance" | "share" | "buy";

type TravelCreditUiContextValue = {
  openTravelCredits: (view?: TravelCreditView) => void;
};

const TravelCreditUiContext = createContext<TravelCreditUiContextValue | null>(null);

export function TravelCreditUiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialView, setInitialView] = useState<TravelCreditView>("balance");

  const openTravelCredits = useCallback((view: TravelCreditView = "balance") => {
    setInitialView(view);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openTravelCredits }), [openTravelCredits]);

  return (
    <TravelCreditUiContext.Provider value={value}>
      {children}
      <TravelCreditModal
        open={open}
        onOpenChange={setOpen}
        initialView={initialView}
        key={open ? initialView : "closed"}
      />
    </TravelCreditUiContext.Provider>
  );
}

export function useTravelCreditUi() {
  const ctx = useContext(TravelCreditUiContext);
  if (!ctx) {
    throw new Error("useTravelCreditUi must be used within TravelCreditUiProvider");
  }
  return ctx;
}
