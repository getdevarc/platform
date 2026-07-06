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
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "solved">("all");

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
      (statusFilter === "solved" && isSolved) || 
      (statusFilter === "new" && !isSolved);
      
    return matchesSearch && matchesFilter && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              Problem <span className="text-primary italic">Gallery</span>
            </h1>
            <p className="text-zinc-400 max-w-lg">
              Master algorithms and data structures with AI-guided hints and real-time solving insights.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
             <div className="flex items-center gap-2 px-3 py-2 border-r border-white/5">
                <BrainCircuit size={16} className="text-primary" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">AI Analysis Active</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Solved Tracker Enabled</span>
             </div>
          </div>
        </div>
 
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550" size={18} />
              <Input 
                placeholder="Search problems..." 
                className="pl-10 bg-zinc-900/30 border-white/10 text-white placeholder:text-zinc-650 focus:border-primary/50 transition-all rounded-xl h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              {/* Difficulty Filters */}
              <div className="flex items-center gap-1.5 bg-zinc-900/40 p-1 rounded-full border border-white/5">
                {["all", "easy", "medium", "hard"].map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-full h-8 px-3.5 text-[10px] font-bold uppercase tracking-wider",
                      filter === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {f}
                  </Button>
                ))}
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-zinc-900/40 p-1 rounded-full border border-white/5">
                {(["all", "new", "solved"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "rounded-full h-8 px-3.5 text-[10px] font-bold uppercase tracking-wider",
                      statusFilter === status 
                        ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" 
                        : "text-zinc-400 hover:text-white"
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
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="text-sm text-zinc-500 animate-pulse">Loading problem bank...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredProblems.map((problem) => (
              <Link key={problem.id} href={`/solve/${problem.id}`}>
                <Card className="group relative overflow-hidden bg-zinc-900/40 border-white/5 hover:border-primary/40 hover:bg-zinc-900/60 transition-all cursor-pointer rounded-2xl">
                  <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover:bg-primary transition-colors" />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-800 border border-white/5 group-hover:border-primary/20 transition-colors">
                           <Code2 size={20} className="text-zinc-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                            {problem.title}
                            {solvedMap[problem.id] && solvedMap[problem.id].length > 0 && (
                              <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                             <Badge 
                               variant="outline" 
                               className={cn(
                                 "text-[10px] uppercase font-bold tracking-widest px-1.5 h-4 border-none",
                                 problem.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-500" :
                                 problem.difficulty === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                                 "bg-red-500/10 text-red-500"
                               )}
                             >
                               {problem.difficulty}
                             </Badge>
                             <span className="text-[10px] text-zinc-650 font-medium">•</span>
                             <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider">Array, Dynamic Programming</span>
                             
                             <span className="text-[10px] text-zinc-650 font-medium">•</span>
                             {solvedMap[problem.id] && solvedMap[problem.id].length > 0 ? (
                               <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 h-4 border-none bg-emerald-500/10 text-emerald-450">
                                 Solved in {solvedMap[problem.id].join(", ")}
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 h-4 border-none bg-zinc-900 text-zinc-550">
                                 Unsolved
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[10px] text-zinc-550 uppercase font-bold tracking-widest leading-none mb-1">
                              Status
                            </span>
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              solvedMap[problem.id] && solvedMap[problem.id].length > 0 ? "text-amber-500" : "text-primary"
                            )}>
                              {solvedMap[problem.id] && solvedMap[problem.id].length > 0 ? "Reattempt" : "Solve"}
                            </span>
                         </div>
                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-zinc-600 group-hover:text-white group-hover:bg-primary/20 transition-all">
                            <ChevronRight size={20} />
                         </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
