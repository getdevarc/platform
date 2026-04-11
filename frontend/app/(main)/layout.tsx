"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen">
        <Navbar />
        {children}
      </div>
    </ProtectedRoute>
  );
}
