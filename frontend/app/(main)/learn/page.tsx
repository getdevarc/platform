"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Layout, 
  Server, 
  Code2, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced" | string;
  estimated_hours: number;
  icon: string;
  enrollment_status: "NOT_STARTED" | "ACTIVE" | "COMPLETED" | null | string;
  enrolled_at: string | null;
}

export default function LearnPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<LearningTrack[]>>("/learn/tracks");
      if (res.data.success) {
        setTracks(res.data.data);
      } else {
        toast.error("Failed to load learning tracks");
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error(err);
      toast.error("An error occurred while fetching tracks");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (trackId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid triggering card navigation
    try {
      setEnrollingMap(prev => ({ ...prev, [trackId]: true }));
      const res = await api.post("/learn/enroll", { trackId });
      if (res.data.success) {
        toast.success("Successfully enrolled in track!");
        // Update local status so UI redraws instantly
        setTracks(prev => prev.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              enrollment_status: "ACTIVE",
              enrolled_at: new Date().toISOString()
            };
          }
          return t;
        }));
      } else {
        toast.error(res.data.error || "Enrollment failed");
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error(err);
      toast.error(error.response?.data?.error || "Failed to enroll in track");
    } finally {
      setEnrollingMap(prev => ({ ...prev, [trackId]: false }));
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
      case "intermediate":
        return "bg-blue-500/10 border border-blue-500/20 text-blue-400";
      case "advanced":
        return "bg-purple-500/10 border border-purple-500/20 text-purple-400";
      default:
        return "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400";
    }
  };

  const getLucideIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "layout":
        return <Layout size={22} className="text-primary" />;
      case "server":
        return <Server size={22} className="text-primary" />;
      case "code-2":
        return <Code2 size={22} className="text-primary" />;
      default:
        return <BookOpen size={22} className="text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="space-y-4 text-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Loading Learning Tracks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground py-12 px-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">
            <Sparkles size={11} className="text-primary" />
            Phase 1 Foundation
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Explore Learning Tracks
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Select a structured educational track to master engineering principles. Enrolled checkmarks persist to track your curriculum milestones.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tracks.map((track) => {
            const isEnrolled = !!track.enrollment_status;
            const isEnrolling = enrollingMap[track.id];

            return (
              <div 
                key={track.id}
                onClick={() => router.push(`/learn/${track.slug}`)}
                className="group cursor-pointer rounded-2xl border border-border bg-card/40 p-6 flex flex-col justify-between hover:border-primary/25 hover:bg-card/60 shadow-xl shadow-black/5 dark:shadow-black/20 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] -z-10 group-hover:bg-primary/10 transition-colors" />
                
                <div className="space-y-4">
                  {/* Icon & Difficulty Badge */}
                  <div className="flex justify-between items-center">
                    <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center shadow-md">
                      {getLucideIcon(track.icon)}
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${getDifficultyBadge(track.difficulty)}`}>
                      {track.difficulty}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed truncate-3-lines">
                      {track.description}
                    </p>
                  </div>
                </div>

                {/* Footer Meta & Actions */}
                <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                    <Clock size={12} />
                    <span>{track.estimated_hours} Hours</span>
                  </div>

                  {isEnrolled ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-3 rounded-lg text-emerald-400 hover:text-emerald-350 hover:bg-emerald-500/5 text-[10px] font-extrabold uppercase tracking-widest"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/learn/${track.slug}`);
                      }}
                    >
                      <Award size={12} />
                      Enrolled
                      <ChevronRight size={10} />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isEnrolling}
                      onClick={(e) => handleEnroll(track.id, e)}
                      className="h-8 gap-1.5 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-extrabold uppercase tracking-widest shadow-md shadow-primary/10"
                    >
                      {isEnrolling ? (
                        <div className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : (
                        <>
                          Begin Learning
                          <ArrowRight size={10} />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
