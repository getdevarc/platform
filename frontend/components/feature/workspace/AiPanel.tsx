"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Sparkles, Brain, Code2, Lightbulb, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageProps {
  role: "user" | "ai";
  content: string;
  type?: "hint" | "explanation" | "review";
}

function ChatMessage({ role, content, type }: MessageProps) {
  const isAi = role === "ai";
  
  const iconMap: Record<string, any> = {
    hint: Lightbulb,
    explanation: Brain,
    review: Code2,
  };

  const Icon = (isAi && type ? iconMap[type] : null) || Sparkles;

  return (
    <div className={cn(
      "flex w-full gap-3 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isAi ? "bg-muted/30 px-4 -mx-4 border-y border-border/10" : ""
    )}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        isAi ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {isAi ? <Icon size={16} /> : <div className="text-xs font-bold uppercase">U</div>}
      </div>
      <div className="space-y-2 flex-1 pt-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isAi ? `${type ? type.toUpperCase() : "AI"} MENTOR` : "YOU"}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}

export function AiPanel() {
  const { messages, status } = useWorkspaceStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
        <Sparkles size={18} className="text-primary" />
        <h2 className="font-semibold text-sm">AI Mentor Chat</h2>
      </div>

      <div 
        className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" 
        ref={scrollRef}
        style={{ contentVisibility: "auto" }}
      >
        <div className="flex flex-col">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 px-6 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Lightbulb size={24} />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Need a nudge?</p>
                <p className="text-sm">Click the hint, explanation, or review buttons above to start chatting with your AI Mentor.</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))}

          {status === "analyzing" && (
            <div className="flex gap-3 py-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
