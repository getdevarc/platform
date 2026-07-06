"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { api, ApiResponse } from "@/lib/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Target,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Clock,
  ChevronRight,
  Loader2,
  X,
  Zap
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";

import { ClientOnly } from "@/components/shared/ClientOnly";

interface InsightAttempt {
  language: string;
  created_at: string;
  passed_cases: number;
  total_cases: number;
  score: number;
}

interface RecentInsight {
  id: string;
  problem_id: string;
  problem_title: string;
  problem_difficulty: string;
  analysis_text: string;
  status: string;
  solved_count: number;
  languages: string[];
  attempts?: InsightAttempt[];
}

interface DashboardData {
  stats: { name: string; value: string; color: string }[];
  recentInsights: RecentInsight[];
  skillMastery?: { language: string; count: number }[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Details & Reattempt prompt state hooks
  const [selectedFeedInsight, setSelectedFeedInsight] = useState<RecentInsight | null>(null);
  const [showReattemptConfirm, setShowReattemptConfirm] = useState<string | null>(null);

  // Mock Radar Data for Mastery Visualization
  const radarData = [
    { subject: 'Arrays', A: 120, fullMark: 150 },
    { subject: 'Strings', A: 98, fullMark: 150 },
    { subject: 'DP', A: 86, fullMark: 150 },
    { subject: 'Trees', A: 99, fullMark: 150 },
    { subject: 'Graphs', A: 85, fullMark: 150 },
    { subject: 'Sorting', A: 65, fullMark: 150 },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get<ApiResponse<DashboardData>>("/analytics/dashboard");
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-zinc-500 animate-pulse">Syncing your progress...</p>
      </div>
    );
  }

