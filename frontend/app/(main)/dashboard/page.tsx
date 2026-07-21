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
  Trophy, 
  Flame, 
  Target,
  Sparkles,
  BrainCircuit,
  Clock,
  Loader2,
  X,
  Zap,
  ArrowRight,
  Compass,
  Code2,
  Award,
  FileText,
  Bookmark,
  BookOpenCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { SectionHeader, AiRecommendationCard } from "@/components/shared/DesignSystem";
import dynamic from "next/dynamic";

const RadarChartComponent = dynamic(
  () => import("@/components/feature/dashboard/RadarChartComponent"),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Loading charts...</div> }
);

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

interface ContinueLearningData {
  trackTitle: string;
  trackSlug: string;
  moduleTitle: string;
  moduleId: string;
  progressPercent?: number;
  estimatedRemainingMinutes?: number;
}

interface CareerMilestoneData {
  targetDomain: string;
  roadmapProgressPercent: number;
  currentMilestone: {
    title: string;
    status: string;
  } | null;
}

interface FocusData {
  title: string;
  category: string;
  link: string;
  actionLabel: string;
}

interface RecommendationData {
  actionText: string;
  actionType: string;
  metadata?: Record<string, unknown>;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface CalendarActivity {
  date: string;
  submissions: number;
  accepted: number;
  easy: number;
  medium: number;
  hard: number;
  modules: number;
  sessions: number;
  totalCount: number;
}

interface DifficultyBreakdown {
  easy: number;
  medium: number;
  hard: number;
}

interface DashboardData {
  stats: { name: string; value: string; color: string }[];
  recentInsights: RecentInsight[];
  skillMastery?: { language: string; count: number }[];
  hasRoadmap?: boolean;
  learning?: {
    activeTracksCount: number;
    topicsCompleted: number;
    totalEstimatedStudyHours: number;
    overallProgressPercent: number;
    continueLearning: ContinueLearningData | null;
  } | null;
  career?: CareerMilestoneData | null;
  focus?: FocusData | null;
  recommendation?: RecommendationData | null;
  activity?: ActivityItem[];
  activityCalendar?: CalendarActivity[];
  difficultyBreakdown?: DifficultyBreakdown;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Details & Reattempt prompt state hooks
  const [selectedFeedInsight, setSelectedFeedInsight] = useState<RecentInsight | null>(null);
  const [showReattemptConfirm, setShowReattemptConfirm] = useState<string | null>(null);

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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing career metrics...</p>
      </div>
    );
  }

  // Find streak value
  const currentStreakVal = data?.stats.find(s => s.name === "Current Streak")?.value || "0 Days";
  
  // Solved Count
  const solvedCount = parseInt(data?.stats.find(s => s.name === "Solved Problems")?.value || "0", 10);

  // Mock Radar Data for Mastery Visualization
  const radarData = [
    { subject: 'Arrays', A: solvedCount === 0 ? 0 : 120, fullMark: 150 },
    { subject: 'Strings', A: solvedCount === 0 ? 0 : 98, fullMark: 150 },
    { subject: 'DP', A: solvedCount === 0 ? 0 : 86, fullMark: 150 },
    { subject: 'Trees', A: solvedCount === 0 ? 0 : 99, fullMark: 150 },
    { subject: 'Graphs', A: solvedCount === 0 ? 0 : 85, fullMark: 150 },
    { subject: 'Sorting', A: solvedCount === 0 ? 0 : 65, fullMark: 150 },
  ];

  // Helper mapping icon type for activities polymorphically
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "problem_solved":
        return <Code2 className="text-cyan-500 h-4 w-4" />;
      case "track_enroll":
        return <Compass className="text-purple-500 h-4 w-4" />;
      case "learning_start":
        return <BookOpenCheck className="text-emerald-500 h-4 w-4" />;
      case "interview_completed":
        return <Award className="text-amber-500 h-4 w-4" />;
      case "project_complete":
        return <Trophy className="text-amber-400 h-4 w-4" />;
      case "career_update":
        return <Target className="text-rose-500 h-4 w-4" />;
      case "resource_click":
        return <Bookmark className="text-sky-400 h-4 w-4" />;
      case "note_saved":
        return <FileText className="text-zinc-400 h-4 w-4" />;
      default:
        return <Clock className="text-zinc-500 h-4 w-4" />;
    }
  };

  const getRecommendationActionLink = (rec: RecommendationData) => {
    if (!rec) return "/learn";
    switch (rec.actionType) {
      case "RESUME_LEARNING":
        return `/learn/${rec.metadata?.trackSlug || ""}?module=${rec.metadata?.moduleId || ""}`;
      case "START_INTERVIEW":
        return "/interview";
      case "BROWSE_TRACKS":
      default:
        return "/learn";
    }
  };

  const getRecommendationActionLabel = (rec: RecommendationData) => {
    if (!rec) return "Start Learning";
    switch (rec.actionType) {
      case "RESUME_LEARNING":
        return "Resume Module";
      case "START_INTERVIEW":
        return "Start Interview";
      case "BROWSE_TRACKS":
      default:
        return "Browse Tracks";
    }
  };

  // Continue Learning values
  const continueLearn = data?.learning?.continueLearning;
  const progressPercent = continueLearn?.progressPercent ?? 0;
  const estimatedRemaining = continueLearn?.estimatedRemainingMinutes ?? 0;

  const getContributionDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      const activity = data?.activityCalendar?.find(a => a.date === dateString) || {
        date: dateString,
        submissions: 0,
        accepted: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        modules: 0,
        sessions: 0,
        totalCount: 0
      };
      
      days.push({
        date: d,
        dateString,
        activity
      });
    }
    return days;
  };

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-zinc-200 dark:bg-zinc-800/60 w-full h-full rounded-sm border border-zinc-300/60 dark:border-zinc-700/40 hover:bg-zinc-300/80 dark:hover:bg-zinc-700/60 transition-colors";
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900/80 w-full h-full rounded-sm border border-emerald-300/50 dark:border-emerald-800/50 hover:bg-emerald-300 dark:hover:bg-emerald-800 transition-colors";
    if (count <= 4) return "bg-emerald-400 dark:bg-emerald-700 w-full h-full rounded-sm border border-emerald-500/40 dark:border-emerald-600/40 hover:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors";
    if (count <= 6) return "bg-emerald-500 dark:bg-emerald-500 w-full h-full rounded-sm border border-emerald-600/40 dark:border-emerald-400/40 hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-colors";
    return "bg-emerald-600 dark:bg-emerald-400 w-full h-full rounded-sm border border-emerald-700/40 dark:border-emerald-300/40 hover:bg-emerald-700 dark:hover:bg-emerald-300 transition-colors";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 text-foreground font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <SectionHeader
            badge="Developer OS Environment"
            title="Developer Home"
            highlight="Dashboard"
            description={`Resume checkpoints syncing dynamically. Target domain configured for standard FAANG roles with ${user?.name || "Member"}.`}
          />
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-card border border-border flex items-center gap-3">
                <Flame className="text-orange-500 fill-orange-500/10 h-5 w-5" />
                <div>
                   <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-none">Streak</p>
                   <p className="text-sm font-bold text-foreground mt-1">{currentStreakVal}</p>
                </div>
             </div>
             <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 shadow-lg shadow-primary/5">
                <Sparkles className="text-primary h-5 w-5" />
                <div>
                   <p className="text-[9px] text-primary font-bold uppercase tracking-wider leading-none">Level</p>
                   <p className="text-sm font-bold text-primary mt-1">Mastery III</p>
                </div>
             </div>
          </div>
        </div>

        {/* Unified 4-Metrics OS Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4 flex flex-col justify-between hover:border-primary/20 transition-all">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Tracks</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-foreground">{data?.learning?.activeTracksCount || "0"}</span>
              <span className="block mt-0.5 text-[9px] font-medium text-muted-foreground">Currently enrolled paths</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col justify-between hover:border-orange-500/20 transition-all">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Topics Completed</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-foreground">{data?.learning?.topicsCompleted || "0"} Modules</span>
              <span className="block mt-0.5 text-[9px] font-medium text-[#0ea5e9]">Study guides generated</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Study Hours</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-foreground">{data?.learning?.totalEstimatedStudyHours || "0"} Hours</span>
              <span className="block mt-0.5 text-[9px] font-medium text-emerald-500">Aggregated track estimations</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col justify-between hover:border-purple-500/20 transition-all">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Learning Progress</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-foreground">{data?.learning?.overallProgressPercent || "0"}%</span>
              <span className="block mt-0.5 text-[9px] font-medium text-purple-400">Total active completion rate</span>
            </div>
          </Card>
        </div>

        {/* Section Row 1: Today's Focus & Continue Learning */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Today's Focus Card */}
          <div className="lg:col-span-3">
            <Card className="h-full bg-gradient-to-br from-card/90 to-card/50 border-border p-6 relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 blur-[80px] -z-10 group-hover:bg-primary/20 transition-all duration-500" />
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/10">
                  <Target size={11} className="animate-spin duration-[4000ms]" /> Today&apos;s Focus Target
                </div>
                {data?.focus ? (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{data.focus.category}</p>
                    <h3 className="text-xl font-bold text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">{data.focus.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md">Recommended next sequential step based on your current active roadmap. Continue studying resources to maintain performance.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">No focal target set</h3>
                    <p className="text-xs text-muted-foreground">Pick and enroll in a study track to kick off learning checkpoints.</p>
                  </div>
                )}
                {data?.focus && (
                  <Link href={data.focus.link}>
                    <Button className="mt-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1.5 shadow-lg shadow-primary/20 cursor-pointer">
                      {data.focus.actionLabel} <ArrowRight size={12} />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>

          {/* Continue Learning Dial */}
          <div className="lg:col-span-2">
            <Card className="h-full bg-card border-border backdrop-blur-sm p-6 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#0ea5e9]">
                  <Compass size={11} /> Continue Learning
                </div>
                {continueLearn ? (
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm truncate">{continueLearn.trackTitle}</h4>
                    <p className="text-[11px] text-muted-foreground">Active: {continueLearn.moduleTitle}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No active path identified.</p>
                )}
              </div>

              {continueLearn && (
                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Track Completed</span>
                    <span className="font-mono font-bold text-foreground">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 to-[#0ea5e9] rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><Clock size={10} /> Remaining Study:</span>
                    <span className="font-bold text-foreground">{estimatedRemaining > 0 ? `${Math.round(estimatedRemaining / 60)} hrs (${estimatedRemaining} mins)` : "Completed"}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Section Row 2: Today's AI Recommendation Box */}
        {data?.recommendation && (
          <AiRecommendationCard 
            recommendation={data.recommendation.actionText}
            title="AI Coach Recommendation"
            actionLabel={getRecommendationActionLabel(data.recommendation)}
            onAction={() => {
              window.location.href = getRecommendationActionLink(data.recommendation!);
            }}
          />
        )}

        {/* Row 3: Polymorphic Recent Activity Feed & Mastery Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Polymorphic Recent Activity Feed */}
          <Card className="lg:col-span-2 bg-card/25 border-border backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                   <BrainCircuit size={18} className="text-primary" />
                   Recent Activity Feed
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">
                  A chronological log of your platform interactions (Problems, Learning, Interviews, etc.).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClientOnly>
                {!data?.activity || data.activity.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-secondary/15">
                     <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                     <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.2em]">No Activity Logged</p>
                  </div>
                ) : (
                  <div className="relative border-l border-border pl-4 ml-2 space-y-6 py-2">
                    {data.activity.map((act, index) => (
                      <div key={index} className="relative group">
                        {/* Dot marker */}
                        <div className="absolute -left-[25px] top-0.5 bg-background border border-border h-5 w-5 rounded-full flex items-center justify-center shadow-lg group-hover:border-primary/45 transition-colors">
                          {getActivityIcon(act.type)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-foreground leading-relaxed font-sans">{act.description}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            {new Date(act.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ClientOnly>
            </CardContent>
          </Card>

          {/* Skill Mastery Charts */}
          <div className="space-y-8">
            <Card className="bg-card/20 border-border backdrop-blur-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-foreground text-xs uppercase tracking-widest">Skill Mastery (Languages)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-5">
                {data?.skillMastery && data.skillMastery.length > 0 ? (
                  <div className="space-y-4">
                    {data.skillMastery.map((skill, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                          <span className="uppercase tracking-wider text-[10px] text-muted-foreground">{skill.language}</span>
                          <span className="text-primary font-mono text-[10px]">{skill.count} Solved</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (skill.count / 6) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center border border-dashed border-border rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    No solutions recorded yet
                  </div>
                )}

                <div className="h-[180px] w-full mt-2">
                  <ClientOnly>
                    <RadarChartComponent solvedCount={solvedCount} />
                  </ClientOnly>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/20 border-border backdrop-blur-sm p-6 relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] -z-10 group-hover:bg-primary/30 transition-all font-sans" />
               <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                     <Target />
                  </div>
                  <div>
                     <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">Join Career Cohort</h3>
                     <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-none mt-1">Expert FAANG mentors.</p>
                  </div>
               </div>
               <Button className="w-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all h-10 cursor-pointer">
                  Join Private Access
               </Button>
            </Card>
          </div>
        </div>

        {/* Dynamic Activity Heatmap & Difficulty Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* GitHub-like Contribution Heatmap */}
          <Card className="lg:col-span-2 bg-card/20 border-border backdrop-blur-sm p-6 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground uppercase tracking-wider text-xs flex items-center gap-2">
                    <Target size={14} className="text-emerald-500" />
                    Developer Activity Heatmap
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">365-Day Log of platform updates and learning tasks</p>
                </div>
              </div>
              
              <div className="flex gap-2 items-center overflow-x-auto pb-4 mt-2">
                <div className="flex flex-col justify-between text-[9px] text-muted-foreground h-[84px] pr-2 uppercase font-bold select-none font-mono">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="grid grid-flow-col grid-rows-7 gap-[3px] select-none">
                    {getContributionDays().map((day, idx) => (
                      <div 
                        key={idx} 
                        className="w-2.5 h-2.5 rounded-[1px] relative group/cell"
                      >
                        <div className={getCellColor(day.activity.totalCount)} />
                        
                        {/* Dynamic Tooltip Portal */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/cell:block z-30 bg-popover border border-border p-2.5 rounded-xl shadow-2xl text-[10px] text-popover-foreground min-w-[200px] pointer-events-none font-sans">
                          <p className="font-bold text-foreground mb-1">
                            {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {day.activity.totalCount > 0 ? (
                            <div className="space-y-0.5 text-muted-foreground text-[9px]">
                              <p className="flex justify-between font-bold border-b border-border pb-1 mb-1">
                                <span>Platform Activity:</span> 
                                <span className="text-emerald-500 font-bold">{day.activity.totalCount}</span>
                              </p>
                              {day.activity.sessions > 0 && (
                                <p className="flex justify-between"><span>• Session Check-in:</span> <span className="text-foreground">{day.activity.sessions} logged</span></p>
                              )}
                              {day.activity.modules > 0 && (
                                <p className="flex justify-between"><span>• Modules Completed:</span> <span className="text-foreground">{day.activity.modules} syllabus</span></p>
                              )}
                              {day.activity.submissions > 0 && (
                                <p className="flex justify-between">
                                  <span>• Algorithmic Solves:</span> 
                                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                    {day.activity.accepted} ({day.activity.easy}E / {day.activity.medium}M / {day.activity.hard}H)
                                  </span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground uppercase tracking-widest text-[8px] font-bold">No contributions logged</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-3 border-t border-border mt-2 select-none font-sans">
              <span className="font-semibold uppercase tracking-wider">Activity over last 365 days</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-800/60 border border-zinc-300/60 dark:border-zinc-700/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/80 border border-emerald-300/50 dark:border-emerald-800/50" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 dark:bg-emerald-700 border border-emerald-500/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-600/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-400 border border-emerald-700/40 dark:border-emerald-300/40" />
                <span>More</span>
              </div>
            </div>
          </Card>

          {/* Solved Problems Difficulty Breakdown Card */}
          <Card className="bg-card/20 border-border backdrop-blur-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground uppercase tracking-wider text-xs flex items-center gap-2">
                  <Trophy size={14} className="text-amber-500" />
                  Difficulty Breakdown
                </h3>
                <Badge variant="outline" className="border-border text-[10px] text-muted-foreground font-mono">
                  Total: {data?.difficultyBreakdown ? (data.difficultyBreakdown.easy + data.difficultyBreakdown.medium + data.difficultyBreakdown.hard) : '0'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                {/* Easy */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-500 font-bold">Easy</span>
                    <span className="text-muted-foreground font-mono font-bold">{data?.difficultyBreakdown?.easy || 0} Solved</span>
                  </div>
                  <div className="h-2 w-full bg-background border border-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((data?.difficultyBreakdown?.easy || 0) / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-500 font-bold">Medium</span>
                    <span className="text-muted-foreground font-mono font-bold">{data?.difficultyBreakdown?.medium || 0} Solved</span>
                  </div>
                  <div className="h-2 w-full bg-background border border-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((data?.difficultyBreakdown?.medium || 0) / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Hard */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-500 font-bold">Hard</span>
                    <span className="text-muted-foreground font-mono font-bold">{data?.difficultyBreakdown?.hard || 0} Solved</span>
                  </div>
                  <div className="h-2 w-full bg-background border border-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((data?.difficultyBreakdown?.hard || 0) / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border text-[10px] text-muted-foreground leading-relaxed font-sans">
              Mastery levels correlate to algorithm correctness, compilation sanity, and test case coverage metrics.
            </div>
          </Card>
        </div>
      </div>

      {/* Solve Detail Display Modal */}
      {selectedFeedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
           <Card className="w-full max-w-xl bg-card border-border shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                 <div>
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                       {selectedFeedInsight.problem_title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground uppercase tracking-widest text-[9px] mt-1 font-bold">
                       Solve Performance Report Card
                    </CardDescription>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                   onClick={() => setSelectedFeedInsight(null)}
                 >
                    <X size={14} />
                 </Button>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-2">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-secondary/40 border border-border rounded-xl text-center">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase">Difficulty</p>
                       <p className="text-xs font-bold text-yellow-500 uppercase mt-0.5">{selectedFeedInsight.problem_difficulty}</p>
                    </div>
                    <div className="p-3 bg-secondary/40 border border-border rounded-xl text-center">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase">Status</p>
                       <p className="text-xs font-bold text-emerald-500 uppercase mt-0.5">{selectedFeedInsight.status.toUpperCase()}</p>
                    </div>
                    <div className="p-3 bg-secondary/40 border border-border rounded-xl text-center">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase">Solved Count</p>
                       <p className="text-xs font-bold text-primary mt-0.5">{selectedFeedInsight.solved_count} Times</p>
                    </div>
                 </div>

                 {/* Attempts History */}
                 <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">History of Submissions</h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                       {selectedFeedInsight.attempts && selectedFeedInsight.attempts.map((att: InsightAttempt, idx: number) => (
                           <div key={idx} className="p-3 rounded-xl bg-secondary/20 border border-border flex items-center justify-between text-xs">
                              <div className="space-y-0.5">
                                 <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">{att.language}</p>
                                 <p className="text-[10px] text-muted-foreground">{new Date(att.created_at).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] px-2 py-0">
                                    {att.passed_cases}/{att.total_cases} Cases
                                 </Badge>
                                 <span className="font-mono text-muted-foreground font-bold">Score: {att.score}</span>
                              </div>
                           </div>
                        ))}
                    </div>
                 </div>

                 <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1.5 font-sans">AI Feedback Analysis</p>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
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
           <Card className="w-full max-w-md bg-card border-border shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
              <CardHeader className="text-center pb-2">
                 <div className="mx-auto h-12 w-12 rounded-full bg-secondary border border-border flex items-center justify-center mb-4 text-amber-500">
                    <Zap size={24} />
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground tracking-tight">Reattempt Challenge?</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-medium">
                     You have already successfully submitted code for this question. Do you want to reattempt?
                  </CardDescription>
              </CardHeader>
              
              <CardContent className="flex items-center justify-center gap-3 pt-4">
                 <Button 
                   variant="outline" 
                   className="rounded-xl h-10 px-6 border-border bg-secondary text-muted-foreground hover:text-foreground cursor-pointer text-xs uppercase"
                   onClick={() => setShowReattemptConfirm(null)}
                 >
                    Cancel
                  </Button>
                  <Button 
                    className="rounded-xl h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer text-xs uppercase"
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
