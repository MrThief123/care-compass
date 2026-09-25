"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

import type { BudgetState } from "./budget-edit";

/** What the last save left for one client (CHG-021). */
export interface HeldBudget extends BudgetState {
  clientId: string;
}

interface BudgetHolderValue {
  held: HeldBudget | null;
  /** Keeps a save's result, and whether Budget should announce it. */
  keep: (budget: HeldBudget, changed: boolean) => void;
  /** The next save's number (1, 2, …), so ids made by different saves never clash. */
  nextSave: () => number;
  /** True once after a save that changed something; reading it clears it. */
  takeAnnouncement: () => boolean;
}

const BudgetHolderContext = createContext<BudgetHolderValue | null>(null);

/**
 * The budget route's local state (CHG-021, DECISIONS.md FD-12), held by
 * `budget/layout.tsx` so it outlives the trip between Budget and Edit budget.
 * Phase 1: nothing is written anywhere, so a reload drops it and the contract's
 * figures show again. It holds one client's figures at a time; a view uses them
 * only when they are for its own client.
 */
export function BudgetHolder({ children }: { children: ReactNode }) {
  const [held, setHeld] = useState<HeldBudget | null>(null);
  const announce = useRef(false);
  const saves = useRef(0);

  const value: BudgetHolderValue = {
    held,
    keep(budget, changed) {
      setHeld(budget);
      announce.current = changed;
    },
    nextSave() {
      saves.current += 1;
      return saves.current;
    },
    takeAnnouncement() {
      const due = announce.current;
      announce.current = false;
      return due;
    },
  };

  return <BudgetHolderContext value={value}>{children}</BudgetHolderContext>;
}

export function useBudgetHolder(): BudgetHolderValue {
  const value = useContext(BudgetHolderContext);
  if (!value) throw new Error("useBudgetHolder must be used inside BudgetHolder");
  return value;
}

/** The figures to show for `clientId`: what a save left for it, else the contract's. */
export function useHeldBudget(clientId: string, fromContract: BudgetState): BudgetState {
  const { held } = useBudgetHolder();
  return held?.clientId === clientId ? held : fromContract;
}