  // Helper to extract streak value safely
  const currentStreak = data?.stats.find(s => s.name === "Current Streak")?.value || "0 Days";

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Profile & Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome Back, <span className="text-primary">{user?.name}</span>! 👋
            </h1>
            <p className="text-zinc-500 text-sm">
              Your AI Mentor has verified all solved sub-components and stats.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/5 flex items-center gap-3">
                <Flame className="text-orange-500 h-5 w-5 fill-orange-500/20" />
                <div>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Streak</p>
                   <p className="text-sm font-bold text-white">{currentStreak}</p>
                </div>
             </div>
             <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 shadow-lg shadow-primary/5">
                <Sparkles className="text-primary h-5 w-5" />
                <div>
                   <p className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none">Level</p>
                   <p className="text-sm font-bold text-primary">Mastery III</p>
                </div>
             </div>
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data?.stats.map((stat, i) => {
            const icons = [CheckCircle2, Flame, Target, Trophy];
            const Icon = icons[i] || TrendingUp;
            return (
              <Card key={i} className="bg-zinc-900/30 border-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all cursor-default">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-[10px] font-bold text-zinc-550 uppercase tracking-[0.2em]">
                    {stat.name}
                  </CardTitle>
                  <Icon size={16} className={cn(stat.color, "group-hover:scale-110 transition-transform")} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 text-white">
                    <span className="text-3xl font-bold tracking-tighter">{stat.value}</span>
                    <span className="text-[10px] text-zinc-650 font-bold mb-1.5">Preserved</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Solve Insights Feed */}
          <Card className="lg:col-span-2 bg-zinc-900/20 border-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                   <BrainCircuit size={18} className="text-primary" />
                   Solve Insights Feed
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Detailed AI performance analysis from your recent sessions.
                </CardDescription>
              </div>
              <Link href="/problems">
                <Button variant="outline" size="sm" className="bg-zinc-900 border-white/10 text-xs font-bold uppercase tracking-wider rounded-lg h-7">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClientOnly>
                {data?.recentInsights.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-zinc-900/10 hover:bg-zinc-900/20 transition-all">
                     <BrainCircuit className="h-10 w-10 text-zinc-700 mb-3" />
                     <p className="text-zinc-600 uppercase text-[10px] font-bold tracking-[0.2em] mb-4">No Insights Yet</p>
                     <Link href="/problems">
                       <Button variant="outline" className="rounded-xl h-10 px-6 font-bold uppercase tracking-widest text-xs border-primary/20 text-primary hover:bg-primary/10 transition-all">
                         Start Your First Challenge
                       </Button>
                     </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.recentInsights.map((insight: RecentInsight) => (
                      <div key={insight.id} className="p-5 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-primary/20 transition-all group">
                        <div className="flex items-start justify-between">
                           <div 
                             onClick={() => setSelectedFeedInsight(insight)}
                             className="space-y-2 cursor-pointer flex-1"
                           >
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-white group-hover:text-primary transition-colors text-base">{insight.problem_title}</h3>
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-450 border-none text-[8px] h-4 uppercase tracking-[0.2em] px-1.5">
                                   {insight.status.toUpperCase()}
                                 </Badge>
                              </div>
                              
                              <p className="text-[11px] text-zinc-400">
                                This question has been solved <span className="text-primary font-bold">{insight.solved_count}</span> {insight.solved_count === 1 ? "time" : "times"}.
                              </p>

                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                 {insight.languages.map((lang: string) => (
                                    <Badge key={lang} variant="outline" className="text-[8px] font-bold uppercase py-0 px-2 bg-zinc-900 text-zinc-450 border-white/5">
                                       {lang}
                                    </Badge>
                                 ))}
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-3 shrink-0">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-8 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-white/5 hover:border-primary/30 rounded-lg group/btn cursor-pointer"
                               onClick={() => setShowReattemptConfirm(insight.problem_id)}
                             >
                                <Sparkles size={11} className="mr-1 text-primary group-hover/btn:animate-pulse" />
                                Solve Again
                             </Button>
                             
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer"
                               onClick={() => setSelectedFeedInsight(insight)}
                             >
                                <ChevronRight size={18} />
                             </Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ClientOnly>
            </CardContent>
          </Card>

          {/* Mastery Charts */}
          <div className="space-y-8">
            <Card className="bg-zinc-900/20 border-white/5 backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white text-sm uppercase tracking-[0.2em]">Skill Mastery (Languages)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-5">
                {data?.skillMastery && data.skillMastery.length > 0 ? (
                  <div className="space-y-4">
                    {data.skillMastery.map((skill, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-350">
                          <span className="uppercase tracking-wider text-[10px] text-zinc-400">{skill.language}</span>
                          <span className="text-primary font-mono text-[10px]">{skill.count} Solved</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (skill.count / 6) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-[10px] font-bold text-zinc-550 uppercase tracking-widest">
                    No solutions recorded yet
                  </div>
                )}

                <div className="h-[180px] w-full mt-2">
                  <ClientOnly>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                          name="Mastery"
                          dataKey="A"
                          stroke="#0ea5e9"
                          fill="#0ea5e9"
                          fillOpacity={0.2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ClientOnly>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/20 border-white/5 backdrop-blur-sm p-6 relative overflow-hidden group border-none shadow-2xl">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] -z-10 group-hover:bg-primary/30 transition-all" />
               <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                     <Target />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider">Join Career Cohort</h3>
                    <p className="text-[10px] text-zinc-500">Expert guidance from ex-FAANG mentors.</p>
                  </div>
               </div>
               <Button className="w-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all">
                  Join Private Access
               </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Solve Detail Display Modal */}
      {selectedFeedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
           <Card className="w-full max-w-xl bg-zinc-950 border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                 <div>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                       {selectedFeedInsight.problem_title}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 uppercase tracking-widest text-[9px] mt-1 font-bold">
                       Solve Performance Report Card
                    </CardDescription>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white cursor-pointer"
                   onClick={() => setSelectedFeedInsight(null)}
                 >
                    <X size={14} />
                 </Button>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-2">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl text-center">
                       <p className="text-[9px] font-bold text-zinc-550 uppercase">Difficulty</p>
                       <p className="text-xs font-bold text-yellow-500 uppercase mt-0.5">{selectedFeedInsight.problem_difficulty}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl text-center">
                       <p className="text-[9px] font-bold text-zinc-550 uppercase">Status</p>
                       <p className="text-xs font-bold text-emerald-400 uppercase mt-0.5">{selectedFeedInsight.status.toUpperCase()}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl text-center">
                       <p className="text-[9px] font-bold text-zinc-550 uppercase">Solved Count</p>
                       <p className="text-xs font-bold text-primary mt-0.5">{selectedFeedInsight.solved_count} Times</p>
                    </div>
                 </div>

                 {/* Attempts History */}
                 <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">History of Submissions</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                       {selectedFeedInsight.attempts && selectedFeedInsight.attempts.map((att: InsightAttempt, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-zinc-900/20 border border-white/5 flex items-center justify-between text-xs">
                             <div className="space-y-0.5">
                                <p className="font-bold text-white uppercase tracking-wider text-[10px]">{att.language}</p>
                                <p className="text-[10px] text-zinc-550">{new Date(att.created_at).toLocaleString()}</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <Badge className="bg-emerald-500/10 text-emerald-450 border-none text-[10px] px-2 py-0">
                                   {att.passed_cases}/{att.total_cases} Cases
                                </Badge>
                                <span className="font-mono text-zinc-400 font-bold">Score: {att.score}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1.5">AI Feedback Analysis</p>
                    <p className="text-xs text-zinc-350 leading-relaxed italic">
                       &quot;{selectedFeedInsight.analysis_text}&quot;
                    </p>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}

      {/* Solve Again Reattempt Confirmation Popup */}
      {showReattemptConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/85 animate-in fade-in duration-300">
           <Card className="w-full max-w-md bg-zinc-950 border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
              <CardHeader className="text-center pb-2">
                 <div className="mx-auto h-12 w-12 rounded-full bg-zinc-905 border border-white/5 flex items-center justify-center mb-4 text-amber-500">
                    <Zap size={24} />
                 </div>
                 <CardTitle className="text-lg font-bold text-white tracking-tight">Reattempt Challenge?</CardTitle>
                 <CardDescription className="text-xs text-zinc-500">
                    You have already successfully submitted code for this question. Do you want to reattempt?
                 </CardDescription>
              </CardHeader>
              
              <CardContent className="flex items-center justify-center gap-3 pt-4">
                 <Button 
                   variant="outline" 
                   className="rounded-xl h-10 px-6 border-white/10 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                   onClick={() => setShowReattemptConfirm(null)}
                 >
                    Cancel
                 </Button>
                 <Button 
                   className="rounded-xl h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                   onClick={() => {
                      window.location.href = `/solve/${showReattemptConfirm}`;
                   }}
                 >
                    Confirm Reattempt
                 </Button>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
}
