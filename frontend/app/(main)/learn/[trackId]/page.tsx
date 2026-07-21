"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowRight,
  BookOpen, 
  Bookmark, 
  CheckCircle,
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  HelpCircle, 
  Loader2, 
  RefreshCw,
  Award,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  HelpCircle as QuizIcon,
  BookMarked,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import dynamic from "next/dynamic";
import { io } from "socket.io-client";

const MarkdownRenderer = dynamic(
  () => import("@/components/feature/learn/MarkdownRenderer").then(mod => mod.MarkdownRenderer),
  { ssr: false, loading: () => <div className="py-6 flex flex-col items-center justify-center space-y-2"><Loader2 className="animate-spin text-muted-foreground" /><span className="text-[8px] font-mono text-muted-foreground/80 uppercase">Loading guide...</span></div> }
);

const NotesEditor = dynamic(
  () => import("@/components/feature/learn/NotesEditor"),
  { ssr: false }
);

interface Module {
  id: string;
  title: string;
  sort_order: number;
}

interface Page {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  display_order: number;
  estimated_minutes: number;
  status: string;
  is_completed?: boolean;
  is_bookmarked?: boolean;
}

interface PageProgress {
  is_completed: boolean;
  is_bookmarked: boolean;
  notes: string | null;
}

interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  icon: string;
  enrollment_status: string | null;
  enrolled_at: string | null;
  last_visited_page_id: string | null;
  modules: Module[];
}

interface ModuleContentData {
  content: string;
  updated_at: string;
}

interface ModuleResource {
  id?: string;
  title: string;
  category: string;
  reason: string;
  difficulty: string;
  url: string | null;
  is_official?: boolean;
  source_name?: string;
}

interface ModuleResourceData {
  resources: ModuleResource[];
  updated_at: string;
}



