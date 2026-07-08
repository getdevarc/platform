"use client";

import { useLoaderStore } from "@/store/useLoaderStore";
import { Loader2 } from "lucide-react";

export function GlobalLoader() {
  const { isLoading, message } = useLoaderStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 bg-zinc-950/80 border border-white/5 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        {message && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
