"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Lightbulb, 
  Zap, 
  CheckCircle2, 
  Timer, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InstructionPopupProps {
  problemTitle: string;
  onStart: () => void;
}

export function InstructionPopup({ problemTitle, onStart }: InstructionPopupProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-lg bg-black/60 dark:bg-black/85 animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl"
      >
        <Card className="border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-3xl">
          {/* Top Energy bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary animate-pulse" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -z-10" />

          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/5">
              <Trophy size={26} className="text-primary animate-bounce-slow" />
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Ready to Solve?</CardTitle>
            <CardDescription className="uppercase tracking-widest text-[9px] font-extrabold text-zinc-600 dark:text-zinc-550 mt-1">
              Active Challenge: {problemTitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 py-6 px-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 space-y-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-primary">
                     <Zap size={14} className="fill-primary/20" />
                     <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Base Score</span>
                  </div>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">100 PTS</p>
               </div>
               <div className="p-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 space-y-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-rose-455">
                     <Lightbulb size={14} className="text-rose-400" />
                     <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Penalty</span>
                  </div>
                  <p className="text-2xl font-extrabold text-zinc-900 dark:text-white font-mono">-20 <span className="text-xs text-zinc-500 font-medium">/ HINT</span></p>
               </div>
            </div>

            <div className="space-y-3">
               <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 font-mono">Solving Rules</h4>
               <div className="space-y-2">
                  {[
                    { icon: CheckCircle2, text: "Points are deducted for each AI Hint level used.", color: "text-emerald-500" },
                    { icon: Timer, text: "Your total time taken is tracked for performance insights.", color: "text-blue-500" },
                    { icon: ShieldAlert, text: "AI Review and Explanation don't cost points. Use them to learn!", color: "text-amber-500" }
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 hover:border-zinc-350 dark:hover:border-white/10 transition-colors select-none">
                       <rule.icon size={15} className={cn("mt-0.5 shrink-0", rule.color)} />
                       <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed font-sans">{rule.text}</p>
                    </div>
                  ))}
               </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-8 px-8">
             <Button 
               className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest group shadow-lg shadow-primary/20 hover:bg-primary/95 transitions-all hover:scale-[1.01] active:scale-[0.99]"
               onClick={() => {
                 setIsOpen(false);
                 onStart();
               }}
             >
                Start Solving
                <ArrowRight size={15} className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
