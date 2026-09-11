"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { VisitorState } from "@/lib/ladder";

const SUBSCRIBED_KEY = "okuhle_subscribed";

type Ctx = {
  state: VisitorState;
  /** Call after a successful newsletter signup so the ladder advances. */
  markSubscribed: () => void;
  ready: boolean;
};

const VisitorCtx = createContext<Ctx>({
  state: "anonymous",
  markSubscribed: () => {},
  ready: false,
});

/**
 * Resolves the visitor's rung on the commitment ladder.
 *
 * Today that means anonymous vs subscribed, read from this device. The
 * account/customer/repeat rungs need auth and real order history — they are
 * intentionally unreachable rather than guessed at.
 */
export function VisitorStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisitorState>("anonymous");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY) === "1") setState("subscribed");
    } catch {
      // storage blocked — everyone is treated as a first-time visitor, which is
      // the safe default for the ladder
    }
    setReady(true);
  }, []);

  const markSubscribed = () => {
    setState("subscribed");
    try {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <VisitorCtx.Provider value={{ state, markSubscribed, ready }}>{children}</VisitorCtx.Provider>
  );
}

export const useVisitorState = () => useContext(VisitorCtx);
