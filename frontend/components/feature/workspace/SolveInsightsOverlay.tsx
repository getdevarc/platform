"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, Target, BookOpen, Clock } from "lucide-react";

export function SolveInsightsOverlay() {
  const { insights, setInsights } = useWorkspaceStore();

  if (!insights) return null;

  return (
    <Dialog open={!!insights} onOpenChange={() => setInsights(null)}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Problem Solved!</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Your Solve Insights are ready. Here's how you performed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-8 pt-6">
          <div className="space-y-8">
            {/* AI Summary */}
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Target size={18} />
                AI Performance Analysis
              </div>
              <p className="text-foreground leading-relaxed italic">
                "{insights.analysis || "Excellent solve! You showed strong pattern recognition and efficient implementation."}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-500 font-semibold text-sm uppercase tracking-wider">
                  <TrendingUp size={16} />
                  Strengths
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.strengths?.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-500 font-semibold text-sm uppercase tracking-wider">
                  <TrendingUp size={16} className="rotate-180" />
                  Areas to Improve
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.weaknesses?.map((w: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Topics & Recommendations */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wider">
                  <BookOpen size={16} />
                  Core Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.topics?.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="px-3 py-1">{t}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wider">
                  <TrendingUp size={16} />
                  Next Recommended
                </div>
                <div className="space-y-2">
                  {insights.recommended_problems?.map((p: string, i: number) => (
                    <div key={i} className="text-sm font-medium hover:text-primary cursor-pointer border-b border-border/50 pb-1">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
          <Button variant="outline" onClick={() => setInsights(null)}>Back to Editor</Button>
          <Button>Go to Dashboard</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
