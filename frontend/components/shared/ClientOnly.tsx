"use client";

import { useEffect, useState, ReactNode } from "react";

/**
 * ClientOnly
 * A wrapper to prevent hydration mismatches for components that rely on 
 * window/document/browser APIs (like Recharts or Monaco).
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return <>{children}</>;
}
