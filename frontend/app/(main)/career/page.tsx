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
  Code,
  Sparkles,
  CheckCircle2,
  Circle,
  Loader2,
  BrainCircuit,
  GraduationCap,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { BaseHero, TimelineNode } from "@/components/shared/DesignSystem";

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

  // Dynamic state hooks for upgraded features
  // Dynamic state hooks for upgraded features
  const [selectedTimelineStep, setSelectedTimelineStep] = useState<RoadmapStep | null>(null);
  const [aiReportGenerating, setAiReportGenerating] = useState(false);
  const [aiReportContent, setAiReportContent] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, "todo" | "progress" | "completed">>({});
  const [projectPlan, setProjectPlan] = useState<string | null>(null);
  const [generatingProject, setGeneratingProject] = useState(false);

  // Custom path prompt modal states
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [modalGoal, setModalGoal] = useState("Full Stack Engineer Transition");
  const [modalExperience, setModalExperience] = useState("Intermediate");
  const [modalTimeline, setModalTimeline] = useState("6 Months");

  // Mock Roadmap Steps template
  const defaultSteps: RoadmapStep[] = [
    { id: "1", title: "Two Pointers & Sliding Window", description: "Master linear data structure traversal patterns on dual pointers.", type: "dsa", status: "completed" },
    { id: "2", title: "Build a Real-time Chat App", description: "Apply WebSocket knowledge using Node.js/Socket.io service endpoints.", type: "project", status: "current" },
    { id: "3", title: "System Design: Load Balancing", description: "Understand layer 4 and layer 7 load balancing to scale servers horizontally.", type: "skill", status: "locked" },
    { id: "4", title: "Dynamic Programming Foundations", description: "Your Solve Insights show DP optimization pattern challenges as a gap. Focus here.", type: "dsa", status: "locked" },
  ];

  // roadmap.sh interactive tree categories
  const roadmapCategories = [
    {
      title: "Frontend Mastery",
      nodes: [
        { id: "js-core", name: "JavaScript Advanced", desc: "Closures, Event Loop, call stack runtime" },
        { id: "react-adv", name: "React Optimizations", desc: "Reconciliation engine, dynamic memo tuning" },
        { id: "ts-setup", name: "TypeScript Strictness", desc: "Strict Types, complex type interfaces" },
      ]
    },
    {
      title: "Backend foundations",
      nodes: [
        { id: "node-rest", name: "Node.js REST APIs", desc: "Express, robust middleware validation layers" },
        { id: "api-sec", name: "Auth & API Security", desc: "JWTs, CORS policies, injection protection" },
      ]
    },
    {
      title: "Database Performance",
      nodes: [
        { id: "postgres-opt", name: "PostgreSQL & Indexes", desc: "Drives relational tables under EXPLAIN plans" },
        { id: "redis-cache", name: "Redis Cache Clusters", desc: "Eviction rules, TTLs, and cache invalidation" },
      ]
    },
    {
      title: "System Scaling",
      nodes: [
        { id: "load-bal", name: "Load Balancing HLD", desc: "Reverse Proxy configurations, routing criteria" },
        { id: "sys-scale", name: "Architectural Scale", desc: "Sharding indexes and asynchronous messaging" },
      ]
    }
  ];

  useEffect(() => {
    const fetchLatestAndStatuses = async () => {
      try {
        const res = await api.get<ApiResponse<Roadmap>>("/career/latest");
        if (res.data.data) {
          setRoadmap(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch roadmap", err);
      } finally {
        setLoading(false);
      }

      // Initialize roadmap tree statuses from localStorage
      const savedStatuses: Record<string, "todo" | "progress" | "completed"> = {};
      roadmapCategories.forEach(cat => {
        cat.nodes.forEach(node => {
          const val = localStorage.getItem(`roadmap_node_status_${node.id}`) || "todo";
          savedStatuses[node.id] = val as "todo" | "progress" | "completed";
        });
      });
      setNodeStatuses(savedStatuses);
    };
    fetchLatestAndStatuses();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post<ApiResponse<Roadmap>>("/career/roadmap", {
        goal: modalGoal,
        experience: modalExperience,
        timeline: modalTimeline
      });
      setRoadmap(res.data.data);
      
      // Apply some randomized changes to the tree nodes to simulate updating path milestones
      const updated: Record<string, "todo" | "progress" | "completed"> = {};
      roadmapCategories.forEach(cat => {
        cat.nodes.forEach(node => {
          const rand = Math.random();
          const nextVal = rand > 0.65 ? "completed" : rand > 0.3 ? "progress" : "todo";
          updated[node.id] = nextVal;
          localStorage.setItem(`roadmap_node_status_${node.id}`, nextVal);
        });
      });
      setNodeStatuses(updated);
      setShowRegenModal(false);
      toast.success("AI generated your custom transition pathway!");
    } catch (err) {
      toast.error("Failed to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleNodeStatus = (nodeId: string) => {
    const current = nodeStatuses[nodeId] || "todo";
    let next: "todo" | "progress" | "completed" = "todo";
    if (current === "todo") next = "progress";
    else if (current === "progress") next = "completed";
    else if (current === "completed") next = "todo";
    
    const updated = { ...nodeStatuses, [nodeId]: next };
    setNodeStatuses(updated);
    localStorage.setItem(`roadmap_node_status_${nodeId}`, next);
    toast.success(`Marked step as ${next.toUpperCase()}`);
  };

  const generateAiStudyGuide = (stepTitle: string) => {
    setAiReportGenerating(true);
    setTimeout(() => {
      setAiReportContent(`### 📚 Study Guide: ${stepTitle}
Detailed learning materials compiled for your target career goals.

#### 1. Core Focus Areas:
* **Deep Mastery**: Architect backend constraints with production ready practices.
* **Concepts**: Learn CPU threads, thread safety locks, indexing paradigms, and memory allocation constraints.
* **Efficiency**: Optimize algorithm complexity benchmarks to maintain <100ms request times.

#### 2. Key Interview Focus Keys:
* Explain scaling limitations under concurrent WebSocket requests.
* Describe indexing search optimizations of composite indexes on PostgreSQL.
* Propose trade-offs of using write-through vs cache-aside eviction strategies.

#### 3. Recommended Platforms:
* [roadmap.sh Guides & Roadmaps](https://roadmap.sh)
* [MDN Web Guides (JS/React)](https://developer.mozilla.org)
* [System Design Primer (donnemartin)](https://github.com/donnemartin/system-design-primer)
`);
      setAiReportGenerating(false);
      toast.success("AI study guide report generated!");
    }, 1000);
  };

  const generateTransitionProject = () => {
    setGeneratingProject(true);
    setTimeout(() => {
      setProjectPlan(`### 🛠️ AI Project: Real-time Developer Analytics Service

Build a live developer metric dashboard to demonstrate frontend and backend capability integrations.

#### Tech Stacks:
* **UI**: Next.js 16, TypeScript, Recharts elements
* **Backend**: Node.js, Express APIs, Socket.io PubSub
* **Db / Cache**: PostgreSQL (Supabase), Redis in-memory storage

#### Phase Milestones:
1. **Phase 1**: Pipeline creation to capture performance timelines and socket messages.
2. **Phase 2**: Relational schema table creation and composite index explain plan evaluations.
3. **Phase 3**: Redis cache query integrations matching target latency constraints.
`);
      setGeneratingProject(false);
      toast.success("Custom project blueprint loaded!");
    }, 1200);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      let formatted = line;
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formatted = formatted.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 bg-zinc-900 rounded font-mono text-xs text-primary'>$1</code>");

      if (formatted.startsWith("### ")) {
        return <h3 key={idx} className="text-sm font-bold my-2 text-white border-b border-white/5 pb-1" dangerouslySetInnerHTML={{ __html: formatted.slice(4) }} />;
      }
      if (formatted.startsWith("#### ")) {
        return <h4 key={idx} className="text-[10px] font-bold my-2 text-primary uppercase tracking-widest" dangerouslySetInnerHTML={{ __html: formatted.slice(5) }} />;
      }
      if (formatted.trim().startsWith("* ") || formatted.trim().startsWith("- ")) {
        return <li key={idx} className="ml-3 list-disc text-xs text-zinc-400 my-1" dangerouslySetInnerHTML={{ __html: formatted.trim().slice(2) }} />;
      }
      return <p key={idx} className="text-xs text-zinc-405 text-zinc-400 leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Syncing your timeline...</p>
    </div>
  );

  const heroActions = (
    <Button 
      className="h-11 px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
      onClick={() => setShowRegenModal(true)}
    >
      <Sparkles className="h-4 w-4" />
      Regenerate Path
    </Button>
  );

  const stepsList = roadmap?.content.steps || defaultSteps;

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-12">
         
         {/* Hero Block */}
         <BaseHero 
           badgeText="CAREER COPILOT ACTIVE"
           title="Your Developer"
           highlight="Transition Path"
           description={
             user?.role === "Working Professional"
               ? `Accelerating career goals targeting ${user?.target_domain || "Full Stack Engineering"} as an experienced developer.`
               : `Bootstrapping software career goals targeting ${user?.target_domain || "Full Stack Engineering"} as a fresher.`
           }
           actions={heroActions}
         />

         {/* Resume Skills Dashboard */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/45 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 rounded-3xl p-6">
               <h3 className="text-xs font-bold text-emerald-450 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Skills You Have ({user?.role || "Developer"} Base)
               </h3>
               <div className="flex flex-wrap gap-2">
                  {(user?.role === "Working Professional"
                    ? ["TypeScript", "JavaScript (ES6+)", "Git & GitHub", "API Integration", "Basic SQL", "Agile Methodologies"]
                    : ["Core Programming", "Basic HTML/CSS", "Data Structures", "Algorithms Basics", "Simple SQL", "Academic Projects"]
                  ).map((s) => (
                    <Badge key={s} className="bg-emerald-500/10 text-emerald-440 border-none px-3 py-1.5 text-xs font-medium rounded-xl text-emerald-450 hover:bg-emerald-500/15">
                       {s}
                    </Badge>
                  ))}
               </div>
               <p className="text-[10px] text-zinc-500 mt-4 leading-relaxed font-mono">
                  Analysis: Solid starting blocks. Matching core credentials against target patterns.
               </p>
            </Card>

            <Card className="bg-card/45 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 rounded-3xl p-6">
               <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap size={16} /> Skills Needed for {user?.target_domain || "Full Stack"} Transition
               </h3>
               <div className="flex flex-wrap gap-2">
                  {(user?.target_domain === "Backend"
                    ? ["Node.js / Express", "PostgreSQL DB", "Redis Caching", "REST / GraphQL", "Docker Containers", "System Design HLD"]
                    : user?.target_domain === "Frontend"
                    ? ["React.js", "TypeScript", "TailwindCSS", "Next.js UI", "Zustand State", "Webpack/Vite"]
                    : user?.target_domain === "DevOps"
                    ? ["CI/CD Pipelines", "Docker", "Kubernetes", "AWS / Cloud", "Terraform IaC", "Prometheus/Grafana"]
                    : user?.target_domain === "Data Science"
                    ? ["Python / Pandas", "Jupyter Notebooks", "NumPy & SciPy", "Scikit Learn Models", "SQL Databases", "PyTorch / ML"]
                    : user?.target_domain === "Mobile UI"
                    ? ["React Native", "Swift / SwiftUI", "Kotlin / Compose", "App Store Release", "Webpack/Babel", "TailwindCSS"]
                    : ["React.js", "TypeScript", "Node.js / REST", "PostgreSQL / DB", "Redis Caching", "Docker Pipelines"]
                  ).map((s) => (
                    <Badge key={s} className="bg-amber-500/10 text-amber-440 border-none px-3 py-1.5 text-xs font-medium rounded-xl text-amber-500 hover:bg-amber-500/15">
                       {s}
                    </Badge>
                  ))}
               </div>
               <p className="text-[10px] text-zinc-500 mt-4 leading-relaxed font-mono">
                  Advice: Deepen competency around these subjects to maximize screening success rates.
               </p>
            </Card>
         </div>

         {/* Interactive roadmap.sh style visual tree section */}
         <div className="space-y-6">
            <div>
               <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary" />
                  Full Stack Developer Transition Roadmap
               </h2>
               <p className="text-xs text-zinc-500 mt-1">
                  Interactive roadmap.sh inspired progression. Click any node to cycle state: To Do ➔ In Progress ➔ Completed.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {roadmapCategories.map((cat, i) => (
                  <div key={i} className="space-y-4 p-5 rounded-3xl bg-card/45 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/5 relative overflow-hidden group">
                     <div>
                        <span className="text-[10px] text-primary/70 font-extrabold uppercase tracking-[0.2em]">Step {i + 1}</span>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide mt-0.5">{cat.title}</h3>
                     </div>
                     
                     <div className="space-y-3 relative">
                        {/* Connecting visual tree wire */}
                        <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-zinc-200 dark:bg-zinc-900 border-l border-dashed border-zinc-300 dark:border-white/5 pr-px" />
                        
                        {cat.nodes.map((node) => {
                           const status = nodeStatuses[node.id] || "todo";
                           return (
                              <div 
                                key={node.id} 
                                onClick={() => toggleNodeStatus(node.id)}
                                className={cn(
                                  "relative py-3 pr-3 pl-8 rounded-xl border transition-all cursor-pointer select-none",
                                  status === "completed" ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40" :
                                  status === "progress" ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 animate-pulse" :
                                  "bg-zinc-150/40 dark:bg-zinc-900/10 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-805"
                                )}
                              >
                                 {/* Status marker bullet */}
                                 <div className={cn(
                                   "absolute left-[9px] top-[15px] h-2.5 w-2.5 rounded-full border flex items-center justify-center transition-all",
                                   status === "completed" ? "bg-emerald-505 bg-emerald-500 border-emerald-500 scale-110" :
                                   status === "progress" ? "bg-amber-500 border-amber-500" :
                                   "bg-zinc-250 dark:bg-zinc-800 border-zinc-350 dark:border-zinc-700"
                                 )} />
                                 
                                 <p className={cn(
                                   "text-[11px] font-bold transition-colors",
                                   status === "completed" ? "text-emerald-450" :
                                   status === "progress" ? "text-amber-500" :
                                   "text-zinc-805 dark:text-white"
                                 )}>
                                    {node.name}
                                 </p>
                                 <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{node.desc}</p>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Timeline & Analytics Split Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Roadmap Timeline */}
            <div className="lg:col-span-2 space-y-6">
               <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <MapIcon size={18} className="text-primary" />
                  Target Timeline & Milestones
               </h2>

               <div className="relative">
                  {stepsList.map((step, idx) => (
                    <TimelineNode 
                      key={step.id}
                      title={step.title}
                      description={step.description}
                      status={step.status}
                      type={step.type}
                      isLast={idx === stepsList.length - 1}
                      onClick={() => setSelectedTimelineStep(step)}
                    />
                  ))}
               </div>
            </div>

            {/* Side Analytics & Projects */}
            <div className="space-y-8">
               <Card className="bg-card/45 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                     <CardTitle className="text-primary flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold">
                        <BrainCircuit size={16} /> 
                        Gap Analysis & Key Factors
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <ClientOnly>
                       <div className="space-y-4">
                          <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                             Based on resume matching metrics, verify accuracy ratings:
                          </p>
                          <div className="grid grid-cols-1 gap-4">
                             {[
                               { label: "Backend REST core architecture", score: 35, factor: "Middleware routers, response models" },
                               { label: "Database Scans & Indexes", score: 48, factor: "Explain plans, select optimization query patterns" },
                               { label: "System Design Load Balancer", score: 25, factor: "L4 vs L7 proxied traffic split routes" },
                               { label: "DSA Backtracking algorithms", score: 62, factor: "DFS graph traversal recursion limits" }
                             ].map((gap) => (
                               <div key={gap.label} className="space-y-1.5 p-3 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-white/5">
                                  <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase">
                                     <span>{gap.label}</span>
                                     <span className="text-amber-500 font-mono mt-0.5">{gap.score}% Accuracy</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                     <div className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full" style={{ width: `${gap.score}%` }} />
                                  </div>
                                  <p className="text-[9px] text-zinc-500 italic font-mono">Key Factor: {gap.factor}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                     </ClientOnly>
                  </CardContent>
               </Card>

               {/* AI Capstone Project Builder */}
               <Card className="bg-card/45 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 rounded-3xl p-6 relative group overflow-hidden border-none shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -z-10 group-hover:bg-primary/20 transition-all" />
                  
                  <div className="flex items-center gap-3.5 mb-4">
                     <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                        <Code size={24} />
                     </div>
                     <div>
                       <h3 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-xs">AI Project Playground</h3>
                       <p className="text-[9px] text-zinc-500">Target custom Full-Stack project roadmap guides.</p>
                     </div>
                  </div>

                  {projectPlan ? (
                     <div className="space-y-4 bg-zinc-100/80 dark:bg-zinc-950/60 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 max-h-[320px] overflow-y-auto select-text text-zinc-800 dark:text-zinc-300">
                        {renderFormattedText(projectPlan)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full text-[10px] font-bold uppercase tracking-wider border-white/10 text-zinc-450 hover:text-white"
                          onClick={() => setProjectPlan(null)}
                        >
                           Custom New Project Options
                        </Button>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        <p className="text-xs text-zinc-500 leading-normal">
                           Get custom architectural blueprints to prove skill transitions.
                        </p>
                        <Button 
                          className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-95 text-xs uppercase tracking-widest font-sans"
                          onClick={generateTransitionProject}
                          disabled={generatingProject}
                        >
                           {generatingProject ? (
                              <Loader2 className="animate-spin mr-2 h-4 w-4" />
                           ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                           )}
                           Build Transition Project
                        </Button>
                     </div>
                  )}
               </Card>

               <Card className="bg-card/90 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 relative group overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent -z-10" />
                  <div className="flex flex-col items-center text-center space-y-4">
                     <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-primary shadow-xl">
                        <Target size={28} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="font-bold text-zinc-900 dark:text-white uppercase tracking-widest text-xs">Next Milestone</h3>
                        <p className="text-[11px] text-zinc-500">Solve 3 Medium problems in &quot;Graphs&quot; to unlock the Junior Architect certificate.</p>
                      </div>
                      <Button 
                        onClick={() => window.location.href = "/problems"}
                        className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-90 transition-all font-sans text-xs uppercase tracking-widest"
                      >
                         Launch Graph Hub
                      </Button>
                  </div>
               </Card>
            </div>
         </div>
      </div>

      {/* Side Study Resources / AI Guide Drawer */}
      {selectedTimelineStep && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-white/10 h-full p-8 flex flex-col space-y-6 overflow-y-auto animate-in slide-in-from-right duration-350 scrollbar-hide">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <div>
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 mb-1.5 uppercase font-bold tracking-widest text-[9px]">
                       {selectedTimelineStep.type}
                    </Badge>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{selectedTimelineStep.title}</h3>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white cursor-pointer"
                   onClick={() => {
                     setSelectedTimelineStep(null);
                     setAiReportContent(null);
                   }}
                 >
                    <X size={14} />
                 </Button>
              </div>

              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</h4>
                 <p className="text-xs text-zinc-350 leading-relaxed bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                    {selectedTimelineStep.description}
                 </p>
              </div>

              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recommended Study Resources</h4>
                 <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { name: "Official Documentation / Guides", url: "https://developer.mozilla.org", source: "MDN / Official Docs" },
                      { name: "roadmap.sh Interactive learning Guides", url: "https://roadmap.sh", source: "Developer Roadmaps" },
                      { name: "GitHub System Design Primer", url: "https://github.com/donnemartin/system-design-primer", source: "System Design Concepts" }
                    ].map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-primary/40 hover:bg-zinc-900/80 transition-all group"
                      >
                         <div>
                            <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{res.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{res.source}</p>
                         </div>
                         <ChevronRight size={14} className="text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                      </a>
                    ))}
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5 flex-1 flex flex-col justify-end">
                 {aiReportContent ? (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3 max-h-[300px] overflow-y-auto select-text text-zinc-300">
                       {renderFormattedText(aiReportContent)}
                    </div>
                 ) : (
                    <Button 
                      className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-95 text-xs uppercase tracking-widest font-sans"
                      onClick={() => generateAiStudyGuide(selectedTimelineStep.title)}
                      disabled={aiReportGenerating}
                    >
                       {aiReportGenerating ? (
                          <Loader2 size={14} className="animate-spin" />
                       ) : (
                          <Sparkles size={14} />
                       )}
                       Generate AI Study Guide Report
                    </Button>
                 )}
              </div>
           </div>
        </div>
      )}
      {/* Custom Regeneration Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl text-zinc-900 dark:text-white">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white cursor-pointer"
              onClick={() => setShowRegenModal(false)}
            >
              <X size={14} />
            </Button>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="text-primary h-4 w-4 animate-pulse" />
                Customize Career Transition
              </h3>
              <p className="text-[10px] text-zinc-500">Provide details to generate a custom target roadmap pathway.</p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">Transition Goal</label>
                <input 
                  type="text" 
                  value={modalGoal} 
                  onChange={(e) => setModalGoal(e.target.value)}
                  placeholder="e.g. Full Stack Engineer Transition"
                  className="w-full bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl h-11 px-4 outline-none focus:border-primary/50 transition-all font-mono placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">Experience Level</label>
                <select 
                  value={modalExperience} 
                  onChange={(e) => setModalExperience(e.target.value)}
                  className="w-full bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl h-11 px-4 outline-none focus:border-primary/50 transition-all font-mono"
                >
                  <option value="Junior">Junior</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">Target Timeline</label>
                <input 
                  type="text" 
                  value={modalTimeline} 
                  onChange={(e) => setModalTimeline(e.target.value)}
                  placeholder="e.g. 6 Months"
                  className="w-full bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-xl h-11 px-4 outline-none focus:border-primary/50 transition-all font-mono placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowRegenModal(false)}
                className="flex-1 h-11 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 h-11 bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20"
              >
                {generating ? <Loader2 className="animate-spin h-4 w-4" /> : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

