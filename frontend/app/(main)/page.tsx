"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root Page Redirection
 * In DevArc, the main entry point after authentication is the Dashboard.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
