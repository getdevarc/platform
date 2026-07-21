"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  CheckCircle2, 
  ChevronRight,
  Code2,
  TrendingUp,
  BrainCircuit,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status?: "solved" | "unsolved";
}

interface Submission {
  problem_id: string;
  language: string;
  status: string;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedMap, setSolvedMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unsolved" | "reattempt">("all");

  useEffect(() => {
    const fetchSubmissionsAndProblems = async () => {
      try {
        const [problemsRes, submissionsRes] = await Promise.all([
          api.get<ApiResponse<Problem[]>>("/problems"),
          api.get<ApiResponse<Submission[]>>("/submissions")
        ]);
        
        setProblems(problemsRes.data.data || []);
        
        const userSubmissions = submissionsRes.data.data || [];
        const acceptedSubmissions = userSubmissions.filter((s: Submission) => s.status === "accepted");
        const mapping: Record<string, string[]> = {};
        acceptedSubmissions.forEach((s: Submission) => {
          if (!mapping[s.problem_id]) {
            mapping[s.problem_id] = [];
          }
          if (!mapping[s.problem_id].includes(s.language)) {
            mapping[s.problem_id].push(s.language);
          }
        });
        setSolvedMap(mapping);
      } catch (err) {
        console.error("Failed to fetch problems/submissions data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissionsAndProblems();
  }, []);

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.difficulty === filter;
    
    const isSolved = solvedMap[p.id] && solvedMap[p.id].length > 0;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "reattempt" && isSolved) || 
      (statusFilter === "unsolved" && !isSolved);
      
    return matchesSearch && matchesFilter && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground scrollbar-hide select-none">
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-extrabold uppercase tracking-widest select-none">
              <Code2 size={10} /> Practice Lab
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-sans">
              Algorithmic <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent italic">Core</span>
            </h1>
            <p className="text-muted-foreground text-xs max-w-lg leading-relaxed font-sans">
              Master fundamentals, edge cases, and optimizations with responsive AI guidance.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-secondary/50 p-2 rounded-2xl border border-border backdrop-blur-sm shadow-xl dark:shadow-black/30">
             <div className="flex items-center gap-2 px-3 py-1.5 border-r border-border select-none">
                <BrainCircuit size={14} className="text-primary animate-pulse" />
                <span className="text-[10px] font-bold text-foreground/90 uppercase tracking-wider font-mono">AI Diagnostics Active</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 select-none">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider font-mono">Streaks Enabled</span>
             </div>
          </div>
        </div>
 
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Lookup challenge..." 
                className="pl-10 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all rounded-xl h-10.5 text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty Filters */}
              <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border backdrop-blur-sm">
                {["all", "easy", "medium", "hard"].map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-lg h-7.5 px-3.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                      filter === f 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {f}
                  </Button>
                ))}
              </div>
 
              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border backdrop-blur-sm">
                {(["all", "unsolved", "reattempt"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "rounded-lg h-7.5 px-3.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                      statusFilter === status 
                        ? "bg-amber-600 text-white shadow-md shadow-amber-900/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {status === "all" ? "status: all" : status}
                  </Button>
                ))}
              </div>
           </div>
        </div>

        {/* Problems List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="text-xs text-muted-foreground font-mono animate-pulse">Synchronizing challenge lists...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredProblems.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-3xl bg-muted/20 space-y-2 select-none">
                 <Code2 size={24} className="mx-auto text-muted-foreground animate-bounce" />
                 <p className="text-xs font-bold text-foreground uppercase tracking-wider font-sans">No Challenges Found</p>
                 <p className="text-xs text-muted-foreground max-w-xs mx-auto font-sans leading-relaxed">Adjust your filtration parameters or search keyword criteria to discover active challenges.</p>
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <Link key={problem.id} href={`/solve/${problem.id}`}>
                  <Card className="group relative overflow-hidden bg-card/45 border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all duration-300 cursor-pointer rounded-2xl shadow-md hover:shadow-primary/5">
                    <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover:bg-primary transition-colors duration-300" />
                    <CardContent className="p-4 sm:p-5 select-none">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted border border-border group-hover:border-primary/20 transition-colors">
                             <Code2 size={18} className="text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:scale-105" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors flex items-center gap-2 font-sans">
                              {problem.title}
                              {solvedMap[problem.id] && solvedMap[problem.id].length > 0 && (
                                <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                              )}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                               <Badge 
                                 className={cn(
                                   "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border rounded-lg",
                                   problem.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                   problem.difficulty === "medium" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20" :
                                   "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                 )}
                               >
                                 {problem.difficulty}
                               </Badge>
                               <span className="text-[10px] text-muted-foreground/30 font-medium font-mono">•</span>
                               <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Algorithms</span>
                               
                               <span className="text-[10px] text-muted-foreground/30 font-medium font-mono">•</span>
                               {solvedMap[problem.id] && solvedMap[problem.id].length > 0 ? (
                                 <Badge className="text-[9px] uppercase font-semibold px-2 py-0.5 border rounded-lg bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10">
                                   Reattempt ({solvedMap[problem.id].join(", ")})
                                 </Badge>
                               ) : (
                                 <Badge className="text-[9px] uppercase font-semibold px-2 py-0.5 border rounded-lg bg-muted/50 text-muted-foreground border-border">
                                   Unsolved
                                 </Badge>
                               )}
                            </div>
                          </div>
                        </div>
 
                        <div className="flex items-center gap-6">
                           <div className="hidden sm:flex flex-col items-end">
                              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest font-mono leading-none mb-1 shadow-sm">
                                Status
                              </span>
                              <span className={cn(
                                "text-xs font-black uppercase tracking-wider font-mono",
                                solvedMap[problem.id] && solvedMap[problem.id].length > 0 ? "text-amber-500" : "text-primary"
                              )}>
                                {solvedMap[problem.id] && solvedMap[problem.id].length > 0 ? "Reattempt" : "Solve"}
                              </span>
                           </div>
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground group-hover:text-foreground group-hover:bg-primary/10 transition-all border border-transparent group-hover:border-primary/10">
                              <ChevronRight size={16} />
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
