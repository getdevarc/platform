"use client";

import { Button } from "@/components/ui/button";
import { Play, Send, ChevronLeft, Layout, Share2, Settings } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { cn } from "@/lib/utils";

export function WorkspaceHeader() {
  const { status, sessionId } = useWorkspaceStore();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <ChevronLeft size={18} />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs uppercase">
            DA
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground/90">DevArc</span>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">Problems / Two Sum</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-9 gap-2 font-medium"
          disabled={status !== "idle"}
        >
          <Play size={14} className="fill-current" />
          Run
        </Button>
        <Button 
          size="sm" 
          className="h-9 gap-2 font-semibold px-4 shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)]"
          disabled={status !== "idle"}
        >
          <Send size={14} />
          Submit
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <Share2 size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <Settings size={18} />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold ring-offset-background transition-colors hover:bg-muted/80 cursor-pointer">
          AJ
        </div>
      </div>
    </header>
  );
}
