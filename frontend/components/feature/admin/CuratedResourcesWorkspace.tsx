import React, { useState, useEffect, useCallback } from "react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Folder,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Save,
  Link,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Search,
  Check,
  AlertTriangle,
  Globe,
  Settings,
  Edit,
  Eye,
  Menu,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  BookOpen
} from "lucide-react";

interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  icon: string;
  status: string;
  display_order: number;
}

interface LearningModule {
  id: string;
  track_id: string;
  title: string;
  sort_order: number;
}

interface CuratedResource {
  id: string;
  title: string;
  url: string;
  source: string;
  reason?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  category: string;
  provider: string;
  difficulty: string;
  is_official: boolean;
  type: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  display_order: number;
  description?: string;
}

interface Props {
  tracksList: LearningTrack[];
  fetchAllData: () => Promise<void>;
  onNavigateToTracks?: () => void;
}

export default function CuratedResourcesWorkspace({ tracksList, fetchAllData, onNavigateToTracks }: Props) {
  // Tree state management
  const [trackModulesMap, setTrackModulesMap] = useState<Record<string, LearningModule[]>>({});
  const [modulePagesMap, setModulePagesMap] = useState<Record<string, any[]>>({});
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>("");

  // Resource lists
  const [pageResources, setPageResources] = useState<CuratedResource[]>([]);
  const [loadingResources, setLoadingResources] = useState<boolean>(false);

  // Editor states
  const [editingResource, setEditingResource] = useState<Partial<CuratedResource> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [savingResource, setSavingResource] = useState<boolean>(false);

  // Drag and drop sorting states
  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // Expand/collapse state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("devarc_resource_tree_expanded");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const updated = { ...prev, [nodeId]: !prev[nodeId] };
      if (typeof window !== "undefined") {
        localStorage.setItem("devarc_resource_tree_expanded", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  // Load modules lazily on-demand
  const loadTrackModules = useCallback(async (trackId: string) => {
    try {
      const res = await api.get<ApiResponse<LearningModule[]>>(`/admin/tracks/${trackId}/modules`);
      if (res.data.success) {
        setTrackModulesMap(prev => ({
          ...prev,
          [trackId]: res.data.data.sort((a, b) => a.sort_order - b.sort_order)
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load modules for track.");
    }
  }, []);

  // Load pages lazily on-demand
  const loadModulePages = useCallback(async (moduleId: string) => {
    try {
      const res = await api.get<ApiResponse<any[]>>(`/admin/modules/${moduleId}/pages`);
      if (res.data.success) {
        setModulePagesMap(prev => ({
          ...prev,
          [moduleId]: res.data.data.sort((a, b) => a.display_order - b.display_order)
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pages for module.");
    }
  }, []);

  // Handlers for independent toggle in tree
  const handleToggleTrack = useCallback((trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(trackId);
    if (!trackModulesMap[trackId]) {
      loadTrackModules(trackId);
    }
  }, [trackModulesMap, toggleNode, loadTrackModules]);

  const handleToggleModule = useCallback((moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(moduleId);
    if (!modulePagesMap[moduleId]) {
      loadModulePages(moduleId);
    }
  }, [modulePagesMap, toggleNode, loadModulePages]);

  // Load modules for expanded tracks on mount / change
  useEffect(() => {
    if (tracksList.length > 0) {
      tracksList.forEach(track => {
        if (expandedNodes[track.id] && !trackModulesMap[track.id]) {
          loadTrackModules(track.id);
        }
      });
    }
  }, [tracksList, expandedNodes, trackModulesMap, loadTrackModules]);

  // Load pages for expanded modules on mount / change
  useEffect(() => {
    tracksList.forEach(track => {
      const mods = trackModulesMap[track.id] || [];
      mods.forEach(mod => {
        if (expandedNodes[mod.id] && !modulePagesMap[mod.id]) {
          loadModulePages(mod.id);
        }
      });
    });
  }, [tracksList, trackModulesMap, expandedNodes, modulePagesMap, loadModulePages]);

  // Fetch page resources when a page is selected
  const fetchPageResources = useCallback(async (pageId: string) => {
    setLoadingResources(true);
    try {
      const res = await api.get<ApiResponse<CuratedResource[]>>(`/admin/pages/${pageId}/resources`);
      if (res.data.success) {
        setPageResources(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch resources for selected page.");
    } finally {
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPageId) {
      fetchPageResources(selectedPageId);
      setEditingResource(null);
      setIsCreatingNew(false);
    } else {
      setPageResources([]);
    }
  }, [selectedPageId, fetchPageResources]);

  // Handle resource selection
  const handleSelectResource = (res: CuratedResource) => {
    setEditingResource({ ...res });
    setIsCreatingNew(false);
  };

  // Start new resource creation
  const handleStartCreate = () => {
    if (!selectedPageId) {
      toast.error("Please select a page first.");
      return;
    }
    setIsCreatingNew(true);
    setEditingResource({
      title: "",
      url: "",
      provider: "",
      type: "Official Documentation",
      status: "PUBLISHED",
      difficulty: "beginner",
      is_official: false,
      description: "",
      reason: "",
      tags: [],
      display_order: pageResources.length > 0 ? Math.max(...pageResources.map(r => r.display_order)) + 1 : 1
    });
  };

  // Submit resource save/update
  const handleSaveResource = async () => {
    if (!editingResource || !selectedPageId) return;

    if (!editingResource.title?.trim()) {
      toast.error("Title cannot be empty.");
      return;
    }
    if (!editingResource.url?.trim()) {
      toast.error("URL cannot be empty.");
      return;
    }
    if (!editingResource.provider?.trim()) {
      toast.error("Provider cannot be empty.");
      return;
    }

    // Regexp format check
    const urlString = editingResource.url.trim();
    if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
      toast.error("Invalid URL format: Must start with http:// or https:// protocol.");
      return;
    }

    setSavingResource(true);
    try {
      if (isCreatingNew) {
        const res = await api.post<ApiResponse<CuratedResource>>(`/admin/pages/${selectedPageId}/resources`, editingResource);
        if (res.data.success) {
          toast.success("Resource created successfully!");
          fetchPageResources(selectedPageId);
          setEditingResource(null);
          setIsCreatingNew(false);
        }
      } else {
        const res = await api.put<ApiResponse<CuratedResource>>(`/admin/resources/${editingResource.id}`, editingResource);
        if (res.data.success) {
          toast.success("Resource updated successfully!");
          fetchPageResources(selectedPageId);
          setEditingResource(null);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to save curated resource.";
      toast.error(errMsg);
    } finally {
      setSavingResource(false);
    }
  };

  // Delete curated resource
  const handleDeleteResource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this resource?")) return;

    try {
      await api.delete(`/admin/resources/${id}`);
      toast.success("Resource deleted successfully!");
      if (selectedPageId) {
        fetchPageResources(selectedPageId);
      }
      if (editingResource?.id === id) {
        setEditingResource(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete resource.");
    }
  };

  // Helper breadcrumb resolver
  const getBreadcrumbs = () => {
    if (!selectedPageId) return "";
    let trackTitle = "";
    let moduleTitle = "";
    let pageTitle = "";

    for (const track of tracksList) {
      const mods = trackModulesMap[track.id] || [];
      for (const m of mods) {
        const pgs = modulePagesMap[m.id] || [];
        const foundPg = pgs.find(p => p.id === selectedPageId);
        if (foundPg) {
          trackTitle = track.title;
          moduleTitle = m.title;
          pageTitle = foundPg.title;
          break;
        }
      }
    }
    return `${trackTitle} > ${moduleTitle} > ${pageTitle}`;
  };

  // Drag and drop callbacks
  const handleResourceDragStart = (e: React.DragEvent, id: string) => {
    setDraggedResourceId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleResourceDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverTargetId(id);
  };

  const handleResourceDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedResourceId || draggedResourceId === targetId) return;

    const activeResCopy = [...pageResources];
    const dragIdx = activeResCopy.findIndex(r => r.id === draggedResourceId);
    const targetIdx = activeResCopy.findIndex(r => r.id === targetId);

    if (dragIdx === -1 || targetIdx === -1) return;

    const [removed] = activeResCopy.splice(dragIdx, 1);
    activeResCopy.splice(targetIdx, 0, removed);

    const updatedList = activeResCopy.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));

    setPageResources(updatedList);
    setDraggedResourceId(null);
    setDragOverTargetId(null);

    try {
      await api.post(`/admin/pages/${selectedPageId}/resources/reorder`, {
        orders: updatedList.map(r => ({ id: r.id, display_order: r.display_order }))
      });
      toast.success("Resource order updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to commit resource sorting change.");
    }
  };

  // Helper to determine if track matches treeSearchQuery
  const isTrackVisible = useCallback((track: LearningTrack) => {
    if (!treeSearchQuery) return true;
    const query = treeSearchQuery.toLowerCase();
    if (track.title.toLowerCase().includes(query)) return true;
    const trackModules = trackModulesMap[track.id] || [];
    return trackModules.some(m => {
      if (m.title.toLowerCase().includes(query)) return true;
      const modPages = modulePagesMap[m.id] || [];
      return modPages.some(p => p.title.toLowerCase().includes(query));
    });
  }, [treeSearchQuery, trackModulesMap, modulePagesMap]);

  const isModuleVisible = useCallback((mod: LearningModule) => {
    if (!treeSearchQuery) return true;
    const query = treeSearchQuery.toLowerCase();
    if (mod.title.toLowerCase().includes(query)) return true;
    const modPages = modulePagesMap[mod.id] || [];
    return modPages.some(p => p.title.toLowerCase().includes(query));
  }, [treeSearchQuery, modulePagesMap]);

  const isPageVisible = useCallback((page: any) => {
    if (!treeSearchQuery) return true;
    return page.title.toLowerCase().includes(treeSearchQuery.toLowerCase());
  }, [treeSearchQuery]);

  const renderCenterColumn = () => {
    if (!selectedPageId) {
      if (selectedModuleId) {
        // Find active module metadata
        const activeModule = tracksList
          .flatMap(t => trackModulesMap[t.id] || [])
          .find(m => m.id === selectedModuleId);
        const activeModulePages = modulePagesMap[selectedModuleId] || [];

        if (activeModulePages.length === 0) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
              <Folder className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-foreground">Empty Lesson Module</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[320px] mb-4">
                This study module currently has no lesson pages. Curated resources must be bound to pages to be active in the learner's syllabus.
              </p>
              {onNavigateToTracks && (
                <button
                  onClick={onNavigateToTracks}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-light text-primary-foreground rounded-lg px-4 py-2 text-xs font-semibold transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create First Lesson Page
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                Module Hub View
              </div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 mt-1">
                <Folder size={15} className="text-primary" />
                {activeModule?.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select one of the learning pages inside this module to configure its specific reference materials.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Lesson Pages in Module</div>
              {activeModulePages.map((pg) => (
                <div
                  key={pg.id}
                  onClick={() => setSelectedPageId(pg.id)}
                  className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-muted/50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText size={15} className="text-muted-foreground group-hover:text-primary transition shrink-0" />
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition truncate">{pg.title}</span>
                  </div>
                  <div className="text-[10px] text-primary group-hover:underline flex items-center gap-1">
                    Configure Reference
                    <ChevronRight size={10} />
                  </div>
                </div>
              ))}
              <div className="pt-2">
                {onNavigateToTracks && (
                  <button
                    onClick={onNavigateToTracks}
                    className="text-[11px] text-muted-foreground hover:text-primary underline flex items-center gap-1 transition"
                  >
                    <Plus size={10} />
                    Need another page? Create lesson page
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <Globe className="h-10 w-10 text-zinc-650 mb-3 animate-pulse" />
            {onNavigateToTracks && (
              <button
                onClick={onNavigateToTracks}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-light text-primary-foreground rounded-lg px-4 py-2 text-xs font-semibold transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First Lesson Page
              </button>
            )}
          </div>
        );
      }
    }

    return (
      <div className="flex-1 flex flex-col min-w-0">
        {/* Headers */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest truncate font-mono">
              {getBreadcrumbs()}
            </div>
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-light text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Reference Card
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingResources ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading resources...</div>
          ) : pageResources.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-12 text-center text-xs text-muted-foreground space-y-3">
              <p>No reference cards assigned to this page.</p>
              <button
                onClick={handleStartCreate}
                className="inline-flex items-center gap-1 bg-primary/20 hover:bg-primary/30 border border-primary/35 text-primary text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
              >
                <Plus size={12} /> Add First Reference Card
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {pageResources.map((res, index) => {
                const isOver = dragOverTargetId === res.id;
                const isDraft = res.status === "DRAFT";
                const isArchived = res.status === "ARCHIVED";
                const isBeingEdited = editingResource && editingResource.id === res.id;

                return (
                  <div
                    key={res.id}
                    draggable
                    onDragStart={(e) => handleResourceDragStart(e, res.id)}
                    onDragOver={(e) => handleResourceDragOver(e, res.id)}
                    onDrop={(e) => handleResourceDrop(e, res.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      isBeingEdited
                        ? "bg-primary/10 border-primary/50 shadow-sm"
                        : isOver
                        ? "border-primary bg-primary/5 border-dashed"
                        : "bg-card border-border hover:bg-muted/50 hover:border-border"
                    } ${isDraft ? "opacity-75" : ""} ${isArchived ? "opacity-55" : ""}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {/* Drag handle */}
                      <div className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <Menu className="h-4 w-4 shrink-0" />
                      </div>

                      <div className="flex flex-col truncate">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-semibold text-foreground text-xs truncate max-w-[200px]">
                            {res.title}
                          </span>
                          <span className="text-[9px] bg-muted border border-border text-muted-foreground px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide">
                            {res.type}
                          </span>
                          
                          {/* Status Badges */}
                          {isDraft && (
                            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                              DRAFT
                            </span>
                          )}
                          {isArchived && (
                            <span className="text-[9px] bg-red-950/40 text-red-500 border border-red-900/50 px-1.5 py-0.5 rounded">
                              ARCHIVED
                            </span>
                          )}
                          {res.status === "PUBLISHED" && (
                            <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/50">
                              PUBLISHED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                          <span className="font-semibold text-muted-foreground">{res.provider}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="truncate max-w-[220px] text-muted-foreground/70 font-mono">{res.url}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => handleSelectResource(res)}
                        className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition"
                        title="Edit details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition flex items-center"
                        title="Test Link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={(e) => handleDeleteResource(res.id, e)}
                        className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-170px)] bg-card/30 border border-border rounded-xl overflow-hidden text-foreground">
      
      {/* 1. Sidebar Tree Pane */}
      <div className="w-[325px] shrink-0 border-r border-border bg-card/50 flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Curriculum Tree</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search syllabus..."
              className="w-full bg-background border border-border rounded-lg py-1.5 pl-8 pr-7 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              value={treeSearchQuery}
              onChange={(e) => setTreeSearchQuery(e.target.value)}
            />
            {treeSearchQuery && (
              <button 
                onClick={() => setTreeSearchQuery("")}
                className="absolute right-2.5 top-2 hover:text-foreground text-muted-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
 
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {tracksList.filter(isTrackVisible).map((track) => (
            <TrackNode
              key={track.id}
              track={track}
              trackModules={trackModulesMap[track.id] || []}
              modulePagesMap={modulePagesMap}
              expandedNodes={expandedNodes}
              treeSearchQuery={treeSearchQuery}
              selectedTrackId={selectedTrackId}
              selectedModuleId={selectedModuleId}
              selectedPageId={selectedPageId}
              onToggleTrack={handleToggleTrack}
              onToggleModule={handleToggleModule}
              onSelectModule={(trackId, moduleId) => {
                setSelectedTrackId(trackId);
                setSelectedModuleId(moduleId);
                setSelectedPageId(null);
              }}
              onSelectPage={(trackId, moduleId, pageId) => {
                setSelectedTrackId(trackId);
                setSelectedModuleId(moduleId);
                setSelectedPageId(pageId);
              }}
              isModuleVisible={isModuleVisible}
              isPageVisible={isPageVisible}
            />
          ))}
        </div>
      </div>

      {/* 2. Center Resource Inventory Grid */}
      <div className="flex-1 bg-background/30 flex flex-col min-h-0 border-r border-border">
        {renderCenterColumn()}
      </div>

      {/* 3. Right Form Editor Panel */}
      <div className="w-[380px] border-l border-border bg-card/50 flex flex-col p-4 overflow-y-auto">
        {!editingResource ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center h-full">
            <Settings className="h-8 w-8 text-muted-foreground/40 mb-2 animate-spin-slow" />
            <p className="text-xs font-semibold text-muted-foreground">Properties Pane</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
              Select any curated resource card or click Add Card to manage reference metadata.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isCreatingNew ? "Create Reference Card" : "Configure Reference"}
            </h3>

            {/* Title field */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Title *</label>
              <input
                type="text"
                placeholder="e.g. React Hooks API Reference"
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary transition-all"
                value={editingResource.title || ""}
                onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
              />
            </div>

            {/* URL field with preview actions */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Url Link *</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="https://react.dev/reference/react"
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-foreground font-mono text-[11px] focus:outline-none focus:border-primary transition-all"
                  value={editingResource.url || ""}
                  onChange={(e) => setEditingResource({ ...editingResource, url: e.target.value })}
                />
                {editingResource.url && (
                  <a
                    href={editingResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
                    title="Preview Resource Link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Provider field */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Provider *</label>
              <input
                type="text"
                placeholder="e.g. React.dev, MDN, DevArc..."
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary transition-all"
                value={editingResource.provider || ""}
                onChange={(e) => setEditingResource({ ...editingResource, provider: e.target.value })}
              />
            </div>

            {/* Type Enum dropdown */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Resource Type</label>
              <select
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary transition-all"
                value={editingResource.type || "Official Documentation"}
                onChange={(e) => setEditingResource({ ...editingResource, type: e.target.value })}
              >
                <option value="Official Documentation">Official Documentation</option>
                <option value="Article">Article</option>
                <option value="Video">Video</option>
                <option value="GitHub">GitHub</option>
                <option value="Book">Book</option>
                <option value="Course">Course</option>
                <option value="Cheat Sheet">Cheat Sheet</option>
                <option value="Practice">Practice</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Lifecycle Status selector */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Status Lifecycle</label>
              <div className="grid grid-cols-3 gap-1">
                {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((statusVal) => {
                  const isCurStatus = editingResource.status === statusVal;
                  return (
                    <button
                      key={statusVal}
                      type="button"
                      onClick={() => setEditingResource({ ...editingResource, status: statusVal })}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        isCurStatus
                          ? statusVal === "DRAFT"
                            ? "bg-muted border-border text-foreground"
                            : statusVal === "PUBLISHED"
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/10 border-destructive text-destructive"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {statusVal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty & Official */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Difficulty</label>
                <select
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary transition-all"
                  value={editingResource.difficulty || "beginner"}
                  onChange={(e) => setEditingResource({ ...editingResource, difficulty: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="flex flex-col justify-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground font-bold select-none">
                  <input
                    type="checkbox"
                    checked={editingResource.is_official || false}
                    onChange={(e) => setEditingResource({ ...editingResource, is_official: e.target.checked })}
                    className="rounded bg-background border-border text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  Official Resource
                </label>
              </div>
            </div>

              {/* Description editorial notes */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Recommendation Notes</label>
                <textarea
                  placeholder="Explain the context or reason for curating this reference link..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary transition-all h-20 resize-none"
                  value={editingResource.description || ""}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveResource}
                  disabled={savingResource}
                  className="flex-1 bg-primary hover:bg-primary-light disabled:opacity-50 text-primary-foreground font-bold rounded-lg px-4 py-2 text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingResource ? "Saving..." : "Save Properties"}
                </button>
              
              <button
                type="button"
                onClick={() => {
                  setEditingResource(null);
                  setIsCreatingNew(false);
                }}
                className="bg-card border border-border text-muted-foreground hover:bg-muted font-bold rounded-lg px-4 py-2 text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
// Memoized tree node components for optimized rendering
interface TrackNodeProps {
  track: LearningTrack;
  trackModules: LearningModule[];
  modulePagesMap: Record<string, any[]>;
  expandedNodes: Record<string, boolean>;
  treeSearchQuery: string;
  selectedTrackId: string | null;
  selectedModuleId: string | null;
  selectedPageId: string | null;
  onToggleTrack: (trackId: string, e: React.MouseEvent) => void;
  onToggleModule: (moduleId: string, e: React.MouseEvent) => void;
  onSelectModule: (trackId: string, moduleId: string) => void;
  onSelectPage: (trackId: string, moduleId: string, pageId: string) => void;
  isModuleVisible: (mod: LearningModule) => boolean;
  isPageVisible: (page: any) => boolean;
}

const TrackNode = React.memo(function TrackNode({
  track,
  trackModules,
  modulePagesMap,
  expandedNodes,
  treeSearchQuery,
  selectedTrackId,
  selectedModuleId,
  selectedPageId,
  onToggleTrack,
  onToggleModule,
  onSelectModule,
  onSelectPage,
  isModuleVisible,
  isPageVisible
}: TrackNodeProps) {
  const trackMods = trackModules.filter(isModuleVisible);
  const isTrackExpanded = treeSearchQuery ? true : (expandedNodes[track.id] || false);

  return (
    <div className="space-y-1 bg-card border border-border rounded-xl p-2.5 min-w-0 overflow-hidden">
      {/* Track Row */}
      <div className="flex items-center justify-between gap-1 group min-w-0">
        <button
          onClick={(e) => onToggleTrack(track.id, e)}
          className={`flex-grow flex items-center gap-2 text-xs text-left font-bold transition-all min-w-0 ${
            selectedTrackId === track.id && !selectedModuleId ? "text-primary" : "text-foreground hover:text-primary"
          }`}
        >
          {isTrackExpanded ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
          <BookOpen size={13} className="text-muted-foreground shrink-0" />
          <span className="truncate flex-grow">{track.title}</span>
        </button>
      </div>

      {/* Modules Wrapper */}
      {isTrackExpanded && (
        <div className="ml-3 pl-2.5 border-l border-border space-y-2 mt-1 pt-1.5 min-w-0">
          {trackMods.map((mod) => {
            const modPages = (modulePagesMap[mod.id] || []).filter(isPageVisible);
            const isModExpanded = treeSearchQuery ? true : (expandedNodes[mod.id] || false);
            const isModSelected = selectedModuleId === mod.id && !selectedPageId;

            return (
              <div key={mod.id} className="space-y-1 rounded p-1 transition-all min-w-0">
                {/* Module Row */}
                <div 
                  className="flex items-center justify-between gap-1.5 group cursor-pointer min-w-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModule(track.id, mod.id);
                  }}
                >
                  <button
                    onClick={(e) => onToggleModule(mod.id, e)}
                    className={`flex-grow flex items-center gap-1.5 text-[11px] text-left hover:text-primary transition-all min-w-0 ${
                      isModSelected ? "text-primary font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {isModExpanded ? <ChevronDown size={12} className="text-primary shrink-0" /> : <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
                    <Folder size={11} className="text-muted-foreground shrink-0" />
                    <span className="truncate flex-grow">{mod.title}</span>
                  </button>
                </div>

                {/* Pages Wrapper */}
                {isModExpanded && (
                  <div className="ml-3 pl-2.5 border-l border-border space-y-1 mt-1 min-w-0">
                    {modPages.map((page) => {
                      const isSelected = selectedPageId === page.id;
                      return (
                        <div
                          key={page.id}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-lg text-[10px] group transition-all cursor-pointer min-w-0 ${
                            isSelected
                              ? "bg-primary/15 border border-primary/40 text-primary font-bold"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPage(track.id, mod.id, page.id);
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate min-w-0 flex-grow">
                            <FileText size={11} className={`${isSelected ? "text-primary" : "text-muted-foreground"} shrink-0`} />
                            <span className="truncate flex-grow">{page.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {trackMods.length === 0 && (
            <p className="text-[10px] text-muted-foreground/60 italic pl-5">No modules mapped.</p>
          )}
        </div>
      )}
    </div>
  );
});

// Internal Local Component Icons for Lucide fallback
function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
 
// Local UI menu icon
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
    </svg>
  );
}
