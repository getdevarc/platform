"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, 
  Target, 
  Map as MapIcon, 
  ChevronRight, 
  Code,
  Sparkles,
  CheckCircle2,
  Circle,
  Loader2,
  BrainCircuit,
  X,
  BookOpen,
  ExternalLink,
  ClipboardList,
  CheckSquare,
  HelpCircle,
  Clock,
  Briefcase
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
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "REVISIT";
  duration: number;
}

interface CareerPlan {
  summary: string;
  estimated_timeline: string;
}

interface UserProfile {
  role: string | null;
  target_domain: string | null;
  career_answers: string | Record<string, unknown> | null;
}

interface RecommendationTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  icon: string;
  status: "Not Started" | "Active" | "Completed";
  whyExplanation: string;
}

interface RecommendationData {
  isOnboarded: boolean;
  targetRole?: string;
  dreamCompany?: string;
  recommendations: RecommendationTrack[];
}

interface RoadmapResponse {
  user: UserProfile;
  careerPlan: CareerPlan | null;
  steps: RoadmapStep[];
  recommendationData?: RecommendationData;
}

interface Resource {
  title: string;
  url: string;
  source: string;
  reason: string;
}

interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  difficulty: string;
  estimatedTime: string;
}

interface PracticeProject {
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  tasks: ProjectTask[];
}

interface InterviewPrep {
  difficulty: string;
  question_text: string;
  expected_answer: string;
  tags: string[];
  estimated_duration: number;
}

interface RevisionItem {
  title: string;
  completed: boolean;
}

interface StepDetails {
  guide: { content: string } | null;
  resources: Resource[];
  projects: PracticeProject[];
  interviewPreps: InterviewPrep[];
  revisionChecklist: RevisionItem[];
}

