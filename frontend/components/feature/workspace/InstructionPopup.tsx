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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="border-white/5 bg-zinc-950 shadow-2xl relative overflow-hidden">
          {/* Top Energy bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary animate-pulse" />
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Trophy size={28} className="text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Ready to Solve?</CardTitle>
            <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-zinc-500 mt-1">
              Problem: {problemTitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                     <Zap size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Base Score</span>
                  </div>
                  <p className="text-2xl font-bold text-white">100 PTS</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-500">
                     <Lightbulb size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Penalty</span>
                  </div>
                  <p className="text-2xl font-bold text-white">-20 / HINT</p>
               </div>
            </div>

            <div className="space-y-3">
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Solving Rules</h4>
               <div className="space-y-2">
                  {[
                    { icon: CheckCircle2, text: "Points are deducted for each AI Hint level used.", color: "text-emerald-500" },
                    { icon: Timer, text: "Your total time taken is tracked for performance insights.", color: "text-blue-500" },
                    { icon: ShieldAlert, text: "AI Review and Explanation don't cost points. Use them to learn!", color: "text-amber-500" }
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/5 transition-colors">
                       <rule.icon size={16} className={cn("mt-0.5", rule.color)} />
                       <p className="text-xs text-zinc-400 font-medium leading-relaxed">{rule.text}</p>
                    </div>
                  ))}
               </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-8 px-6">
             <Button 
               className="w-full h-12 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest group shadow-lg shadow-primary/20"
               onClick={() => {
                 setIsOpen(false);
                 onStart();
               }}
             >
                Start Solving
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
             </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
