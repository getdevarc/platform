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
  Filter, 
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
  status?: "solved" | "unsolved"; // Mock or from a join
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get<ApiResponse<Problem[]>>("/problems");
        setProblems(res.data.data);
      } catch (err) {
        console.error("Failed to fetch problems", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.difficulty === filter;
    return matchesSearch && matchesFilter;
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
                <span className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500">12 Solving Sessions Today</span>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input 
                placeholder="Search problems..." 
                className="pl-10 bg-zinc-900/30 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/50 transition-all rounded-xl h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2">
              {["all", "easy", "medium", "hard"].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full h-8 px-4 text-xs font-bold uppercase tracking-widest",
                    filter === f ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {f}
                </Button>
              ))}
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
                          <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                            {problem.title}
                          </h3>
                          <div className="flex items-center gap-2">
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
                             <span className="text-[10px] text-zinc-600 font-medium">•</span>
                             <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Array, Hash Table</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none mb-1">Success Rate</span>
                            <span className="text-xs font-bold text-emerald-500">42%</span>
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