export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trackId = params.trackId as string;

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.email === "jhaaman810@gmail.com";

  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [loading, setLoading] = useState(true);

  // Active module/page states
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [modulePages, setModulePages] = useState<Record<string, Page[]>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [loadingPages, setLoadingPages] = useState<Record<string, boolean>>({});
  const [currentTab, setCurrentTab] = useState<"guide" | "resources">("guide");

  // Study content tab states
  const [contentData, setContentData] = useState<ModuleContentData | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Resources tab states
  const [resourcesData, setResourcesData] = useState<ModuleResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // User page progress states
  const [pageProgress, setPageProgress] = useState<PageProgress | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  // Flat structured array of pages for page boundary transitions
  const [flatPages, setFlatPages] = useState<Page[]>([]);

  // Preload all module pages
  const preloadAllModules = async (mods: Module[]) => {
    const pagesMap: Record<string, Page[]> = {};
    const flat: Page[] = [];
    
    // Set loading indicator
    const initialLoading: Record<string, boolean> = {};
    mods.forEach(m => { initialLoading[m.id] = true; });
    setLoadingPages(initialLoading);

    try {
      const promises = mods.map(async (mod) => {
        try {
          const resPages = await api.get<ApiResponse<Page[]>>(`/learn/modules/${mod.id}/pages`);
          if (resPages.data.success) {
            pagesMap[mod.id] = resPages.data.data;
          } else {
            pagesMap[mod.id] = [];
          }
        } catch (e) {
          console.error(e);
          pagesMap[mod.id] = [];
        }
      });

      await Promise.all(promises);
      setModulePages(pagesMap);

      // Construct flat list in order
      mods.forEach(mod => {
        const pages = pagesMap[mod.id] || [];
        pages.forEach(p => {
          flat.push(p);
        });
      });
      setFlatPages(flat);

      return { pagesMap, flat };
    } catch (err) {
      console.error("Error preloading pages:", err);
      return { pagesMap: {}, flat: [] };
    } finally {
      setLoadingPages({});
    }
  };

  useEffect(() => {
    const fetchTrackDetailsAndPreload = async () => {
      try {
        setLoading(true);
        const res = await api.get<ApiResponse<LearningTrack>>(`/learn/tracks/${trackId}`);
        if (res.data.success) {
          const trackData = res.data.data;
          setTrack(trackData);

          if (trackData.modules && trackData.modules.length > 0) {
            const { pagesMap } = await preloadAllModules(trackData.modules);

            // Restore user page session
            const sessionPageId = trackData.last_visited_page_id;
            let restoredPage: Page | null = null;
            let restoredModule: Module | null = null;

            if (sessionPageId) {
              for (const mod of trackData.modules) {
                const pages = pagesMap[mod.id] || [];
                const match = pages.find(p => p.id === sessionPageId);
                if (match) {
                  restoredPage = match;
                  restoredModule = mod;
                  break;
                }
              }
            }

            // Fallback to first page
            if (!restoredPage) {
              for (const mod of trackData.modules) {
                const pages = pagesMap[mod.id] || [];
                if (pages.length > 0) {
                  restoredPage = pages[0];
                  restoredModule = mod;
                  break;
                }
              }
            }

            if (restoredPage && restoredModule) {
              setExpandedModules({ [restoredModule.id]: true });
              handleSelectPage(restoredPage, restoredModule);
            } else if (trackData.modules.length > 0) {
              // Legacy module content mode
              handleSelectModule(trackData.modules[0]);
            }
          }
        } else {
          toast.error(res.data.error || "Failed to load learning track details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error occurred while loading track details");
      } finally {
        setLoading(false);
      }
    };

    if (trackId) {
      fetchTrackDetailsAndPreload();
    }
  }, [trackId]);

  const handleSaveNotes = useCallback(async (notes: string) => {
    if (!activePage) return;
    try {
      const res = await api.patch<ApiResponse<PageProgress>>(`/learn/pages/${activePage.id}/progress`, {
        notes
      });
      if (res.data.success) {
        setPageProgress(res.data.data);
      }
    } catch (e) {
      console.error("Failed to auto-save notes:", e);
      throw e;
    }
  }, [activePage]);

    // Lazy generation load on active module select (only fallback context if no pages)
  const handleSelectModule = async (mod: Module) => {
    setActiveModule(mod);
    setActivePage(null);
    setCurrentTab("guide");
    setContentData(null);
    setResourcesData([]);
    setPageProgress(null);

    setLoadingContent(true);
    try {
      const res = await api.get<ApiResponse<ModuleContentData>>(`/learn/modules/${mod.id}/content`);
      if (res.data.success) {
        setContentData(res.data.data);
      }
      const resResources = await api.get<ApiResponse<ModuleResourceData>>(`/learn/modules/${mod.id}/resources`);
      if (resResources.data.success) {
        setResourcesData(resResources.data.data.resources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContent(false);
    }
  };

  // Reusable page resources fetcher
  const fetchPageResources = useCallback(async (pageId: string) => {
    try {
      const resourcesRes = await api.get<ApiResponse<ModuleResourceData>>(`/learn/pages/${pageId}/resources`);
      if (resourcesRes.data.success) {
        setResourcesData(resourcesRes.data.data.resources || []);
      }
    } catch (err) {
      console.error("Failed to fetch page resources:", err);
    }
  }, []);

  // Select page details
  const handleSelectPage = async (page: Page, mod: Module) => {
    setActivePage(page);
    setActiveModule(mod);
    setContentData(null);
    setResourcesData([]);
    setPageProgress(null);

    setLoadingContent(true);
    setLoadingResources(true);

    try {
      // 1. Fetch page guide content
      const contentRes = await api.get<ApiResponse<ModuleContentData>>(`/learn/pages/${page.id}/content`);
      if (contentRes.data.success) {
        setContentData(contentRes.data.data);
      }

      // 2. Fetch page progress data
      const progressRes = await api.get<ApiResponse<PageProgress>>(`/learn/pages/${page.id}/progress`);
      if (progressRes.data.success) {
        setPageProgress(progressRes.data.data);
      }

      // 3. Fetch resources (Page -> Module -> Track priority fallback resolved at backend)
      await fetchPageResources(page.id);

      // 4. Record/restore user session on track enrollment record (PATCH)
      api.patch(`/learn/tracks/${trackId}/session`, { pageId: page.id }).catch(err => {
        console.error("Failed to commit session update:", err);
      });

    } catch (err) {
      console.error(err);
      toast.error("Error occurred while fetching learning page details.");
    } finally {
      setLoadingContent(false);
      setLoadingResources(false);
    }
  };

  // Real-time sync Socket.IO hook
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected to real-time sync server:", socket.id);
    });

    socket.on("cms:updated", (data: { entityType: string; targetId: string }) => {
      console.log("[Socket.IO] Received CMS update event:", data);
      
      // If the resource updated is associated with the active page, reload resources
      if (data.entityType === "resources" && activePage && data.targetId === activePage.id) {
        fetchPageResources(activePage.id);
        toast.info("Resources refreshed in real-time.");
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] Disconnected from sync server");
    });

    return () => {
      socket.disconnect();
    };
  }, [activePage, fetchPageResources]);

  // Toggle user progress completion/bookmark markers
  const handleToggleProgress = async (field: "completed" | "bookmarked") => {
    if (!activePage || savingProgress) return;
    setSavingProgress(true);

    const isCompletedVal = field === "completed" ? !pageProgress?.is_completed : !!pageProgress?.is_completed;
    const isBookmarkedVal = field === "bookmarked" ? !pageProgress?.is_bookmarked : !!pageProgress?.is_bookmarked;

    const payload = {
      is_completed: isCompletedVal,
      is_bookmarked: isBookmarkedVal
    };

    try {
      const res = await api.patch<ApiResponse<PageProgress>>(`/learn/pages/${activePage.id}/progress`, payload);
      if (res.data.success) {
        setPageProgress(res.data.data);
        
        // Update local map to dynamically trigger check ticks in navigation roadmap
        setModulePages(prev => {
          const copy = { ...prev };
          if (copy[activePage.module_id]) {
            copy[activePage.module_id] = copy[activePage.module_id].map(p => 
              p.id === activePage.id 
                ? { ...p, is_completed: isCompletedVal, is_bookmarked: isBookmarkedVal } 
                : p
            );
          }
          return copy;
        });

        toast.success(field === "completed"
          ? (res.data.data.is_completed ? "Page marked as completed!" : "Page completion unmarked.")
          : (res.data.data.is_bookmarked ? "Topic bookmarked!" : "Bookmark removed.")
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress.");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleRegenerate = async () => {
    setLoadingContent(true);
    setContentData(null);
    try {
      if (activePage) {
        const res = await api.post<ApiResponse<ModuleContentData>>(`/learn/pages/${activePage.id}/content/regenerate`);
        if (res.data.success) {
          setContentData(res.data.data);
          toast.success("Page content successfully regenerated!");
        } else {
          toast.error(res.data.error || "Failed to rebuild page study guide.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Errors occurred during content regeneration.");
    } finally {
      setLoadingContent(false);
    }
  };

  // Left Sidebar Expand/Collapse Modules
  const toggleModuleExpand = (modId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // Navigations (Prev/Next page)
  const getPrevNextPages = () => {
    if (!activePage || flatPages.length === 0) return { prev: null, next: null };
    const currentIndex = flatPages.findIndex(p => p.id === activePage.id);
    if (currentIndex === -1) return { prev: null, next: null };
    return {
      prev: currentIndex > 0 ? flatPages[currentIndex - 1] : null,
      next: currentIndex < flatPages.length - 1 ? flatPages[currentIndex + 1] : null
    };
  };

  const { prev: prevPage, next: nextPage } = getPrevNextPages();

  const handleNavigatePage = (target: Page) => {
    if (!track) return;
    const parentMod = track.modules.find(m => m.id === target.module_id);
    if (parentMod) {
      setExpandedModules(prev => ({ ...prev, [parentMod.id]: true }));
      handleSelectPage(target, parentMod);
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return "";
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

  const getCategoryBadgeClass = (category?: string) => {
    if (!category) return "bg-zinc-900 border border-white/5 text-zinc-500";
    switch (category.toLowerCase()) {
      case "official documentation":
      case "documentation":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "github repository":
      case "github":
        return "bg-violet-500/10 border-violet-500/20 text-violet-400";
      case "youtube":
      case "video":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      case "article":
      case "blog":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "book":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      default:
        return "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400";
    }
  };

  // Dynamic reading time calculator based on word count
  const getReadingTime = () => {
    if (!contentData?.content) return 0;
    const wordsCount = contentData.content.trim().split(/\s+/).length;
    return Math.max(1, Math.round(wordsCount / 200));
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="space-y-4 text-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Restoring Learning Workspace...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex-1 bg-background text-foreground py-20 px-6 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <HelpCircle size={48} className="text-muted-foreground mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Track Not Found</h2>
        <p className="text-muted-foreground text-xs mb-6">The requested learning curriculum does not exist or has been modified.</p>
        <Button onClick={() => router.push("/learn")} className="h-9 px-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] rounded-lg">
          Back to Tracks
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">
        
        {/* Top Actions: Back to Tracks */}
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/learn")}
            className="h-8 gap-1.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-[9px] font-extrabold uppercase tracking-widest"
          >
            <ChevronLeft size={12} />
            Back to Tracks
          </Button>
 
          {activePage && (
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${getDifficultyBadge(track.difficulty)}`}>
                {track.difficulty}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">
                Est: {track.estimated_hours}h Track
              </span>
            </div>
          )}
        </div>

        {/* Unified 3-Column Learning System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          
          {/* =========================================================================
              LEFT SIDEBAR: Learning Roadmaps & Navigation
              ========================================================================= */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-primary" />
                <h2 className="text-[10px] font-extrabold text-foreground uppercase tracking-widest">Syllabus Outline</h2>
              </div>
              <span className="text-[9px] text-muted-foreground font-mono">
                {flatPages.length} Pages
              </span>
            </div>
 
            {/* Tree Accordion */}
            <div className="space-y-2.5">
              {track.modules && track.modules.length > 0 ? (
                track.modules.map((mod, idx) => {
                  const isModExpanded = !!expandedModules[mod.id];
                  const pages = modulePages[mod.id] || [];
                  const countCompleted = pages.filter(p => p.is_completed).length;
                  const totalPgCount = pages.length;
                  
                  return (
                    <div key={mod.id} className="rounded-xl border border-border bg-card/20 overflow-hidden">
                      {/* Module Row */}
                      <div 
                        onClick={() => toggleModuleExpand(mod.id)}
                        className={cn(
                          "p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors border-b border-transparent",
                          isModExpanded ? "bg-secondary/40 border-border" : "hover:bg-secondary/20"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="text-[10px] font-black font-mono text-zinc-700 shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground/90 group-hover:text-foreground truncate block">
                              {mod.title}
                            </span>
                            {totalPgCount > 0 && (
                              <span className="text-[8px] font-medium text-muted-foreground block">
                                {countCompleted}/{totalPgCount} Lessons Completed
                              </span>
                            )}
                          </div>
                        </div>
 
                        <div className="flex items-center shrink-0">
                          {isModExpanded ? (
                            <ChevronDown size={14} className="text-muted-foreground" />
                          ) : (
                            <ChevronRight size={14} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>
 
                      {/* Nested Pages List */}
                      {isModExpanded && (
                        <div className="p-2 space-y-1 bg-background/40">
                          {pages.length > 0 ? (
                            pages.map((page, pIdx) => {
                              const isPageActive = activePage?.id === page.id;
                              return (
                                <div
                                  key={page.id}
                                  onClick={() => handleSelectPage(page, mod)}
                                  className={cn(
                                    "rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-all border",
                                    isPageActive
                                      ? "bg-primary/5 border-primary/20 text-primary"
                                      : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-1">
                                    <div className="shrink-0">
                                      {page.is_completed ? (
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                      ) : (
                                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 block ml-1" />
                                      )}
                                    </div>
                                    <span className="text-[11px] font-medium truncate">
                                      {page.title}
                                    </span>
                                  </div>
 
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    {page.is_bookmarked && (
                                      <Bookmark size={10} className="text-primary fill-primary" />
                                    )}
                                    {isPageActive && (
                                      <span className="h-1 w-1 rounded-full bg-primary" />
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-3 text-[10px] text-muted-foreground italic text-center">
                              No pages created yet.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground italic">No syllabus topics resolved.</p>
              )}
            </div>
          </div>

          {/* =========================================================================
              CENTER WORKSPACE: Distraction-free Study Area
              ========================================================================= */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Breadcrumb Indicator at top of Center workspace */}
            {activePage && (
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-mono text-muted-foreground shrink-0">
                <span className="hover:text-foreground cursor-default">{track.title}</span>
                <ChevronRight size={8} />
                <span className="hover:text-foreground cursor-default">{activeModule?.title}</span>
                <ChevronRight size={8} />
                <span className="text-primary font-bold">{activePage.title}</span>
              </div>
            )}

            <Card className="bg-card/45 border border-border rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[600px] shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -z-10" />

              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* Content Area Head */}
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest font-mono">
                      {activePage ? "Active Page Study Guide" : "Chapter Overview"}
                    </span>
                    <h1 className="text-lg sm:text-xl font-extrabold text-foreground leading-tight">
                      {activePage ? activePage.title : "Select Lesson"}
                    </h1>
                  </div>

                  {isAdmin && activePage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={loadingContent}
                      className="h-8 px-2.5 gap-1.5 text-[9px] font-bold uppercase tracking-wider bg-secondary border border-border hover:border-primary/20 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw size={10} className={cn(loadingContent && "animate-spin")} />
                      Regenerate
                    </Button>
                  )}
                </div>

                {/* Lesson Study Body */}
                <div className="flex-1">
                  {loadingContent ? (
                    <div className="h-full flex flex-col items-center justify-center p-16 text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Retrieving study guidelines...
                        </span>
                        <p className="text-[9px] text-muted-foreground/80 font-mono">
                          Formatting education course context
                        </p>
                      </div>
                    </div>
                  ) : contentData ? (
                    <div className="prose prose-invert max-w-none">
                      <MarkdownRenderer content={contentData.content} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-16 text-center space-y-3">
                      <HelpCircle className="h-10 w-10 text-muted/60" />
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Curriculum Lesson Workspace Empty
                        </h3>
                        <p className="text-[10px] text-muted-foreground/80 max-w-sm mt-0.5 leading-relaxed">
                          Select any subpage from the left roadmap hierarchy sidebar to trigger lesson guide rendering.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Navigation Page Boundaries at Bottom */}
                {activePage && (
                  <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                    {prevPage ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigatePage(prevPage)}
                        className="h-9 px-3 gap-1.5 rounded-lg border border-border text-[9px] font-extrabold uppercase tracking-widest hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft size={12} />
                        Prev: {prevPage.title}
                      </Button>
                    ) : (
                      <div />
                    )}

                    {nextPage ? (
                      <Button
                        onClick={() => handleNavigatePage(nextPage)}
                        className="h-9 px-4 gap-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-[9px] font-extrabold uppercase tracking-widest shrink-0"
                      >
                        Next: {nextPage.title}
                        <ArrowRight size={12} />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleToggleProgress("completed")}
                        disabled={savingProgress || pageProgress?.is_completed}
                        className={cn(
                          "h-9 px-4 gap-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all",
                          pageProgress?.is_completed
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 cursor-default"
                            : "bg-emerald-600 hover:bg-emerald-505 hover:bg-emerald-500 text-white"
                        )}
                      >
                        <CheckCircle size={12} />
                        {pageProgress?.is_completed ? "Course Section Complete!" : "Complete Course Track!"}
                      </Button>
                    )}
                  </div>
                )}

              </div>
            </Card>
          </div>

          {/* =========================================================================
              RIGHT SIDEBAR: Contextual Learning Companion
              ========================================================================= */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Quick Badges Dashboard Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Clock size={14} className="text-muted-foreground" />
              <h2 className="text-[10px] font-extrabold text-foreground uppercase tracking-widest">Study Info</h2>
            </div>

            {/* Information Cards Wrapper */}
            <Card className="bg-card border border-border rounded-xl p-4.5 space-y-4 shadow-xl">
              
              {/* Manual vs Automatic Completion Checkboxes */}
              {activePage && (
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">Progress Controls</span>
                  <div className="flex items-center gap-2 pt-0.5">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleProgress("completed")}
                      disabled={savingProgress}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors w-full justify-center",
                        pageProgress?.is_completed
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                      )}
                    >
                      <CheckCircle2 size={12} />
                      {pageProgress?.is_completed ? "Completed" : "Mark Page Complete"}
                    </button>

                    {/* Bookmark Checkbox */}
                    <button
                      onClick={() => handleToggleProgress("bookmarked")}
                      disabled={savingProgress}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg border transition-colors",
                        pageProgress?.is_bookmarked
                          ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                      )}
                      title="Bookmark page"
                    >
                      <Bookmark size={14} className={pageProgress?.is_bookmarked ? "fill-primary text-primary" : ""} />
                    </button>
                  </div>
                </div>
              )}

              {/* Lesson Metadata Display */}
              {activePage && (
                <div className="grid grid-cols-2 gap-2 pb-1">
                  <div className="bg-muted/40 border border-border rounded-lg p-2.5 text-center">
                    <span className="text-[8px] font-medium text-muted-foreground uppercase block tracking-wider mb-0.5">Difficulty</span>
                    <span className="text-[10px] font-bold text-foreground uppercase block">
                      {track.difficulty}
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-lg p-2.5 text-center">
                    <span className="text-[8px] font-medium text-muted-foreground uppercase block tracking-wider mb-0.5">Reading Est.</span>
                    <span className="text-[10px] font-bold text-foreground block">
                      {getReadingTime()} mins
                    </span>
                  </div>
                </div>
              )}

              {/* Personal Notes Textbox - Debounced autosaving */}
              {activePage && (
                <NotesEditor
                  pageId={activePage.id}
                  initialNotes={pageProgress?.notes || ""}
                  onSave={handleSaveNotes}
                />
              )}

              {/* Context-Aware Curated Resources Library */}
              <div className="space-y-3.5 border-t border-border pt-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">
                  📚 Curated Resources
                </span>

                {loadingResources ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                    <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">Searching library...</span>
                  </div>
                ) : resourcesData && resourcesData.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {resourcesData.map((res, index) => (
                      <div 
                        key={index} 
                        className="p-2.5 rounded-lg bg-muted/30 border border-border hover:border-border/60 transition-colors flex flex-col justify-between space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", getCategoryBadgeClass(res.category))}>
                            {res.category}
                          </span>
                          {res.is_official && (
                            <span className="text-[7px] font-bold bg-emerald-500/10 px-1 py-0.2 rounded text-emerald-400">Official</span>
                          )}
                        </div>
                        <h4 className="text-[10px] font-bold text-foreground line-clamp-1">{res.title}</h4>
                        <p className="text-[9px] text-muted-foreground leading-tight block line-clamp-2">{res.reason}</p>
                        {res.url && (
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[8px] font-bold uppercase tracking-wider pt-1 self-start"
                          >
                            <span>Launch link</span>
                            <ExternalLink size={8} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[9px] text-muted-foreground italic py-2 text-center">
                    No matching references found.
                  </div>
                )}
              </div>

              {/* ARCHITECTURE PLACEHOLDERS: FUTURE ENHANCEMENTS */}
              <div className="space-y-2.5 border-t border-border pt-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">
                  Future enhancements (Locked)
                </span>

                <div className="space-y-1.5 opacity-40 select-none">
                  {/* AI Explain Further */}
                  <div className="p-2 border border-dashed border-border rounded-lg flex items-center justify-between text-[9px] text-muted-foreground font-bold bg-transparent">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={10} className="text-muted-foreground" />
                      <span>💡 AI Explain Concept</span>
                    </div>
                    <span className="text-[7px] uppercase font-mono px-1 rounded-sm bg-muted border border-border">Sprint 8</span>
                  </div>

                  {/* Knowledge Check / Quiz */}
                  <div className="p-2 border border-dashed border-border rounded-lg flex items-center justify-between text-[9px] text-muted-foreground font-bold bg-transparent">
                    <div className="flex items-center gap-1.5">
                      <QuizIcon size={10} className="text-muted-foreground" />
                      <span>❓ Lesson Quick Quiz</span>
                    </div>
                    <span className="text-[7px] uppercase font-mono px-1 rounded-sm bg-muted border border-border">Sprint 8</span>
                  </div>

                  {/* Glossary / Definitions */}
                  <div className="p-2 border border-dashed border-border rounded-lg flex items-center justify-between text-[9px] text-muted-foreground font-bold bg-transparent">
                    <div className="flex items-center gap-1.5">
                      <BookMarked size={10} className="text-muted-foreground" />
                      <span>🔖 Definitions & Glossary</span>
                    </div>
                    <span className="text-[7px] uppercase font-mono px-1 rounded-sm bg-muted border border-border">Sprint 8</span>
                  </div>
                </div>
              </div>

            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
