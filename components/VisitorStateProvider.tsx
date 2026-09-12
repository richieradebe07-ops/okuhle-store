"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { resolveState, type VisitorState } from "@/lib/ladder";

const SUBSCRIBED_KEY = "okuhle_subscribed";
/** Written by the server alongside the httpOnly session cookies. Not authority. */
const HINT_COOKIE = "okuhle_signedin";

export type VisitorProfile = {
  signedIn: boolean;
  firstName: string | null;
  paidOrders: number;
  points: number;
  member: boolean;
  memberNumber: number | null;
};

type Ctx = {
  state: VisitorState;
  profile: VisitorProfile;
  /** Call after a successful newsletter signup so the ladder advances. */
  markSubscribed: () => void;
  ready: boolean;
};

const ANONYMOUS: VisitorProfile = {
  signedIn: false,
  firstName: null,
  paidOrders: 0,
  points: 0,
  member: false,
  memberNumber: null,
};

const VisitorCtx = createContext<Ctx>({
  state: "anonymous",
  profile: ANONYMOUS,
  markSubscribed: () => {},
  ready: false,
});

function hasSessionHint() {
  try {
    return document.cookie.split(";").some((c) => c.trim().startsWith(`${HINT_COOKIE}=1`));
  } catch {
    return false;
  }
}

/**
 * Resolves the visitor's rung on the commitment ladder.
 *
 * Two sources: this device's localStorage for "are they on the mailing list",
 * and /api/me for the rungs that need an account. The account rungs are asked
 * for ONLY when the `okuhle_signedin` hint cookie is present — otherwise every
 * first-time visitor to a static marketing page would trigger a pointless
 * round trip to find out they aren't logged in.
 *
 * The hint cookie grants nothing. /api/me still reads the httpOnly session and
 * answers from that, so forging the hint gets you an anonymous response.
 */
export function VisitorStateProvider({ children }: { children: ReactNode }) {
  const [subscribed, setSubscribed] = useState(false);
  const [profile, setProfile] = useState<VisitorProfile>(ANONYMOUS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SUBSCRIBED_KEY) === "1") setSubscribed(true);
    } catch {
      // storage blocked — treated as a first-time visitor, the safe default
    }

    if (!hasSessionHint()) {
      setReady(true);
      return;
    }

    let cancelled = false;
    fetch("/api/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.signedIn) return;
        setProfile({
          signedIn: true,
          firstName: data.firstName ?? null,
          paidOrders: data.paidOrders ?? 0,
          points: data.points ?? 0,
          member: Boolean(data.member),
          memberNumber: data.memberNumber ?? null,
        });
      })
      .catch(() => {
        // Navigation must not break because this failed; they stay anonymous.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const markSubscribed = () => {
    setSubscribed(true);
    try {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const state = resolveState({
    signedIn: profile.signedIn,
    subscribed,
    paidOrders: profile.paidOrders,
  });

  return (
    <VisitorCtx.Provider value={{ state, profile, markSubscribed, ready }}>
      {children}
    </VisitorCtx.Provider>
  );
}

export const useVisitorState = () => useContext(VisitorCtx);
