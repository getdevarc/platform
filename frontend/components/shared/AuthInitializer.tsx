"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * AuthInitializer
 * Resumes user session on page load/refresh if a token exists in localStorage.
 * Prevents unnecessary redirects to login on shared layouts.
 */
export function AuthInitializer() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return null;
}
