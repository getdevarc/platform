"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Sparkles, Brain, Code2, Lightbulb, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageProps {
  role: "user" | "ai";
  content: string;
  type?: "hint" | "explanation" | "review";
}

function ChatMessage({ role, content, type }: MessageProps) {
  const isAi = role === "ai";
  
  const iconMap: Record<string, LucideIcon> = {
    hint: Lightbulb,
    explanation: Brain,
    review: Code2,
  };

  const Icon = (isAi && type ? iconMap[type] : null) || Sparkles;

  return (
    <div className={cn(
      "flex w-full gap-3 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isAi ? "mr-auto flex-row" : "ml-auto flex-row-reverse max-w-[90%]"
    )}>
      <div className={cn(
        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border shadow-md",
        isAi ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-white/5 text-primary" : "bg-primary border-primary/20 text-primary-foreground font-bold text-xs"
      )}>
        {isAi ? <Icon size={15} /> : "U"}
      </div>
      <div className="space-y-1.5 flex-1 pt-0.5">
        <div className={cn("text-[9px] font-bold uppercase tracking-wider font-mono", isAi ? "text-primary" : "text-zinc-555 dark:text-zinc-400 text-right pr-1")}>
          {isAi ? `${type ? type.toUpperCase() : "AI"} MENTOR` : "YOUR QUERY"}
        </div>
        <div className={cn(
          "text-xs leading-relaxed p-3.5 rounded-2xl border",
          isAi 
            ? "bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/5" 
            : "bg-primary/5 text-zinc-900 dark:text-white border-primary/20 dark:border-primary/10 shadow-md shadow-primary/5"
        )}>
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
    <div className="flex flex-col h-full bg-card border-l border-zinc-200 dark:border-white/5">
      <div className="flex items-center gap-2.5 p-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/40">
        <Sparkles size={16} className="text-primary fill-primary/10" />
        <h2 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider font-sans">AI Mentor Chat</h2>
      </div>

      <div className="flex-1 px-5 overflow-y-auto scrollbar-thin dark:scrollbar-thumb-zinc-800" ref={scrollRef}>
        <div className="flex flex-col py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[350px] text-center space-y-4 px-6 text-zinc-500 select-none">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex items-center justify-center">
                <Lightbulb size={22} className="text-primary animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Need a nudge?</p>
                <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-sans">Click the <strong className="text-primary font-bold">Hint</strong>, <strong className="text-primary font-bold">Explain</strong>, or <strong className="text-primary font-bold">Review</strong> buttons at the top to invoke the AI Mentor.</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))}

          {status === "analyzing" && (
            <div className="flex gap-3 py-3 animate-pulse">
              <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex items-center justify-center">
                <Loader2 size={15} className="animate-spin text-zinc-500" />
              </div>
              <div className="space-y-2 pt-1 flex-1">
                <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-900 rounded" />
                <div className="h-10 bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
