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

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <Badge variant="outline" className={difficultyColor}>
            {difficulty.toUpperCase()}
          </Badge>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>

        {(exampleInput || exampleOutput) && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold">Examples</h3>
            {exampleInput && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Example Input</p>
                <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  {exampleInput}
                </pre>
              </div>
            )}
            {exampleOutput && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Example Output</p>
                <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  {exampleOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
