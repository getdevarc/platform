"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProblemDescriptionProps {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  exampleInput?: string;
  exampleOutput?: string;
}

export function ProblemDescription({
  title,
  difficulty,
  description,
  exampleInput,
  exampleOutput,
}: ProblemDescriptionProps) {
  const difficultyColor = {
    easy: "bg-green-500/10 text-green-500 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    hard: "bg-red-500/10 text-red-500 border-red-500/20",
  }[difficulty];

  // Micro Markdown parser to cleanly render problem details without raw markdown symbols
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-[11px] text-foreground/90">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };
 
  const parseMarkdown = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-foreground mt-5 mb-2 tracking-tight">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-lg font-bold text-foreground mt-6 mb-2 tracking-tight">
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-xl font-bold text-foreground mt-7 mb-3 tracking-tight">
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-foreground/90 leading-relaxed pl-1 py-0.5">
            {renderInlineFormatting(trimmed.slice(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <li key={idx} className="ml-4 list-decimal text-sm text-foreground/90 leading-relaxed pl-1 py-0.5">
              {renderInlineFormatting(match[2])}
            </li>
          );
        }
      }
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-muted-foreground leading-relaxed mb-2">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <Badge variant="outline" className={difficultyColor}>
            {difficulty.toUpperCase()}
          </Badge>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-1">
          {parseMarkdown(description)}
        </div>

        {(exampleInput || exampleOutput) && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground/90 font-sans select-none">Example Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exampleInput && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Example Input</p>
                  <pre className="bg-muted/30 border border-border p-4 rounded-2xl text-xs font-mono text-foreground overflow-x-auto select-all max-h-32 scrollbar-thin">
                    {exampleInput}
                  </pre>
                </div>
              )}
              {exampleOutput && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Example Output</p>
                  <pre className="bg-muted/30 border border-border p-4 rounded-2xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto select-all max-h-32 scrollbar-thin">
                    {exampleOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
