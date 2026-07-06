"use client";

import { useSyncExternalStore, ReactNode } from "react";

const emptySubscribe = () => () => {};

/**
 * ClientOnly
 * A wrapper to prevent hydration mismatches for components that rely on 
 * window/document/browser APIs (like Recharts or Monaco).
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true
  );

  if (isServer) return null;

  return <>{children}</>;
}