export default function CareerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [recData, setRecData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Active workspace / lazy assets states
  const [activeStep, setActiveStep] = useState<RoadmapStep | null>(null);
  const [stepDetails, setStepDetails] = useState<StepDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "resources" | "projects" | "interview" | "revision">("guide");

  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  // Onboarding parameters modal
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [modalGoal, setModalGoal] = useState("Full Stack Engineer Transition");
  const [modalExperience, setModalExperience] = useState("Intermediate");
  const [modalTimeline, setModalTimeline] = useState("6 Months");

  const fetchLatestRoadmap = async () => {
    try {
      const res = await api.get<ApiResponse<RoadmapResponse>>("/career/latest");
      if (res.data.data) {
        const payload = res.data.data;
        setProfileData(payload.user);
        setCareerPlan(payload.careerPlan);
        setSteps(payload.steps);
        if (payload.recommendationData) {
          setRecData(payload.recommendationData);
        }

        // Auto-select the first in-progress or available step if user clicks workspace and is onboarded
        if (payload.steps.length > 0 && !activeStep && payload.recommendationData?.isOnboarded) {
          const inProgress = payload.steps.find(s => s.status === "IN_PROGRESS") || payload.steps[0];
          fetchStepDetails(inProgress);
        }
      }
    } catch (err) {
      console.error("Failed to fetch custom career platform pathway", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRoadmap();
  }, []);

  // ESC Listener to close active workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveStep(null);
        setStepDetails(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchStepDetails = async (step: RoadmapStep) => {
    setActiveStep(step);
    setLoadingDetails(true);
    setActiveTab("guide");
    setExpandedQuestions({});
    try {
      const res = await api.get<ApiResponse<StepDetails>>(`/career/step-details?stepId=${step.id}`);
      if (res.data.data) {
        setStepDetails(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load step details.");
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRegenerateStep = async () => {
    if (!activeStep) return;
    setLoadingDetails(true);
    try {
      const res = await api.post<ApiResponse<StepDetails>>("/career/study-guide/regenerate", {
        stepId: activeStep.id
      });
      if (res.data.data) {
        setStepDetails(res.data.data);
        toast.success("AI rebuilt study workspace guidance!");
      }
    } catch (err) {
      toast.error("Failed to regenerate step workspace.");
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post<ApiResponse<{ plan: CareerPlan | null; steps: RoadmapStep[] }>>("/career/onboarding", {
        role: user?.role || "Developer",
        target_domain: modalGoal,
        answers: {
          experience: modalExperience,
          timeline: modalTimeline,
          dream_company: "Atlassian"
        }
      });
      if (res.data.success) {
        toast.success("AI generated your custom transition pathway!");
        setShowRegenModal(false);
        fetchLatestRoadmap();
      }
    } catch (err) {
      toast.error("Failed to generate career path.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Toggle tasks checkmarks (stubbed for current page structure, unchanged behavior)
  const toggleProjectTask = async (projectTitle: string, taskId: string, currentStatus: boolean) => {
    if (!activeStep || !stepDetails) return;
    const updatedProjects = stepDetails.projects.map(proj => {
      if (proj.title === projectTitle) {
        return {
          ...proj,
          tasks: proj.tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t)
        };
      }
      return proj;
    });
    setStepDetails({ ...stepDetails, projects: updatedProjects });

    try {
      await api.post("/career/progress/project-task", {
        stepId: activeStep.id,
        projectTitle,
        taskId,
        completed: !currentStatus
      });
    } catch (err) {
      console.error("Failed to save project task completion status to db", err);
      fetchStepDetails(activeStep);
    }
  };

  const toggleRevisionItem = async (title: string, currentStatus: boolean) => {
    if (!activeStep || !stepDetails) return;
    const updatedChecklist = stepDetails.revisionChecklist.map(item => 
      item.title === title ? { ...item, completed: !currentStatus } : item
    );
    setStepDetails({ ...stepDetails, revisionChecklist: updatedChecklist });

    try {
      await api.post("/career/progress/revision-task", {
        stepId: activeStep.id,
        title,
        completed: !currentStatus
      });
    } catch (err) {
      console.error("Failed to save revision completion status to db", err);
      fetchStepDetails(activeStep); 
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      let formatted = line;
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formatted = formatted.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-[10px] text-primary'>$1</code>");

      if (formatted.startsWith("### ")) {
        return <h3 key={idx} className="text-[13px] font-bold my-3 text-foreground border-b border-border pb-1 font-sans" dangerouslySetInnerHTML={{ __html: formatted.slice(4) }} />;
      }
      if (formatted.startsWith("#### ")) {
        return <h4 key={idx} className="text-[10px] font-bold my-2 text-primary uppercase tracking-widest font-sans" dangerouslySetInnerHTML={{ __html: formatted.slice(5) }} />;
      }
      if (formatted.trim().startsWith("* ") || formatted.trim().startsWith("- ")) {
        return <li key={idx} className="ml-3 list-disc text-xs text-muted-foreground my-1 font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted.trim().slice(2) }} />;
      }
      return <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1 font-sans" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  const targetTimeline = careerPlan?.estimated_timeline || "3 Months";

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing your timeline...</p>
    </div>
  );

  // If onboarding is incomplete, display appropriate empty state
  if (recData && !recData.isOnboarded) {
    return (
      <div className="flex-1 bg-background text-foreground flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -z-10" />
          
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto border border-primary/20 shadow-md">
            <Compass size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Complete Career Profile</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Unlock personalized learning track recommendations dynamically aligned with your target goals, dream company, and timeline. Please click below to generate your initial path.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => setShowRegenModal(true)}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/25"
            >
              Start Onboarding Questionnaire
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const heroActions = (
    <Button 
      className="h-11 px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
      onClick={() => setShowRegenModal(true)}
    >
      <Sparkles className="h-4 w-4" />
      Customize Path
    </Button>
  );

  return (
    <div className="relative flex-1 overflow-hidden h-[calc(100vh-64px)] flex flex-col bg-background text-foreground animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12 w-full max-w-7xl mx-auto pb-24">
         
         {/* Personalized Dynamic Header Block */}
         <BaseHero 
           badgeText="CAREER OPERATING SYSTEM ACTIVE"
           title={profileData?.target_domain || "Software Specialist"}
           highlight="Pathway"
           description={
             careerPlan?.summary || 
             `Accelerating transition towards target software domains with custom technical roadmaps curated by AI.`
           }
           actions={heroActions}
         />

         {/* Premium Header Statistics Indicators (4-Column Layout without core progress counts) */}
         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-card/40 border border-border rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase size={12} className="text-primary" /> Current Role
              </span>
              <p className="text-xs font-extrabold text-foreground mt-1 capitalize truncate">
                {profileData?.role || user?.role || "Not Set"}
              </p>
            </Card>

            <Card className="bg-card/40 border border-border rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target size={12} className="text-amber-500" /> Target Role
              </span>
              <p className="text-xs font-extrabold text-foreground mt-1 truncate">
                {recData?.targetRole || profileData?.target_domain || "Not Set"}
              </p>
            </Card>

            <Card className="bg-card/40 border border-border rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={12} className="text-emerald-500" /> Dream Company
              </span>
              <p className="text-xs font-extrabold text-foreground mt-1 truncate">
                {recData?.dreamCompany || "Not Set"}
              </p>
            </Card>

            <Card className="bg-card/40 border border-border rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="text-blue-500" /> Est. Timeline
              </span>
              <p className="text-xs font-extrabold text-foreground mt-1">
                {targetTimeline}
              </p>
            </Card>
         </div>

         {/* Dynamic Learning Track Recommendations Cards Section */}
         {recData && recData.recommendations && recData.recommendations.length > 0 && (
           <div className="space-y-4">
             <div className="space-y-1">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">
                 <Sparkles size={11} className="text-primary" />
                 Personalized Learning Tracks
               </span>
               <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest leading-relaxed pt-1.5">
                 To become a <span className="text-primary font-black lowercase">{recData.targetRole}</span> at <span className="text-amber-400 font-black">{recData.dreamCompany}</span>, complete these learning tracks:
               </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
               {recData.recommendations.map((track) => {
                 let statusBadgeClass = "bg-muted border-border text-muted-foreground";
                 if (track.status === "Active") {
                   statusBadgeClass = "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
                 } else if (track.status === "Completed") {
                   statusBadgeClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
                 }

                 return (
                   <div
                     key={track.id}
                     onClick={() => router.push(`/learn/${track.slug}`)}
                     className="group cursor-pointer rounded-2xl border border-border bg-card/40 p-5 flex flex-col justify-between hover:border-primary/20 hover:bg-muted/40 shadow-xl transition-all duration-300 relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[35px] -z-10 group-hover:bg-primary/10 transition-colors" />

                     <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                           {track.status}
                         </span>
                         <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                           {track.estimated_hours} Hours
                         </span>
                       </div>

                       <div className="space-y-1">
                         <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                           {track.title}
                         </h4>
                         <p className="text-[10px] text-muted-foreground leading-normal font-sans mt-2">
                           {track.whyExplanation}
                         </p>
                       </div>
                     </div>

                     <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-primary font-mono text-[9px] font-bold uppercase tracking-widest">
                       <span>Go to Track workspace</span>
                       <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         )}

         {/* Timeline & Active Workspace Panel layout */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Roadmap Milestones list */}
            <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <MapIcon size={14} className="text-primary" />
                     Milestone Pathway
                  </h2>
                </div>

                <div className="relative pl-1">
                  {steps.map((step, idx) => {
                    const isActive = activeStep?.id === step.id;
                    return (
                      <div key={step.id} className="relative group/node select-none">
                        <TimelineNode 
                          title={step.title}
                          description={`${step.duration || 4} hours • ${step.description}`}
                          status={
                            step.status === "COMPLETED" ? "completed" :
                            step.status === "IN_PROGRESS" ? "current" : "locked"
                          }
                          type={step.type}
                          isLast={idx === steps.length - 1}
                          hasGuide={true} // Display indicator to let them know workspace loads this step
                          onClick={() => fetchStepDetails(step)}
                        />
                        {/* Interactive glow border on active selected step */}
                        {isActive && (
                          <div className="absolute left-[34px] inset-y-0 right-0 border-l-[3px] border-primary pointer-events-none rounded-l" />
                        )}
                      </div>
                    );
                  })}

                  {steps.length === 0 && (
                    <div className="text-center py-10 bg-muted/10 border border-dashed border-border rounded-2xl p-6">
                      <Compass className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No onboarding milestones found. Run transition custom onboarding form.</p>
                    </div>
                  )}
                </div>
            </div>

            {/* Right Tabbed Workspace Widget */}
            <div className="lg:col-span-2">
               {activeStep ? (
                  <Card className="bg-card border border-border rounded-3xl p-6 relative group overflow-hidden shadow-2xl flex flex-col h-[750px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -z-10 group-hover:bg-primary/20 transition-all" />
                    
                    {/* Workspace Header */}
                    <div className="flex items-start justify-between border-b border-border pb-4 shrink-0">
                       <div>
                          <Badge variant="outline" className="text-primary border-primary/25 bg-primary/10 mb-1.5 uppercase font-bold tracking-widest text-[9px] font-mono">
                             Milestone {steps.indexOf(activeStep) + 1} • {activeStep.type}
                          </Badge>
                          <h3 className="text-base font-extrabold text-foreground leading-tight">{activeStep.title}</h3>
                       </div>
                       
                       <div className="flex items-center gap-1.5 shrink-0">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={handleRegenerateStep}
                           disabled={loadingDetails}
                           className="h-8 px-2.5 gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-muted border border-border hover:border-primary/20 text-foreground hover:bg-muted/80"
                         >
                            {loadingDetails ? (
                               <Loader2 size={10} className="animate-spin" />
                            ) : (
                               <Sparkles size={10} />
                            )}
                            Re-generate Workspace
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 rounded-full bg-muted border border-border text-foreground hover:bg-muted/80 cursor-pointer"
                           onClick={() => {
                             setActiveStep(null);
                             setStepDetails(null);
                           }}
                         >
                            <X size={14} />
                         </Button>
                       </div>
                    </div>

                    {/* Tabs Options Navigation Bar */}
                    <div className="flex items-center gap-1 mt-4 border-b border-border pb-2 shrink-0 overflow-x-auto text-[10px] font-bold uppercase tracking-wider font-mono">
                       {[
                         { id: "guide", label: "Study Guide", icon: BookOpen },
                         { id: "resources", label: "Resources", icon: LinkIconWrapper },
                         { id: "projects", label: "Practice Projects", icon: Code },
                         { id: "interview", label: "Interview Prep", icon: HelpCircle },
                         { id: "revision", label: "Revision List", icon: CheckSquare }
                       ].map(t => {
                         const TabIcon = t.icon;
                         const isCurrent = activeTab === t.id;
                         return (
                           <button
                             key={t.id}
                             onClick={() => setActiveTab(t.id as "guide" | "resources" | "projects" | "interview" | "revision")}
                             className={cn(
                               "h-8 px-3.5 rounded-lg flex items-center gap-2 border transition-all truncate hover:text-foreground",
                               isCurrent 
                                 ? "bg-primary/10 text-primary border-primary/25"
                                 : "border-transparent text-muted-foreground hover:bg-muted/30"
                             )}
                           >
                             <TabIcon size={12} />
                             {t.label}
                           </button>
                         )
                       })}
                    </div>

                    {/* Workspace Core Body area */}
                    <div className="flex-1 overflow-y-auto py-6 pr-1 scrollbar-hide text-foreground/90">
                      {loadingDetails ? (
                        <div className="h-full w-full flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Generating milestone coaching assets...</span>
                        </div>
                      ) : stepDetails ? (
                        <div className="space-y-6">
                           
                           {/* Guide Tab */}
                           {activeTab === "guide" && (
                             <div className="space-y-4 text-xs select-text">
                               {renderFormattedText(stepDetails.guide?.content || "")}
                             </div>
                           )}

                           {/* Resources Tab */}
                           {activeTab === "resources" && (
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                  <BookOpen size={12} className="text-primary" />
                                  Recommended reference URLs ({stepDetails.resources.length})
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {stepDetails.resources.map((res, index) => (
                                    <div key={index} className="p-4 rounded-xl bg-muted/40 border border-border hover:border-primary/20 transition-all space-y-2 group">
                                      <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground font-mono">
                                        <span>{res.source || "External Resource"}</span>
                                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-2 py-0">
                                          Link
                                        </Badge>
                                      </div>
                                      <a 
                                        href={res.url} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-1 font-bold text-xs text-white hover:text-primary transition-colors group-hover:underline"
                                      >
                                        {res.title}
                                        <ExternalLink size={10} className="text-muted-foreground shrink-0" />
                                      </a>
                                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-sans">{res.reason}</p>
                                    </div>
                                  ))}
                                  {stepDetails.resources.length === 0 && (
                                    <span className="text-xs text-muted-foreground">No resources generated yet.</span>
                                  )}
                                </div>
                             </div>
                           )}

                           {/* Projects Tab */}
                           {activeTab === "projects" && (
                             <div className="space-y-4">
                               {stepDetails.projects.map((proj, idx) => (
                                 <div key={idx} className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3">
                                   <div className="flex justify-between items-start gap-2">
                                     <div>
                                         <h4 className="text-sm font-bold text-foreground tracking-wide">{proj.title}</h4>
                                         <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>
                                     </div>
                                     <div className="flex gap-2 shrink-0">
                                         <Badge className="bg-primary/10 text-primary border-none rounded">{proj.difficulty}</Badge>
                                         <Badge className="bg-muted text-foreground border-none rounded">{proj.estimated_time}</Badge>
                                     </div>
                                   </div>

                                   {/* Tasks checklist */}
                                   <div className="space-y-2 pt-3 border-t border-border">
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tasks Blueprint</span>
                                      <div className="space-y-2">
                                         {proj.tasks.map((task) => (
                                           <div 
                                             key={task.id}
                                             onClick={() => toggleProjectTask(proj.title, task.id, task.completed)}
                                             className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border cursor-pointer hover:border-primary/20 transition-all select-none"
                                           >
                                             <div className="flex items-center gap-3">
                                                {task.completed ? (
                                                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                  <Circle size={16} className="text-muted-foreground shrink-0" />
                                                )}
                                                <span className={cn(
                                                  "text-xs",
                                                  task.completed ? "text-muted-foreground line-through" : "text-foreground"
                                                )}>
                                                  {task.title}
                                                </span>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono text-muted-foreground">{task.estimatedTime}</span>
                                                <span className="text-[9px] font-extrabold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[8px] tracking-wide scale-90">{task.difficulty}</span>
                                             </div>
                                           </div>
                                         ))}
                                      </div>
                                   </div>
                                 </div>
                               ))}
                               {stepDetails.projects.length === 0 && (
                                 <span className="text-xs text-muted-foreground">No practice projects recommended.</span>
                               )}
                             </div>
                           )}

                           {/* Interview Prep Tab */}
                           {activeTab === "interview" && (
                             <div className="space-y-3.5">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 font-mono">
                                   <HelpCircle size={12} className="text-primary" />
                                   Coaching Mock Q&As ({stepDetails.interviewPreps.length})
                                </h4>
                                <div className="space-y-3">
                                  {stepDetails.interviewPreps.map((prep, idx) => {
                                    const isOpen = !!expandedQuestions[idx];
                                    return (
                                      <div key={idx} className="border border-border rounded-2xl overflow-hidden bg-muted/40">
                                         <div 
                                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/80 select-none transition-all gap-3"
                                           onClick={() => setExpandedQuestions(p => ({ ...p, [idx]: !isOpen }))}
                                         >
                                            <div className="space-y-1">
                                               <div className="flex gap-2 items-center">
                                                  <Badge className="bg-primary/10 text-primary text-[8px] py-0 border-none tracking-wider rounded">{prep.difficulty}</Badge>
                                                  <span className="text-[9px] font-mono text-muted-foreground">{prep.estimated_duration} mins</span>
                                               </div>
                                               <p className="text-xs font-bold text-foreground leading-relaxed">{prep.question_text}</p>
                                            </div>
                                            <ChevronRight size={14} className={cn("text-muted-foreground transition-transform shrink-0", isOpen && "rotate-90")} />
                                         </div>
                                         {isOpen && (
                                            <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground space-y-3 font-sans leading-relaxed">
                                              <p className="font-semibold text-foreground">Expected answer:</p>
                                              <div className="bg-muted p-3 rounded-lg border border-border font-mono text-[10px] leading-relaxed text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                                 {prep.expected_answer}
                                              </div>
                                              {prep.tags && prep.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                   {prep.tags.map(tag => (
                                                     <Badge key={tag} className="bg-muted text-muted-foreground text-[8px] px-2 py-0 border border-border">{tag}</Badge>
                                                   ))}
                                                </div>
                                              )}
                                            </div>
                                         )}
                                      </div>
                                    )
                                  })}
                                </div>
                             </div>
                           )}

                           {/* Revision Checklists Tab */}
                           {activeTab === "revision" && (
                             <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                   <ClipboardList size={12} className="text-primary" />
                                   Milestone Concept Checks ({stepDetails.revisionChecklist.length})
                                </h4>
                                <div className="space-y-2.5">
                                   {stepDetails.revisionChecklist.map((item, idx) => (
                                     <div 
                                       key={idx}
                                       onClick={() => toggleRevisionItem(item.title, item.completed)}
                                       className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border cursor-pointer hover:border-primary/20 transition-all select-none"
                                     >
                                        {item.completed ? (
                                           <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                        ) : (
                                           <Circle size={16} className="text-muted-foreground shrink-0" />
                                        )}
                                        <span className={cn(
                                          "text-xs leading-normal font-medium",
                                          item.completed ? "text-muted-foreground line-through" : "text-foreground"
                                        )}>
                                           {item.title}
                                        </span>
                                     </div>
                                   ))}
                                   {stepDetails.revisionChecklist.length === 0 && (
                                     <span className="text-xs text-muted-foreground">No revision checkpoints recommended.</span>
                                   )}
                                </div>
                             </div>
                           )}

                        </div>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center">
                           <Compass className="h-10 w-10 text-muted-foreground mb-2" />
                           <span className="text-xs text-muted-foreground">No study assets generated. Press regenerating button.</span>
                        </div>
                      )}
                    </div>

                    {/* Workspace Footer */}
                    <div className="border-t border-zinc-200 dark:border-white/5 pt-4 flex justify-between items-center text-[9px] text-zinc-500 font-mono shrink-0">
                      <span>Interactive Career Workspace Active</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl text-[9px] uppercase font-bold text-zinc-400 hover:text-zinc-205 border-zinc-250 dark:border-white/5"
                        onClick={() => {
                          setActiveStep(null);
                          setStepDetails(null);
                        }}
                      >
                        Close Workspace
                      </Button>
                    </div>
                  </Card>
               ) : (
                  <div className="space-y-6">
                     <Card className="bg-card border border-border rounded-3xl overflow-hidden p-6 text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                           <Compass size={24} />
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Select a Milestone Step</h3>
                           <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                             Click on any of the milestones on the left timeline to generate and open its interactive AI Mentor workspace.
                           </p>
                        </div>
                     </Card>

                     <Card className="bg-card/45 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                           <CardTitle className="text-primary flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold">
                              <BrainCircuit size={16} /> 
                              Strategic Strengths & Action Plan
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                           <ClientOnly>
                              <div className="space-y-4">
                                 <p className="text-xs text-zinc-450 leading-relaxed font-semibold">
                                    Assess gaps against target domain credentials:
                                 </p>
                                 <div className="grid grid-cols-1 gap-4">
                                    {[
                                      { label: "Backend Core Architecture API Layer", score: 65, factor: "Routing models, middleware controllers" },
                                      { label: "PostgreSQL Database Performance tuning", score: 48, factor: "Relational constraints and nested filters" },
                                      { label: "System Design Load Balancer Scalability", score: 35, factor: "Layer 4 client proxies split routing rules" }
                                    ].map((gap) => (
                                      <div key={gap.label} className="space-y-1.5 p-3.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-white/5">
                                         <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase">
                                            <span>{gap.label}</span>
                                            <span className="text-amber-500 font-mono mt-0.5">{gap.score}% Accuracy</span>
                                         </div>
                                         <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full" style={{ width: `${gap.score}%` }} />
                                         </div>
                                         <p className="text-[9px] text-zinc-500 italic font-mono">Competency Focus: {gap.factor}</p>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                           </ClientOnly>
                        </CardContent>
                     </Card>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Custom Onboarding Regeneration Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl text-zinc-900 dark:text-white">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-450 hover:text-white cursor-pointer"
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
                  placeholder="e.g. Senior Full Stack Engineer at Atlassian"
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

// Inline helper for resource link icon mapping
function LinkIconWrapper(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
