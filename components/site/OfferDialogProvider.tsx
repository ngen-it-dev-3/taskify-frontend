"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import OfferDialog from "./OfferDialog";

const OfferCtx = createContext<{ open: () => void }>({ open: () => {} });

export function useOffer() {
  return useContext(OfferCtx);
}

export default function OfferDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <OfferCtx.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <OfferDialog open={isOpen} onClose={() => setIsOpen(false)} />
    </OfferCtx.Provider>
  );
}