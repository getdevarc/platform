"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/";

  if (isPublicRoute) {
    return (
      <div className="flex flex-col min-h-screen bg-[#060606]">
        {children}
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen">
        <Navbar />
        {children}
      </div>
    </ProtectedRoute>
  );
}
