"use client";

import { useEffect, useState } from "react";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, 
  Target, 
  Map as MapIcon, 
  ChevronRight, 
  Zap, 
  BookOpen, 
  Code,
  Sparkles,
  Search,
  CheckCircle2,
  Circle,
  Loader2,
  BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ClientOnly } from "@/components/shared/ClientOnly";

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  type: "dsa" | "project" | "skill";
  status: "locked" | "current" | "completed";
}

interface Roadmap {
  id: string;
  goal: string;
  content: {
    rawContent: string;
    steps: RoadmapStep[];
  };
}

export default function CareerPage() {
  const { user } = useAuthStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Mock Roadmap Steps (In production, these come from AI parsing)
  const defaultSteps: RoadmapStep[] = [
    { id: "1", title: "Two Pointers & Sliding Window", description: "Master linear data structure traversal patterns.", type: "dsa", status: "completed" },
    { id: "2", title: "Build a Real-time Chat App", description: "Apply WebSocket knowledge in a production-like project.", type: "project", status: "current" },
    { id: "3", title: "System Design: Load Balancing", description: "Understand how to scale applications horizontally.", type: "skill", status: "locked" },
    { id: "4", title: "Dynamic Programming Foundations", description: "Your Solve Insights show DP as a core weakness. Focus here.", type: "dsa", status: "locked" },
  ];

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get<ApiResponse<Roadmap>>("/career/latest");
        if (res.data.data) {
          setRoadmap(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch roadmap");
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post<ApiResponse<Roadmap>>("/career/roadmap", {
        goal: "Full Stack Engineer at Google",
        experience: "Intermediate",
        timeline: "6 Months"
      });
      setRoadmap(res.data.data);
      toast.success("AI is synthesizing your personalized roadmap...");
    } catch (err) {
      toast.error("Failed to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-zinc-500 font-medium">Loading your journey...</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-12 space-y-12">
         
         {/* Hero Section */}
         <div className="relative p-10 rounded-[32px] border border-white/5 bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10" />
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/20">
                  <Compass size={48} />
               </div>
               <div className="flex-1 space-y-4 text-center md:text-left">
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 tracking-[0.2em] font-bold">CAREER COPILOT</Badge>
                  <h1 className="text-4xl font-bold tracking-tight text-white">Your AI-Generated <span className="text-primary">Growth Path</span></h1>
                  <p className="text-zinc-400 max-w-xl">
                    We've combined your solving history, skill gaps, and professional goals to architect a custom roadmap for your success.
                  </p>
               </div>
               <Button 
                className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-sm uppercase tracking-widest shadow-xl"
                onClick={handleGenerate}
                disabled={generating}
               >
                 {generating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                 Regenerate Path
               </Button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Roadmap Visualization */}
            <div className="lg:col-span-2 space-y-8">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <MapIcon size={20} className="text-primary" />
                     Learning Timeline
                  </h2>
               </div>

               <div className="relative space-y-12 pl-10">
                  {/* Vertical Line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-900 border-l border-dashed border-white/10" />
                  
                  {(roadmap?.content.steps || defaultSteps).map((step, idx) => (
                    <div key={idx} className="relative group">
                       {/* Marker */}
                       <div className={cn(
                          "absolute -left-[31px] top-1 h-6 w-6 rounded-full border-4 border-black flex items-center justify-center transition-all shadow-lg",
                          step.status === "completed" ? "bg-emerald-500 scale-110" : 
                          step.status === "current" ? "bg-primary animate-pulse" : "bg-zinc-800"
                       )}>
                          {step.status === "completed" ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={8} className="text-transparent" />}
                       </div>

                       <Card className={cn(
                          "border-white/5 bg-zinc-950/50 hover:border-primary/30 transition-all rounded-2xl",
                          step.status === "current" && "border-primary/20 bg-primary/5"
                       )}>
                          <CardContent className="p-6 flex items-start justify-between gap-6">
                             <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                   <Badge variant="secondary" className="bg-zinc-900 text-zinc-500 text-[9px] font-bold uppercase tracking-widest px-2 h-5">
                                      {step.type}
                                   </Badge>
                                   {step.status === "current" && (
                                     <Badge className="bg-primary text-white text-[9px] font-bold uppercase tracking-widest h-5">Active Goal</Badge>
                                   )}
                                </div>
                                <div>
                                   <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{step.title}</h3>
                                   <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.description}</p>
                                </div>
                             </div>
                             <Button variant="ghost" size="icon" className="text-zinc-600 group-hover:text-white mt-1">
                                <ChevronRight size={20} />
                             </Button>
                          </CardContent>
                       </Card>
                    </div>
                  ))}
               </div>
            </div>

            {/* Side Analytics */}
            <div className="space-y-8">
               <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/10 border-b border-primary/10">
                     <CardTitle className="text-primary flex items-center gap-2 text-sm uppercase tracking-widest">
                        <BrainCircuit size={16} /> 
                        Gap Analysis
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <ClientOnly>
                       <div className="space-y-4">
                          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                             Based on your last 5 sessions, the AI has identified these areas for acceleration:
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                             {[
                               { label: "Recursion Depth", score: 45 },
                               { label: "Edge Case Testing", score: 62 },
                               { label: "Memory Optimization", score: 38 }
                             ].map((gap) => (
                               <div key={gap.label} className="space-y-1.5">
                                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                     <span>{gap.label}</span>
                                     <span>{gap.score}% Mastery</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-primary/40 rounded-full" style={{ width: `${gap.score}%` }} />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     </ClientOnly>
                  </CardContent>
               </Card>

               <Card className="bg-zinc-950 border-white/5 rounded-3xl p-6 relative group overflow-hidden border-none shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent -z-10" />
                  <div className="flex flex-col items-center text-center space-y-4">
                     <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-primary shadow-xl">
                        <Target size={28} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="font-bold text-white uppercase tracking-widest">Next Milestone</h3>
                        <p className="text-xs text-zinc-500">Solve 3 Medium problems in "Graphs" to unlock the Junior Architect certificate.</p>
                     </div>
                     <Button className="w-full h-11 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                        Launch Graph Hub
                     </Button>
                  </div>
               </Card>
            </div>
         </div>
      </div>
    </div>
  );
}
